// #/$defs/schedule

import { type ValidationError } from './errors'
import { checkAdditionalProperties, checkFieldEnum, checkFieldType, checkRequired, checkType } from './primitives'

export interface Schedule {
  cron: string
  timezone?: string
  concurrency?: 'forbid' | 'queue'
  missed_fires?: 'one' | 'skip'
}

const KNOWN_KEYS = ['cron', 'timezone', 'concurrency', 'missed_fires']

export function validateSchedule(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = checkRequired(obj, ['cron'], path)
  checkFieldType(obj, 'cron', ['string'], path, errors)
  checkFieldType(obj, 'timezone', ['string'], path, errors)
  checkFieldEnum(obj, 'concurrency', ['forbid', 'queue'], path, errors)
  checkFieldEnum(obj, 'missed_fires', ['one', 'skip'], path, errors)
  errors.push(...checkAdditionalProperties(obj, KNOWN_KEYS, path))
  return errors
}
