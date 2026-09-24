// #/$defs/service — allOf[container_spec, workload_spec] plus its own
// fields, closed with unevaluatedProperties: false.

import { childPath, indexPath, type ValidationError } from './errors'
import { CONTAINER_SPEC_KNOWN_KEYS, validateContainerSpecFields, type ContainerSpec } from './containerSpec'
import { WORKLOAD_SPEC_KNOWN_KEYS, validateWorkloadSpecFields, type WorkloadSpec } from './workloadSpec'
import { validateDeployment, type Deployment } from './deployment'
import { validateDevelopment, type Development } from './development'
import { validateServiceHook, type ServiceHook } from './hooks'
import { validatePreStartHooks, type PreStartHook } from './preStartHook'
import { checkAdditionalProperties, checkFieldPattern, checkFieldType, checkRequired, checkType, validateListOfStrings, type ListOfStrings } from './primitives'

export interface ProviderConfig {
  type: string
  options?: Record<string, string | number | boolean | (string | number | boolean)[]>
}

export interface ExtendsDetail {
  service: string
  file?: string
}
export type Extends = string | ExtendsDetail

export type Service = ContainerSpec &
  WorkloadSpec & {
    deploy?: Deployment
    develop?: Development
    profiles?: ListOfStrings
    restart?: string
    scale?: number | string
    attach?: boolean | string
    container_name?: string
    provider?: ProviderConfig
    extends?: Extends
    links?: string[]
    external_links?: string[]
    pre_start?: PreStartHook[]
    post_start?: ServiceHook[]
    pre_stop?: ServiceHook[]
  }

const CONTAINER_NAME_PATTERN = /[a-zA-Z0-9][a-zA-Z0-9_.-]+/

const SERVICE_OWN_KEYS = [
  'deploy',
  'develop',
  'profiles',
  'restart',
  'scale',
  'attach',
  'container_name',
  'provider',
  'extends',
  'links',
  'external_links',
  'pre_start',
  'post_start',
  'pre_stop',
]

const SERVICE_KNOWN_KEYS = [...CONTAINER_SPEC_KNOWN_KEYS, ...WORKLOAD_SPEC_KNOWN_KEYS, ...SERVICE_OWN_KEYS]

function validateProvider(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = checkRequired(obj, ['type'], path)
  checkFieldType(obj, 'type', ['string'], path, errors)
  if (obj.options !== undefined) {
    const optionsPath = childPath(path, 'options')
    const optionsErr = checkType(obj.options, ['object'], optionsPath)
    if (optionsErr) {
      errors.push(optionsErr)
    } else {
      errors.push(
        ...Object.entries(obj.options as Record<string, unknown>).flatMap(([key, entry]) => {
          const entryPath = childPath(optionsPath, key)
          if (Array.isArray(entry)) {
            return entry.flatMap((item, i) => {
              const itemErr = checkType(item, ['string', 'number', 'boolean'], indexPath(entryPath, i))
              return itemErr ? [itemErr] : []
            })
          }
          const entryErr = checkType(entry, ['string', 'number', 'boolean'], entryPath)
          return entryErr ? [entryErr] : []
        }),
      )
    }
  }
  errors.push(...checkAdditionalProperties(obj, ['type', 'options'], path))
  return errors
}

function validateExtends(value: unknown, path: string): ValidationError[] {
  if (typeof value === 'string') return []
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = checkRequired(obj, ['service'], path)
  checkFieldType(obj, 'service', ['string'], path, errors)
  checkFieldType(obj, 'file', ['string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, ['service', 'file'], path, []))
  return errors
}

function validateUniqueStringArray(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['array'], path)
  if (err) return [err]
  const items = value as unknown[]
  const errors: ValidationError[] = items.flatMap((item, i) => {
    const itemErr = checkType(item, ['string'], indexPath(path, i))
    return itemErr ? [itemErr] : []
  })
  const seen = new Set<string>()
  items.forEach((item, i) => {
    if (typeof item !== 'string') return
    if (seen.has(item)) errors.push({ path: indexPath(path, i), type: 'unique_items', message: `duplicate value ${JSON.stringify(item)}` })
    seen.add(item)
  })
  return errors
}

export function validateService(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = [...validateContainerSpecFields(obj, path), ...validateWorkloadSpecFields(obj, path)]

  if (obj.deploy !== undefined) errors.push(...validateDeployment(obj.deploy, childPath(path, 'deploy')))
  if (obj.develop !== undefined) errors.push(...validateDevelopment(obj.develop, childPath(path, 'develop')))
  if (obj.profiles !== undefined) errors.push(...validateListOfStrings(obj.profiles, childPath(path, 'profiles')))
  checkFieldType(obj, 'restart', ['string'], path, errors)
  checkFieldType(obj, 'scale', ['integer', 'string'], path, errors)
  checkFieldType(obj, 'attach', ['boolean', 'string'], path, errors)
  checkFieldPattern(obj, 'container_name', CONTAINER_NAME_PATTERN, path, errors)
  if (obj.provider !== undefined) errors.push(...validateProvider(obj.provider, childPath(path, 'provider')))
  if (obj.extends !== undefined) errors.push(...validateExtends(obj.extends, childPath(path, 'extends')))
  if (obj.links !== undefined) errors.push(...validateUniqueStringArray(obj.links, childPath(path, 'links')))
  if (obj.external_links !== undefined) errors.push(...validateUniqueStringArray(obj.external_links, childPath(path, 'external_links')))
  if (obj.pre_start !== undefined) errors.push(...validatePreStartHooks(obj.pre_start, childPath(path, 'pre_start')))
  if (obj.post_start !== undefined) {
    const p = childPath(path, 'post_start')
    const listErr = checkType(obj.post_start, ['array'], p)
    if (listErr) errors.push(listErr)
    else errors.push(...(obj.post_start as unknown[]).flatMap((item, i) => validateServiceHook(item, indexPath(p, i))))
  }
  if (obj.pre_stop !== undefined) {
    const p = childPath(path, 'pre_stop')
    const listErr = checkType(obj.pre_stop, ['array'], p)
    if (listErr) errors.push(listErr)
    else errors.push(...(obj.pre_stop as unknown[]).flatMap((item, i) => validateServiceHook(item, indexPath(p, i))))
  }

  errors.push(...checkAdditionalProperties(obj, SERVICE_KNOWN_KEYS, path))
  return errors
}
