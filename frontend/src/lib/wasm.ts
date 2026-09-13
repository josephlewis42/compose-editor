// Loads the Go template engine compiled to WASM (pkg/browser/wasm) and
// exposes a typed wrapper around the `convertComposeSpec` global it
// installs, per design/frontend.md. `convertComposeSpec` exchanges
// binary-encoded composeeditor.v1.ConvertInput/ConvertOutput messages
// (Uint8Array), not JSON.

import { create, fromBinary, fromJson, toBinary, type JsonValue } from '@bufbuild/protobuf'
import { ValueSchema } from '@bufbuild/protobuf/wkt'
import { ConvertInputSchema, ConvertOutputSchema, type Message } from '@/gen/composeeditor/v1/wasm_pb'

declare global {
  interface Window {
    Go: new () => {
      importObject: WebAssembly.Imports
      run(instance: WebAssembly.Instance): Promise<void>
    }
    convertComposeSpec?: (input: Uint8Array) => Uint8Array
  }
}

export interface ConvertInput {
  template: string
  values: Record<string, unknown>
}

export interface ConvertOutput {
  compose_output: string
  errors: Message[]
  warnings: Message[]
}

let loading: Promise<void> | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`couldn't load ${src}`))
    document.body.appendChild(script)
  })
}

async function ensureLoaded(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      await loadScript(`${import.meta.env.BASE_URL}gen/wasm_exec.js`)
      const go = new window.Go()
      const resp = await fetch(`${import.meta.env.BASE_URL}gen/composeeditor.wasm`)
      const { instance } = await WebAssembly.instantiateStreaming(resp, go.importObject)
      void go.run(instance)
      // The Go program registers convertComposeSpec synchronously at the
      // top of main(), but wait a tick so callers never race it.
      await new Promise((resolve) => setTimeout(resolve, 0))
    })()
  }
  return loading
}

export async function convertComposeSpec(input: ConvertInput): Promise<ConvertOutput> {
  await ensureLoaded()
  if (!window.convertComposeSpec) {
    throw new Error('convertComposeSpec was not installed by the wasm module')
  }

  const values: Record<string, ReturnType<typeof fromJson<typeof ValueSchema>>> = {}
  for (const [key, value] of Object.entries(input.values)) {
    values[key] = fromJson(ValueSchema, (value ?? null) as JsonValue)
  }

  const message = create(ConvertInputSchema, { template: input.template, values })
  const resultBytes = window.convertComposeSpec(toBinary(ConvertInputSchema, message))
  const result = fromBinary(ConvertOutputSchema, resultBytes)

  return {
    compose_output: result.composeOutput,
    errors: result.errors,
    warnings: result.warnings,
  }
}
