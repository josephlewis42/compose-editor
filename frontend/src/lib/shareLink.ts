// Encodes a Builder draft into a URL-safe string and back, with no backend
// involved: binary-encode the Application protobuf message, gzip it with
// the browser's native CompressionStream, then base64url-encode the bytes
// so the result is safe to drop straight into a route segment.

import { fromBinary, toBinary } from '@bufbuild/protobuf'
import { ApplicationSchema, type Application } from '@/gen/composeeditor/v1/spec_pb'

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function toStream(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
}

// lib.dom's CompressionStream/DecompressionStream types don't line up
// cleanly with ReadableStream<Uint8Array>'s generic across TS versions
// (BufferSource vs Uint8Array<ArrayBufferLike>) even though this is exactly
// their documented use — pipeThrough's argument is cast to route around it.
type BytePipe = ReadableWritablePair<Uint8Array, Uint8Array>

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = toStream(bytes).pipeThrough(new CompressionStream('gzip') as unknown as BytePipe)
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = toStream(bytes).pipeThrough(new DecompressionStream('gzip') as unknown as BytePipe)
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function encodeShareLink(app: Application): Promise<string> {
  const compressed = await gzip(toBinary(ApplicationSchema, app))
  return bytesToBase64Url(compressed)
}

export async function decodeShareLink(data: string): Promise<Application> {
  const bytes = await gunzip(base64UrlToBytes(data))
  return fromBinary(ApplicationSchema, bytes)
}
