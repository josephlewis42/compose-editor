// #/$defs/network

import { childPath, type ValidationError } from './errors'
import { checkAdditionalProperties, checkFieldType, checkType, validateExternal, validateListOrDict, type External, type ListOrDict } from './primitives'

export interface IpamConfigBlock {
  subnet?: string
  ip_range?: string
  gateway?: string
  aux_addresses?: Record<string, string>
}

export interface Ipam {
  driver?: string
  config?: IpamConfigBlock[]
  options?: Record<string, string>
}

export interface Network {
  name?: string
  driver?: string
  driver_opts?: Record<string, string | number>
  ipam?: Ipam
  external?: External
  internal?: boolean | string
  enable_ipv4?: boolean | string
  enable_ipv6?: boolean | string
  attachable?: boolean | string
  labels?: ListOrDict
}

function validateIpamConfigBlock(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'subnet', ['string'], path, errors)
  checkFieldType(obj, 'ip_range', ['string'], path, errors)
  checkFieldType(obj, 'gateway', ['string'], path, errors)
  if (obj.aux_addresses !== undefined) {
    const auxPath = childPath(path, 'aux_addresses')
    const auxErr = checkType(obj.aux_addresses, ['object'], auxPath)
    if (auxErr) {
      errors.push(auxErr)
    } else {
      errors.push(
        ...Object.entries(obj.aux_addresses as Record<string, unknown>).flatMap(([key, entry]) => {
          const entryErr = checkType(entry, ['string'], childPath(auxPath, key))
          return entryErr ? [entryErr] : []
        }),
      )
    }
  }
  errors.push(...checkAdditionalProperties(obj, ['subnet', 'ip_range', 'gateway', 'aux_addresses'], path))
  return errors
}

function validateDriverOpts(value: unknown, path: string, types: ('string' | 'number')[] = ['string', 'number']): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => {
    const entryErr = checkType(entry, types, childPath(path, key))
    return entryErr ? [entryErr] : []
  })
}

function validateIpam(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'driver', ['string'], path, errors)
  if (obj.config !== undefined) {
    const configPath = childPath(path, 'config')
    const configErr = checkType(obj.config, ['array'], configPath)
    if (configErr) {
      errors.push(configErr)
    } else {
      errors.push(...(obj.config as unknown[]).flatMap((item, i) => validateIpamConfigBlock(item, `${configPath}[${i}]`)))
    }
  }
  if (obj.options !== undefined) errors.push(...validateDriverOpts(obj.options, childPath(path, 'options'), ['string']))
  errors.push(...checkAdditionalProperties(obj, ['driver', 'config', 'options'], path))
  return errors
}

const KNOWN_KEYS = ['name', 'driver', 'driver_opts', 'ipam', 'external', 'internal', 'enable_ipv4', 'enable_ipv6', 'attachable', 'labels']

export function validateNetwork(value: unknown, path: string): ValidationError[] {
  if (value === null) return []
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'name', ['string'], path, errors)
  checkFieldType(obj, 'driver', ['string'], path, errors)
  if (obj.driver_opts !== undefined) errors.push(...validateDriverOpts(obj.driver_opts, childPath(path, 'driver_opts')))
  if (obj.ipam !== undefined) errors.push(...validateIpam(obj.ipam, childPath(path, 'ipam')))
  if (obj.external !== undefined) errors.push(...validateExternal(obj.external, childPath(path, 'external'), true))
  checkFieldType(obj, 'internal', ['boolean', 'string'], path, errors)
  checkFieldType(obj, 'enable_ipv4', ['boolean', 'string'], path, errors)
  checkFieldType(obj, 'enable_ipv6', ['boolean', 'string'], path, errors)
  checkFieldType(obj, 'attachable', ['boolean', 'string'], path, errors)
  if (obj.labels !== undefined) errors.push(...validateListOrDict(obj.labels, childPath(path, 'labels')))
  errors.push(...checkAdditionalProperties(obj, KNOWN_KEYS, path))
  return errors
}
