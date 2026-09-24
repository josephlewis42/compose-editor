// #/$defs/volume

import { childPath, type ValidationError } from './errors'
import { checkAdditionalProperties, checkFieldType, checkType, validateExternal, validateListOrDict, type External, type ListOrDict } from './primitives'

export interface Volume {
  name?: string
  driver?: string
  driver_opts?: Record<string, string | number>
  external?: External
  labels?: ListOrDict
}

const KNOWN_KEYS = ['name', 'driver', 'driver_opts', 'external', 'labels']

export function validateVolume(value: unknown, path: string): ValidationError[] {
  if (value === null) return []
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'name', ['string'], path, errors)
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
  if (obj.external !== undefined) errors.push(...validateExternal(obj.external, childPath(path, 'external'), true))
  if (obj.labels !== undefined) errors.push(...validateListOrDict(obj.labels, childPath(path, 'labels')))
  errors.push(...checkAdditionalProperties(obj, KNOWN_KEYS, path))
  return errors
}
