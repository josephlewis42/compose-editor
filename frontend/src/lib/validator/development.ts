// #/$defs/development (the compose file's `develop:` key)

import { childPath, type ValidationError } from './errors'
import { checkAdditionalProperties, checkFieldEnum, checkFieldType, checkRequired, checkType, validateStringOrList, type StringOrList } from './primitives'
import { validateServiceHook, type ServiceHook } from './hooks'

export type WatchAction = 'rebuild' | 'sync' | 'restart' | 'sync+restart' | 'sync+exec'

export interface WatchRule {
  ignore?: StringOrList
  include?: StringOrList
  path: string
  action: WatchAction
  target?: string
  exec?: ServiceHook
  initial_sync?: boolean
}

export interface Development {
  watch?: WatchRule[]
}

const WATCH_ACTIONS: WatchAction[] = ['rebuild', 'sync', 'restart', 'sync+restart', 'sync+exec']
const WATCH_KNOWN_KEYS = ['ignore', 'include', 'path', 'action', 'target', 'exec', 'initial_sync']

function validateWatchRule(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = checkRequired(obj, ['path', 'action'], path)
  if (obj.ignore !== undefined) errors.push(...validateStringOrList(obj.ignore, childPath(path, 'ignore')))
  if (obj.include !== undefined) errors.push(...validateStringOrList(obj.include, childPath(path, 'include')))
  checkFieldType(obj, 'path', ['string'], path, errors)
  checkFieldEnum(obj, 'action', WATCH_ACTIONS, path, errors)
  checkFieldType(obj, 'target', ['string'], path, errors)
  if (obj.exec !== undefined) errors.push(...validateServiceHook(obj.exec, childPath(path, 'exec')))
  checkFieldType(obj, 'initial_sync', ['boolean'], path, errors)
  errors.push(...checkAdditionalProperties(obj, WATCH_KNOWN_KEYS, path))
  return errors
}

export function validateDevelopment(value: unknown, path: string): ValidationError[] {
  if (value === null) return []
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  if (obj.watch !== undefined) {
    const watchPath = childPath(path, 'watch')
    const watchErr = checkType(obj.watch, ['array'], watchPath)
    if (watchErr) {
      errors.push(watchErr)
    } else {
      errors.push(...(obj.watch as unknown[]).flatMap((rule, i) => validateWatchRule(rule, `${watchPath}[${i}]`)))
    }
  }
  errors.push(...checkAdditionalProperties(obj, ['watch'], path))
  return errors
}
