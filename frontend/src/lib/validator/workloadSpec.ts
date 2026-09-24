// #/$defs/workload_spec — attributes shared by services and jobs that
// describe how the container is built/exposed/depended-on. Same story as
// container_spec: no `additionalProperties: false` of its own, so this
// exports `validateWorkloadSpecFields` + `WORKLOAD_SPEC_KNOWN_KEYS` for the
// composite (service/job) validators to close over.

import { childPath, indexPath, type ValidationError } from './errors'
import { validateExtraHosts, validateListOrDict, validateServiceConfigOrSecret, validateUlimits, type ExtraHosts, type ListOrDict, type ServiceConfigOrSecret, type Ulimits } from './primitives'
import { checkAdditionalProperties, checkFieldEnum, checkFieldType, checkRequired, checkType } from './primitives'
import { validateHealthcheck, type Healthcheck } from './healthcheck'

export interface BuildDetail {
  context?: string
  dockerfile?: string
  dockerfile_inline?: string
  entitlements?: string[]
  args?: ListOrDict
  ssh?: ListOrDict
  labels?: ListOrDict
  cache_from?: string[]
  cache_to?: string[]
  no_cache?: boolean | string
  no_cache_filter?: string | string[]
  additional_contexts?: ListOrDict
  network?: string
  provenance?: string | boolean
  sbom?: string | boolean
  pull?: boolean | string
  target?: string
  shm_size?: number | string
  extra_hosts?: ExtraHosts
  isolation?: string
  privileged?: boolean | string
  secrets?: ServiceConfigOrSecret
  tags?: string[]
  ulimits?: Ulimits
  platforms?: string[]
}
export type Build = string | BuildDetail

export interface DependsOnDetail {
  restart?: boolean | string
  required?: boolean
  condition: 'service_started' | 'service_healthy' | 'service_completed_successfully'
}
export type DependsOn = string[] | Record<string, DependsOnDetail>

export interface PortDetail {
  name?: string
  mode?: string
  host_ip?: string
  target?: number | string
  published?: string | number
  protocol?: string
  app_protocol?: string
}
export type Port = number | string | PortDetail

export interface WorkloadSpec {
  build?: Build
  depends_on?: DependsOn
  healthcheck?: Healthcheck
  ports?: Port[]
  expose?: (string | number)[]
  stdin_open?: boolean | string
  tty?: boolean | string
}

export const WORKLOAD_SPEC_KNOWN_KEYS = ['build', 'depends_on', 'healthcheck', 'ports', 'expose', 'stdin_open', 'tty']

const BUILD_KNOWN_KEYS = [
  'context',
  'dockerfile',
  'dockerfile_inline',
  'entitlements',
  'args',
  'ssh',
  'labels',
  'cache_from',
  'cache_to',
  'no_cache',
  'no_cache_filter',
  'additional_contexts',
  'network',
  'provenance',
  'sbom',
  'pull',
  'target',
  'shm_size',
  'extra_hosts',
  'isolation',
  'privileged',
  'secrets',
  'tags',
  'ulimits',
  'platforms',
]

function validateStringArray(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['array'], path)
  if (err) return [err]
  return (value as unknown[]).flatMap((item, i) => {
    const itemErr = checkType(item, ['string'], indexPath(path, i))
    return itemErr ? [itemErr] : []
  })
}

function validateBuild(value: unknown, path: string): ValidationError[] {
  if (typeof value === 'string') return []
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'context', ['string'], path, errors)
  checkFieldType(obj, 'dockerfile', ['string'], path, errors)
  checkFieldType(obj, 'dockerfile_inline', ['string'], path, errors)
  if (obj.entitlements !== undefined) errors.push(...validateStringArray(obj.entitlements, childPath(path, 'entitlements')))
  if (obj.args !== undefined) errors.push(...validateListOrDict(obj.args, childPath(path, 'args')))
  if (obj.ssh !== undefined) errors.push(...validateListOrDict(obj.ssh, childPath(path, 'ssh')))
  if (obj.labels !== undefined) errors.push(...validateListOrDict(obj.labels, childPath(path, 'labels')))
  if (obj.cache_from !== undefined) errors.push(...validateStringArray(obj.cache_from, childPath(path, 'cache_from')))
  if (obj.cache_to !== undefined) errors.push(...validateStringArray(obj.cache_to, childPath(path, 'cache_to')))
  checkFieldType(obj, 'no_cache', ['boolean', 'string'], path, errors)
  if (obj.no_cache_filter !== undefined && typeof obj.no_cache_filter !== 'string') {
    errors.push(...validateStringArray(obj.no_cache_filter, childPath(path, 'no_cache_filter')))
  }
  if (obj.additional_contexts !== undefined) errors.push(...validateListOrDict(obj.additional_contexts, childPath(path, 'additional_contexts')))
  checkFieldType(obj, 'network', ['string'], path, errors)
  checkFieldType(obj, 'provenance', ['string', 'boolean'], path, errors)
  checkFieldType(obj, 'sbom', ['string', 'boolean'], path, errors)
  checkFieldType(obj, 'pull', ['boolean', 'string'], path, errors)
  checkFieldType(obj, 'target', ['string'], path, errors)
  checkFieldType(obj, 'shm_size', ['integer', 'string'], path, errors)
  if (obj.extra_hosts !== undefined) errors.push(...validateExtraHosts(obj.extra_hosts, childPath(path, 'extra_hosts')))
  checkFieldType(obj, 'isolation', ['string'], path, errors)
  checkFieldType(obj, 'privileged', ['boolean', 'string'], path, errors)
  if (obj.secrets !== undefined) errors.push(...validateServiceConfigOrSecret(obj.secrets, childPath(path, 'secrets')))
  if (obj.tags !== undefined) errors.push(...validateStringArray(obj.tags, childPath(path, 'tags')))
  if (obj.ulimits !== undefined) errors.push(...validateUlimits(obj.ulimits, childPath(path, 'ulimits')))
  if (obj.platforms !== undefined) errors.push(...validateStringArray(obj.platforms, childPath(path, 'platforms')))
  errors.push(...checkAdditionalProperties(obj, BUILD_KNOWN_KEYS, path))
  return errors
}

const NAME_PATTERN = /^[a-zA-Z0-9._-]+$/
const CONDITION_VALUES = ['service_started', 'service_healthy', 'service_completed_successfully']

function validateDependsOnDetail(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = checkRequired(obj, ['condition'], path)
  checkFieldType(obj, 'restart', ['boolean', 'string'], path, errors)
  checkFieldType(obj, 'required', ['boolean'], path, errors)
  checkFieldEnum(obj, 'condition', CONDITION_VALUES, path, errors)
  errors.push(...checkAdditionalProperties(obj, ['restart', 'required', 'condition'], path))
  return errors
}

function validateDependsOn(value: unknown, path: string): ValidationError[] {
  if (Array.isArray(value)) return validateStringArray(value, path)
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  for (const key of Object.keys(obj)) {
    if (!NAME_PATTERN.test(key)) {
      errors.push({ path: childPath(path, key), type: 'pattern', message: `key must match pattern ${NAME_PATTERN}` })
      continue
    }
    errors.push(...validateDependsOnDetail(obj[key], childPath(path, key)))
  }
  return errors
}

const PORT_KNOWN_KEYS = ['name', 'mode', 'host_ip', 'target', 'published', 'protocol', 'app_protocol']

function validatePort(value: unknown, path: string): ValidationError[] {
  if (typeof value === 'number' || typeof value === 'string') return []
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'name', ['string'], path, errors)
  checkFieldType(obj, 'mode', ['string'], path, errors)
  checkFieldType(obj, 'host_ip', ['string'], path, errors)
  checkFieldType(obj, 'target', ['integer', 'string'], path, errors)
  checkFieldType(obj, 'published', ['string', 'integer'], path, errors)
  checkFieldType(obj, 'protocol', ['string'], path, errors)
  checkFieldType(obj, 'app_protocol', ['string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, PORT_KNOWN_KEYS, path))
  return errors
}

/** Validates every present workload_spec field's value; does not check for unknown keys. */
export function validateWorkloadSpecFields(obj: Record<string, unknown>, path: string): ValidationError[] {
  const errors: ValidationError[] = []

  if (obj.build !== undefined) errors.push(...validateBuild(obj.build, childPath(path, 'build')))
  if (obj.depends_on !== undefined) errors.push(...validateDependsOn(obj.depends_on, childPath(path, 'depends_on')))
  if (obj.healthcheck !== undefined) errors.push(...validateHealthcheck(obj.healthcheck, childPath(path, 'healthcheck')))
  if (obj.ports !== undefined) {
    const portsPath = childPath(path, 'ports')
    const portsErr = checkType(obj.ports, ['array'], portsPath)
    if (portsErr) {
      errors.push(portsErr)
    } else {
      errors.push(...(obj.ports as unknown[]).flatMap((item, i) => validatePort(item, indexPath(portsPath, i))))
    }
  }
  if (obj.expose !== undefined) {
    const exposePath = childPath(path, 'expose')
    const exposeErr = checkType(obj.expose, ['array'], exposePath)
    if (exposeErr) {
      errors.push(exposeErr)
    } else {
      errors.push(
        ...(obj.expose as unknown[]).flatMap((item, i) => {
          const itemErr = checkType(item, ['string', 'number'], indexPath(exposePath, i))
          return itemErr ? [itemErr] : []
        }),
      )
    }
  }
  checkFieldType(obj, 'stdin_open', ['boolean', 'string'], path, errors)
  checkFieldType(obj, 'tty', ['boolean', 'string'], path, errors)

  return errors
}
