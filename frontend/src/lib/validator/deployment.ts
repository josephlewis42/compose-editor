// #/$defs/deployment (the compose file's `deploy:` key)

import { childPath, type ValidationError } from './errors'
import {
  checkAdditionalProperties,
  checkFieldEnum,
  checkFieldType,
  checkType,
  validateGenericResources,
  validateListOrDict,
  validateReservationDevices,
  type GenericResources,
  type ListOrDict,
  type ReservationDevices,
} from './primitives'

export interface RollbackConfig {
  parallelism?: number | string
  delay?: string
  failure_action?: string
  monitor?: string
  max_failure_ratio?: number | string
  order?: 'start-first' | 'stop-first'
}

export interface UpdateConfig {
  parallelism?: number | string
  delay?: string
  failure_action?: string
  monitor?: string
  max_failure_ratio?: number | string
  order?: 'start-first' | 'stop-first'
}

export interface ResourceLimits {
  cpus?: number | string
  memory?: string
  pids?: number | string
}

export interface ResourceReservations {
  cpus?: number | string
  memory?: string
  generic_resources?: GenericResources
  devices?: ReservationDevices
}

export interface Resources {
  limits?: ResourceLimits
  reservations?: ResourceReservations
}

export interface RestartPolicy {
  condition?: string
  delay?: string
  max_attempts?: number | string
  window?: string
}

export interface PlacementPreference {
  spread?: string
}

export interface Placement {
  constraints?: string[]
  preferences?: PlacementPreference[]
  max_replicas_per_node?: number | string
}

export interface Deployment {
  mode?: string
  endpoint_mode?: string
  replicas?: number | string
  labels?: ListOrDict
  rollback_config?: RollbackConfig
  update_config?: UpdateConfig
  resources?: Resources
  restart_policy?: RestartPolicy
  placement?: Placement
}

const ORDER_VALUES = ['start-first', 'stop-first']
const ROLLING_CONFIG_KEYS = ['parallelism', 'delay', 'failure_action', 'monitor', 'max_failure_ratio', 'order']

function validateRollingConfig(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'parallelism', ['integer', 'string'], path, errors)
  checkFieldType(obj, 'delay', ['string'], path, errors)
  checkFieldType(obj, 'failure_action', ['string'], path, errors)
  checkFieldType(obj, 'monitor', ['string'], path, errors)
  checkFieldType(obj, 'max_failure_ratio', ['number', 'string'], path, errors)
  checkFieldEnum(obj, 'order', ORDER_VALUES, path, errors)
  errors.push(...checkAdditionalProperties(obj, ROLLING_CONFIG_KEYS, path))
  return errors
}

function validateResourceLimits(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'cpus', ['number', 'string'], path, errors)
  checkFieldType(obj, 'memory', ['string'], path, errors)
  checkFieldType(obj, 'pids', ['integer', 'string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, ['cpus', 'memory', 'pids'], path))
  return errors
}

function validateResourceReservations(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'cpus', ['number', 'string'], path, errors)
  checkFieldType(obj, 'memory', ['string'], path, errors)
  if (obj.generic_resources !== undefined) errors.push(...validateGenericResources(obj.generic_resources, childPath(path, 'generic_resources')))
  if (obj.devices !== undefined) errors.push(...validateReservationDevices(obj.devices, childPath(path, 'devices')))
  errors.push(...checkAdditionalProperties(obj, ['cpus', 'memory', 'generic_resources', 'devices'], path))
  return errors
}

function validateResources(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  if (obj.limits !== undefined) errors.push(...validateResourceLimits(obj.limits, childPath(path, 'limits')))
  if (obj.reservations !== undefined) errors.push(...validateResourceReservations(obj.reservations, childPath(path, 'reservations')))
  errors.push(...checkAdditionalProperties(obj, ['limits', 'reservations'], path))
  return errors
}

function validateRestartPolicy(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'condition', ['string'], path, errors)
  checkFieldType(obj, 'delay', ['string'], path, errors)
  checkFieldType(obj, 'max_attempts', ['integer', 'string'], path, errors)
  checkFieldType(obj, 'window', ['string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, ['condition', 'delay', 'max_attempts', 'window'], path))
  return errors
}

function validatePlacementPreference(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'spread', ['string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, ['spread'], path))
  return errors
}

function validatePlacement(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  if (obj.constraints !== undefined) {
    const constraintsPath = childPath(path, 'constraints')
    const constraintsErr = checkType(obj.constraints, ['array'], constraintsPath)
    if (constraintsErr) {
      errors.push(constraintsErr)
    } else {
      errors.push(
        ...(obj.constraints as unknown[]).flatMap((item, i) => {
          const itemErr = checkType(item, ['string'], `${constraintsPath}[${i}]`)
          return itemErr ? [itemErr] : []
        }),
      )
    }
  }
  if (obj.preferences !== undefined) {
    const preferencesPath = childPath(path, 'preferences')
    const preferencesErr = checkType(obj.preferences, ['array'], preferencesPath)
    if (preferencesErr) {
      errors.push(preferencesErr)
    } else {
      errors.push(...(obj.preferences as unknown[]).flatMap((item, i) => validatePlacementPreference(item, `${preferencesPath}[${i}]`)))
    }
  }
  checkFieldType(obj, 'max_replicas_per_node', ['integer', 'string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, ['constraints', 'preferences', 'max_replicas_per_node'], path))
  return errors
}

const DEPLOYMENT_KNOWN_KEYS = [
  'mode',
  'endpoint_mode',
  'replicas',
  'labels',
  'rollback_config',
  'update_config',
  'resources',
  'restart_policy',
  'placement',
]

export function validateDeployment(value: unknown, path: string): ValidationError[] {
  if (value === null) return []
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'mode', ['string'], path, errors)
  checkFieldType(obj, 'endpoint_mode', ['string'], path, errors)
  checkFieldType(obj, 'replicas', ['integer', 'string'], path, errors)
  if (obj.labels !== undefined) errors.push(...validateListOrDict(obj.labels, childPath(path, 'labels')))
  if (obj.rollback_config !== undefined) errors.push(...validateRollingConfig(obj.rollback_config, childPath(path, 'rollback_config')))
  if (obj.update_config !== undefined) errors.push(...validateRollingConfig(obj.update_config, childPath(path, 'update_config')))
  if (obj.resources !== undefined) errors.push(...validateResources(obj.resources, childPath(path, 'resources')))
  if (obj.restart_policy !== undefined) errors.push(...validateRestartPolicy(obj.restart_policy, childPath(path, 'restart_policy')))
  if (obj.placement !== undefined) errors.push(...validatePlacement(obj.placement, childPath(path, 'placement')))
  errors.push(...checkAdditionalProperties(obj, DEPLOYMENT_KNOWN_KEYS, path))
  return errors
}
