// Validates the YAML a `convertComposeSpec` run produces against
// compose_spec.json's structural rules: required fields, types, enums,
// patterns, and unknown keys. `frontend.md`'s Output panel is the intended
// caller — run this over `composeOutput` alongside the engine's own
// errors/warnings.
//
// Later passes (best practices, security) should add their own
// validateXxx-style checks over the same parsed `ComposeFile`, not grow this
// file — see the per-definition files in this folder (one per
// compose_spec.json `$defs` entry, named the same as their `$ref`).

import { parseDocument, LineCounter } from 'yaml'
import { validateComposeFile, type ComposeFile } from './composeFile'
import { resolvePosition } from './position'
import type { ValidationError } from './errors'

export interface ParseResult {
  /** The parsed YAML, cast to ComposeFile's shape. Present even when `errors` is non-empty. */
  spec?: ComposeFile
  errors: ValidationError[]
}

export function parseComposeYaml(yamlText: string): ParseResult {
  const lineCounter = new LineCounter()
  // parseDocument (unlike `parse`) never throws on invalid YAML — syntax
  // errors land in `doc.errors`, each already carrying a `linePos` since we
  // pass our own `lineCounter` (prettyErrors defaults to true).
  const doc = parseDocument(yamlText, { lineCounter })

  if (doc.errors.length > 0) {
    return {
      errors: doc.errors.map((e) => ({
        path: '$',
        type: 'parse',
        message: e.message,
        ...(e.linePos ? { line: e.linePos[0].line, col: e.linePos[0].col } : {}),
      })),
    }
  }

  const parsed: unknown = doc.toJS()
  if (parsed === null || parsed === undefined) return { errors: [] }

  const errors = validateComposeFile(parsed).map((error) => {
    const position = resolvePosition(doc, lineCounter, error.path)
    return position ? { ...error, ...position } : error
  })
  return { spec: parsed as ComposeFile, errors }
}

export type { ValidationError, ValidationErrorType } from './errors'
export type { ComposeFile } from './composeFile'
export { validateComposeFile } from './composeFile'
export type { Service } from './service'
export type { Job } from './job'
export type { Network } from './network'
export type { Volume } from './volume'
export type { Secret } from './secret'
export type { Config } from './config'
export type { Model } from './model'
export type { ContainerSpec } from './containerSpec'
export type { WorkloadSpec } from './workloadSpec'
