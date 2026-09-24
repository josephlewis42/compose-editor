// #/$defs/include

import { childPath, type ValidationError } from './errors'
import { checkAdditionalProperties, checkFieldType, checkType, validateStringOrList, type StringOrList } from './primitives'

export interface IncludeDetail {
  path?: StringOrList
  env_file?: StringOrList
  project_directory?: string
}
export type Include = string | IncludeDetail

const KNOWN_KEYS = ['path', 'env_file', 'project_directory']

export function validateInclude(value: unknown, path: string): ValidationError[] {
  if (typeof value === 'string') return []
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  if (obj.path !== undefined) errors.push(...validateStringOrList(obj.path, childPath(path, 'path')))
  if (obj.env_file !== undefined) errors.push(...validateStringOrList(obj.env_file, childPath(path, 'env_file')))
  checkFieldType(obj, 'project_directory', ['string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, KNOWN_KEYS, path, []))
  return errors
}
