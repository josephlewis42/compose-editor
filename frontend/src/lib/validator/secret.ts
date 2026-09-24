// #/$defs/secret

import { childPath, type ValidationError } from './errors'
import { checkAdditionalProperties, checkFieldType, checkType, validateExternal, validateListOrDict, type External, type ListOrDict } from './primitives'

export interface Secret {
  name?: string
  environment?: string
  file?: string
  external?: External
  labels?: ListOrDict
  driver?: string
  driver_opts?: Record<string, string | number>
  template_driver?: string
}

const KNOWN_KEYS = ['name', 'environment', 'file', 'external', 'labels', 'driver', 'driver_opts', 'template_driver']

export function validateSecret(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'name', ['string'], path, errors)
  checkFieldType(obj, 'environment', ['string'], path, errors)
  checkFieldType(obj, 'file', ['string'], path, errors)
  if (obj.external !== undefined) errors.push(...validateExternal(obj.external, childPath(path, 'external')))
  if (obj.labels !== undefined) errors.push(...validateListOrDict(obj.labels, childPath(path, 'labels')))
  checkFieldType(obj, 'driver', ['string'], path, errors)
  if (obj.driver_opts !== undefined) {
    const optsPath = childPath(path, 'driver_opts')
    const optsErr = checkType(obj.driver_opts, ['object'], optsPath)
    if (optsErr) {
      errors.push(optsErr)
    } else {
      errors.push(
        ...Object.entries(obj.driver_opts as Record<string, unknown>).flatMap(([key, entry]) => {
          const entryErr = checkType(entry, ['string', 'number'], childPath(optsPath, key))
          return entryErr ? [entryErr] : []
        }),
      )
    }
  }
  checkFieldType(obj, 'template_driver', ['string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, KNOWN_KEYS, path))
  return errors
}
