// #/$defs/model

import { type ValidationError } from './errors'
import { checkAdditionalProperties, checkFieldType, checkRequired, checkType, validateListOfStrings } from './primitives'

export interface Model {
  name?: string
  model: string
  context_size?: number
  runtime_flags?: string[]
}

const KNOWN_KEYS = ['name', 'model', 'context_size', 'runtime_flags']

export function validateModel(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = checkRequired(obj, ['model'], path)
  checkFieldType(obj, 'name', ['string'], path, errors)
  checkFieldType(obj, 'model', ['string'], path, errors)
  checkFieldType(obj, 'context_size', ['integer'], path, errors)
  if (obj.runtime_flags !== undefined) errors.push(...validateListOfStrings(obj.runtime_flags, `${path}.runtime_flags`))
  errors.push(...checkAdditionalProperties(obj, KNOWN_KEYS, path))
  return errors
}
