#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
// Renders one spec's template to stdout, for debugging a spec without the
// editor UI. See specs/README.md#debugging-a-spec.
//
//   frontend/scripts/render.ts SLUG [VALUES_JSON|-]
//
// VALUES_JSON is an object of form values overriding the spec's defaults,
// e.g. '{"port": 8080}'. Pass - to read it from stdin.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createServer } from 'vite'

// The subset of src/lib/render.ts used here, declared locally because that
// module is typechecked under the app's tsconfig, not this one.
interface RenderModule {
  renderSpec: (slug: string, overrides: Record<string, unknown>) => Promise<{
    compose_output: string
    errors: { message: string }[]
    warnings: { message: string }[]
  }>
}

const EXIT_OK = 0
const EXIT_ERROR = 1
const EXIT_USAGE = 2
const STDIN_FD = 0
const MAX_ARGS = 2
const USAGE = 'usage: frontend/scripts/render.ts SLUG [VALUES_JSON|-]'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

// Returns the parsed overrides, or undefined after printing why they're
// invalid.
function parseOverrides(valuesArg: string): Record<string, unknown> | undefined {
  const valuesJSON = valuesArg === '-' ? readFileSync(STDIN_FD, 'utf8') : valuesArg
  try {
    return JSON.parse(valuesJSON) as Record<string, unknown>
  } catch (error) {
    console.error(`couldn't parse values JSON: ${errorMessage(error)}`)
    return undefined
  }
}

async function main(args: string[]): Promise<number> {
  const [slug, valuesArg = '{}'] = args
  if (!slug || args.length > MAX_ARGS) {
    console.error(USAGE)
    return EXIT_USAGE
  }

  const overrides = parseOverrides(valuesArg)
  if (!overrides) {
    return EXIT_USAGE
  }

  // Keep stdout clean for the rendered YAML: the Go wasm runtime's own
  // fmt.Print* output arrives via console.log.
  console.log = console.error

  // Load the app's own modules through Vite so path aliases, the spec glob
  // and the wasm import resolve exactly as they do in the browser.
  const server = await createServer({
    root: path.join(import.meta.dirname, '..'),
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true },
  })

  try {
    const { renderSpec } = await server.ssrLoadModule('/src/lib/render.ts') as RenderModule
    const output = await renderSpec(slug, overrides)

    for (const warning of output.warnings) {
      console.error(`warning: ${warning.message}`)
    }
    if (output.errors.length > 0) {
      for (const error of output.errors) {
        console.error(`error: ${error.message}`)
      }
      return EXIT_ERROR
    }

    process.stdout.write(output.compose_output)
    return EXIT_OK
  } catch (error) {
    console.error(errorMessage(error))
    return EXIT_ERROR
  } finally {
    await server.close()
  }
}

// The Go wasm runtime keeps the event loop alive, so exit explicitly.
const [, , ...cliArgs] = process.argv
process.exit(await main(cliArgs))
