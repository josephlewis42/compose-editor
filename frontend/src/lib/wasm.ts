// Loads the Go template engine compiled to WASM (pkg/browser/wasm) and
// Exposes a typed wrapper around the `convertComposeSpec` global it
// Installs, per design/frontend.md. `convertComposeSpec` exchanges
// Binary-encoded composeeditor.v1.ConvertInput/ConvertOutput messages
// (Uint8Array), not JSON.

import { type JsonValue, create, fromBinary, fromJson, toBinary } from '@bufbuild/protobuf'
import { ValueSchema } from '@bufbuild/protobuf/wkt'
import { ConvertInputSchema, ConvertOutputSchema, type Message } from '@/gen/composeeditor/v1/wasm_pb'
// Vite's `?init` wasm helper instantiates via fetch()/instantiateStreaming
// In the browser and via node:fs under SSR/Vitest, so this loads correctly
// In both a real browser and a Node-based test run.
import initWasm from '@/gen/composeeditor.wasm?init'
// Import execURL from '@/gen/wasm_exec.js?url'
import '@/gen/wasm_exec.js'


declare global {
  // eslint-disable-next-line no-var
  var Go: new () => {
    importObject: WebAssembly.Imports
    // eslint-disable-next-line method-signature-style
    run(instance: WebAssembly.Instance): Promise<void>
  },
  // eslint-disable-next-line no-var
   convertComposeSpec: ((input: Uint8Array) => Uint8Array) | undefined
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

async function ensureLoaded(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      // Await loadScript(execURL)
      const go = new globalThis.Go()
      const instance = await initWasm(go.importObject)
      void go.run(instance)
      // The Go program registers convertComposeSpec synchronously at the
      // Top of main(), but wait a tick so callers never race it.
      await new Promise((resolve) => setTimeout(resolve, 0))
    })()
  }
  return loading
}

export async function convertComposeSpec(input: ConvertInput): Promise<ConvertOutput> {
  await ensureLoaded()
  if (!globalThis.convertComposeSpec) {
    throw new Error('convertComposeSpec was not installed by the wasm module')
  }

  const values: Record<string, ReturnType<typeof fromJson<typeof ValueSchema>>> = {}
  for (const [key, value] of Object.entries(input.values)) {
    values[key] = fromJson(ValueSchema, (value ?? null) as JsonValue)
  }

  const message = create(ConvertInputSchema, { template: input.template, values }),
   resultBytes = globalThis.convertComposeSpec(toBinary(ConvertInputSchema, message)),
   result = fromBinary(ConvertOutputSchema, resultBytes)

  return {
    compose_output: result.composeOutput,
    errors: result.errors,
    warnings: result.warnings,
  }
}
