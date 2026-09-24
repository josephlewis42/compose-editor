// #/$defs/config

import { childPath, type ValidationError } from './errors'
import { checkAdditionalProperties, checkFieldType, checkType, validateExternal, validateListOrDict, type External, type ListOrDict } from './primitives'

export interface Config {
  name?: string
  content?: string
  environment?: string
  file?: string
  external?: External
  labels?: ListOrDict
  template_driver?: string
}

const KNOWN_KEYS = ['name', 'content', 'environment', 'file', 'external', 'labels', 'template_driver']

export function validateConfig(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'name', ['string'], path, errors)
  checkFieldType(obj, 'content', ['string'], path, errors)
  checkFieldType(obj, 'environment', ['string'], path, errors)
  checkFieldType(obj, 'file', ['string'], path, errors)
  if (obj.external !== undefined) errors.push(...validateExternal(obj.external, childPath(path, 'external')))
  if (obj.labels !== undefined) errors.push(...validateListOrDict(obj.labels, childPath(path, 'labels')))
  checkFieldType(obj, 'template_driver', ['string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, KNOWN_KEYS, path))
  return errors
}
