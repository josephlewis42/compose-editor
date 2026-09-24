// #/$defs/healthcheck

import { type ValidationError } from './errors'
import { checkAdditionalProperties, checkFieldType, checkType, validateListOfStrings } from './primitives'

export interface Healthcheck {
  disable?: boolean | string
  interval?: string
  retries?: number | string
  test?: string | string[]
  timeout?: string
  start_period?: string
  start_interval?: string
}

const KNOWN_KEYS = ['disable', 'interval', 'retries', 'test', 'timeout', 'start_period', 'start_interval']

export function validateHealthcheck(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'disable', ['boolean', 'string'], path, errors)
  checkFieldType(obj, 'interval', ['string'], path, errors)
  checkFieldType(obj, 'retries', ['number', 'string'], path, errors)
  checkFieldType(obj, 'timeout', ['string'], path, errors)
  checkFieldType(obj, 'start_period', ['string'], path, errors)
  checkFieldType(obj, 'start_interval', ['string'], path, errors)
  if (obj.test !== undefined && typeof obj.test !== 'string') {
    errors.push(...validateListOfStrings(obj.test, `${path}.test`))
  }
  errors.push(...checkAdditionalProperties(obj, KNOWN_KEYS, path))
  return errors
}
