// #/$defs/service_hook (post_start / pre_stop / develop.watch[].exec)

import { childPath, type ValidationError } from './errors'
import { checkAdditionalProperties, checkFieldType, checkRequired, checkType, validateCommand, validateListOrDict, type Command, type ListOrDict } from './primitives'

export interface ServiceHook {
  command: Command
  user?: string
  privileged?: boolean | string
  working_dir?: string
  environment?: ListOrDict
}

const KNOWN_KEYS = ['command', 'user', 'privileged', 'working_dir', 'environment']

export function validateServiceHook(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = checkRequired(obj, ['command'], path)
  if (obj.command !== undefined) errors.push(...validateCommand(obj.command, childPath(path, 'command')))
  checkFieldType(obj, 'user', ['string'], path, errors)
  checkFieldType(obj, 'privileged', ['boolean', 'string'], path, errors)
  checkFieldType(obj, 'working_dir', ['string'], path, errors)
  if (obj.environment !== undefined) errors.push(...validateListOrDict(obj.environment, childPath(path, 'environment')))
  errors.push(...checkAdditionalProperties(obj, KNOWN_KEYS, path))
  return errors
}
