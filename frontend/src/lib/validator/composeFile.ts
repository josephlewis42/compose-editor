// Root of compose_spec.json.

import { type ValidationError, childPath, indexPath } from './errors'
import { checkAdditionalProperties, checkFieldType, checkType, validateMapOf } from './primitives'
import { type Include, validateInclude } from './include'
import { type Service, validateService } from './service'
import { type Model, validateModel } from './model'
import { type Network, validateNetwork } from './network'
import { type Volume, validateVolume } from './volume'
import { type Secret, validateSecret } from './secret'
import { type Config, validateConfig } from './config'
import { type Job, validateJob } from './job'

export interface ComposeFile {
  /** @deprecated declared for backward compatibility, ignored */
  version?: string
  name?: string
  include?: Include[]
  services?: Record<string, Service>
  models?: Record<string, Model>
  networks?: Record<string, Network>
  volumes?: Record<string, Volume>
  secrets?: Record<string, Secret>
  configs?: Record<string, Config>
  jobs?: Record<string, Job>
}

const NAME_PATTERN = /^[a-zA-Z0-9._-]+$/

const KNOWN_KEYS = ['version', 'name', 'include', 'services', 'models', 'networks', 'volumes', 'secrets', 'configs', 'jobs']

export function validateComposeFile(value: unknown, path = '$'): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) {return [err]}
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []

  checkFieldType(obj, 'version', ['string'], path, errors)
  checkFieldType(obj, 'name', ['string'], path, errors)

  if (obj.include !== undefined) {
    const includePath = childPath(path, 'include')
    const includeErr = checkType(obj.include, ['array'], includePath)
    if (includeErr) {
      errors.push(includeErr)
    } else {
      errors.push(...(obj.include as unknown[]).flatMap((item, i) => validateInclude(item, indexPath(includePath, i))))
    }
  }

  if (obj.services !== undefined) {errors.push(...validateMapOf(obj.services, childPath(path, 'services'), NAME_PATTERN, validateService))}
  if (obj.models !== undefined) {errors.push(...validateMapOf(obj.models, childPath(path, 'models'), NAME_PATTERN, validateModel))}
  if (obj.networks !== undefined) {errors.push(...validateMapOf(obj.networks, childPath(path, 'networks'), NAME_PATTERN, validateNetwork))}
  if (obj.volumes !== undefined) {errors.push(...validateMapOf(obj.volumes, childPath(path, 'volumes'), NAME_PATTERN, validateVolume))}
  if (obj.secrets !== undefined) {errors.push(...validateMapOf(obj.secrets, childPath(path, 'secrets'), NAME_PATTERN, validateSecret))}
  if (obj.configs !== undefined) {errors.push(...validateMapOf(obj.configs, childPath(path, 'configs'), NAME_PATTERN, validateConfig))}
  if (obj.jobs !== undefined) {errors.push(...validateMapOf(obj.jobs, childPath(path, 'jobs'), NAME_PATTERN, validateJob))}

  errors.push(...checkAdditionalProperties(obj, KNOWN_KEYS, path))
  return errors
}
