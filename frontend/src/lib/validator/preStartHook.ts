// #/$defs/pre_start_hook — allOf[container_spec] + per_replica, closed with
// unevaluatedProperties: false, i.e. the full container_spec shape plus one
// extra field.

import { type ValidationError } from './errors'
import { CONTAINER_SPEC_KNOWN_KEYS, validateContainerSpecFields, type ContainerSpec } from './containerSpec'
import { checkAdditionalProperties, checkFieldType, checkType } from './primitives'

export type PreStartHook = ContainerSpec & {
  per_replica?: boolean | string
}

const KNOWN_KEYS = [...CONTAINER_SPEC_KNOWN_KEYS, 'per_replica']

export function validatePreStartHook(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = validateContainerSpecFields(obj, path)
  checkFieldType(obj, 'per_replica', ['boolean', 'string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, KNOWN_KEYS, path))
  return errors
}

export function validatePreStartHooks(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['array'], path)
  if (err) return [err]
  return (value as unknown[]).flatMap((item, i) => validatePreStartHook(item, `${path}[${i}]`))
}
