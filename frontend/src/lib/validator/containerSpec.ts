// #/$defs/container_spec — attributes shared by anything that runs a
// container: services, jobs, and pre_start init containers.
//
// container_spec itself has no `additionalProperties: false` in
// compose_spec.json (it's only ever mixed into another type via `allOf`,
// which then closes the resulting object with `unevaluatedProperties:
// false`). So this file exports `validateContainerSpecFields`, which checks
// every known field's shape but does NOT reject unknown keys, plus
// `CONTAINER_SPEC_KNOWN_KEYS` so callers (service.ts, job.ts, hooks.ts) can
// run their own additionalProperties check across their merged key set.

import { childPath, indexPath, type ValidationError } from './errors'
import {
  checkAdditionalProperties,
  checkFieldEnum,
  checkFieldPattern,
  checkFieldType,
  checkRange,
  checkRequired,
  checkType,
  validateBlkioLimit,
  validateBlkioWeight,
  validateCommand,
  validateEnvFile,
  validateExtraHosts,
  validateGpus,
  validateLabelFile,
  validateListOfStrings,
  validateListOrDict,
  validateServiceConfigOrSecret,
  validateStringOrList,
  validateUlimits,
  type BlkioLimit,
  type BlkioWeight,
  type Command,
  type EnvFile,
  type ExtraHosts,
  type Gpus,
  type LabelFile,
  type ListOfStrings,
  type ListOrDict,
  type ServiceConfigOrSecret,
  type StringOrList,
  type Ulimits,
} from './primitives'

export interface BlkioConfig {
  device_read_bps?: BlkioLimit[]
  device_read_iops?: BlkioLimit[]
  device_write_bps?: BlkioLimit[]
  device_write_iops?: BlkioLimit[]
  weight?: number | string
  weight_device?: BlkioWeight[]
}

export interface CredentialSpec {
  config?: string
  file?: string
  registry?: string
}

export interface DeviceMapping {
  source: string
  target?: string
  permissions?: string
}

export interface ModelRefDetail {
  endpoint_var?: string
  model_var?: string
}
export type ModelRefs = string[] | Record<string, ModelRefDetail | null>

export interface NetworkRefDetail {
  aliases?: ListOfStrings
  interface_name?: string
  ipv4_address?: string
  ipv6_address?: string
  link_local_ips?: ListOfStrings
  mac_address?: string
  driver_opts?: Record<string, string | number>
  priority?: number
  gw_priority?: number
}
export type NetworkRefs = string[] | Record<string, NetworkRefDetail | null>

export interface LoggingConfig {
  driver?: string
  options?: Record<string, string | number | null>
}

export interface BindOptions {
  propagation?: string
  create_host_path?: boolean | string
  recursive?: 'enabled' | 'disabled' | 'writable' | 'readonly'
  selinux?: 'z' | 'Z'
}

export interface VolumeOptions {
  labels?: ListOrDict
  nocopy?: boolean | string
  subpath?: string
}

export interface TmpfsOptions {
  size?: number | string
  mode?: number | string
}

export interface ImageMountOptions {
  subpath?: string
}

export interface VolumeMount {
  type: 'bind' | 'volume' | 'tmpfs' | 'cluster' | 'npipe' | 'image'
  source?: string
  target?: string
  read_only?: boolean | string
  consistency?: string
  bind?: BindOptions
  volume?: VolumeOptions
  tmpfs?: TmpfsOptions
  image?: ImageMountOptions
}

export interface ContainerSpec {
  annotations?: ListOrDict
  blkio_config?: BlkioConfig
  cap_add?: string[]
  cap_drop?: string[]
  cgroup?: 'host' | 'private'
  cgroup_parent?: string
  command?: Command
  configs?: ServiceConfigOrSecret
  cpu_count?: number | string
  cpu_percent?: number | string
  cpu_shares?: number | string
  cpu_quota?: number | string
  cpu_period?: number | string
  cpu_rt_period?: number | string
  cpu_rt_runtime?: number | string
  cpus?: number | string
  cpuset?: string
  credential_spec?: CredentialSpec
  device_cgroup_rules?: ListOfStrings
  devices?: (string | DeviceMapping)[]
  dns?: StringOrList
  dns_opt?: string[]
  dns_search?: StringOrList
  domainname?: string
  entrypoint?: Command
  env_file?: EnvFile
  label_file?: LabelFile
  environment?: ListOrDict
  extra_hosts?: ExtraHosts
  gpus?: Gpus
  group_add?: (string | number)[]
  hostname?: string
  image?: string
  init?: boolean | string
  ipc?: string
  isolation?: string
  labels?: ListOrDict
  logging?: LoggingConfig
  mac_address?: string
  mem_limit?: number | string
  mem_reservation?: string | number
  mem_swappiness?: number | string
  memswap_limit?: number | string
  network_mode?: string
  models?: ModelRefs
  networks?: NetworkRefs
  oom_kill_disable?: boolean | string
  oom_score_adj?: number | string
  pid?: string | null
  pids_limit?: number | string
  platform?: string
  privileged?: boolean | string
  pull_policy?: string
  pull_refresh_after?: string
  read_only?: boolean | string
  runtime?: string
  security_opt?: string[]
  shm_size?: number | string
  secrets?: ServiceConfigOrSecret
  sysctls?: ListOrDict
  stop_grace_period?: string
  stop_signal?: string
  storage_opt?: Record<string, unknown>
  tmpfs?: StringOrList
  ulimits?: Ulimits
  use_api_socket?: boolean
  user?: string
  uts?: string
  volumes?: (string | VolumeMount)[]
  volumes_from?: string[]
  working_dir?: string
}

export const CONTAINER_SPEC_KNOWN_KEYS = [
  'annotations',
  'blkio_config',
  'cap_add',
  'cap_drop',
  'cgroup',
  'cgroup_parent',
  'command',
  'configs',
  'cpu_count',
  'cpu_percent',
  'cpu_shares',
  'cpu_quota',
  'cpu_period',
  'cpu_rt_period',
  'cpu_rt_runtime',
  'cpus',
  'cpuset',
  'credential_spec',
  'device_cgroup_rules',
  'devices',
  'dns',
  'dns_opt',
  'dns_search',
  'domainname',
  'entrypoint',
  'env_file',
  'label_file',
  'environment',
  'extra_hosts',
  'gpus',
  'group_add',
  'hostname',
  'image',
  'init',
  'ipc',
  'isolation',
  'labels',
  'logging',
  'mac_address',
  'mem_limit',
  'mem_reservation',
  'mem_swappiness',
  'memswap_limit',
  'network_mode',
  'models',
  'networks',
  'oom_kill_disable',
  'oom_score_adj',
  'pid',
  'pids_limit',
  'platform',
  'privileged',
  'pull_policy',
  'pull_refresh_after',
  'read_only',
  'runtime',
  'security_opt',
  'shm_size',
  'secrets',
  'sysctls',
  'stop_grace_period',
  'stop_signal',
  'storage_opt',
  'tmpfs',
  'ulimits',
  'use_api_socket',
  'user',
  'uts',
  'volumes',
  'volumes_from',
  'working_dir',
]

const PULL_POLICY_PATTERN = /^(always|never|build|if_not_present|missing|refresh|daily|weekly|every_([0-9]+[wdhms])+)$/
const NAME_PATTERN = /^[a-zA-Z0-9._-]+$/

function validateBlkioConfig(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  for (const key of ['device_read_bps', 'device_read_iops', 'device_write_bps', 'device_write_iops'] as const) {
    if (obj[key] === undefined) continue
    const listPath = childPath(path, key)
    const listErr = checkType(obj[key], ['array'], listPath)
    if (listErr) {
      errors.push(listErr)
    } else {
      errors.push(...(obj[key] as unknown[]).flatMap((item, i) => validateBlkioLimit(item, indexPath(listPath, i))))
    }
  }
  checkFieldType(obj, 'weight', ['integer', 'string'], path, errors)
  if (obj.weight_device !== undefined) {
    const listPath = childPath(path, 'weight_device')
    const listErr = checkType(obj.weight_device, ['array'], listPath)
    if (listErr) {
      errors.push(listErr)
    } else {
      errors.push(...(obj.weight_device as unknown[]).flatMap((item, i) => validateBlkioWeight(item, indexPath(listPath, i))))
    }
  }
  errors.push(
    ...checkAdditionalProperties(
      obj,
      ['device_read_bps', 'device_read_iops', 'device_write_bps', 'device_write_iops', 'weight', 'weight_device'],
      path,
      [],
    ),
  )
  return errors
}

function validateCredentialSpec(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'config', ['string'], path, errors)
  checkFieldType(obj, 'file', ['string'], path, errors)
  checkFieldType(obj, 'registry', ['string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, ['config', 'file', 'registry'], path))
  return errors
}

function validateDevices(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['array'], path)
  if (err) return [err]
  return (value as unknown[]).flatMap((item, i) => {
    const itemPath = indexPath(path, i)
    if (typeof item === 'string') return []
    const itemErr = checkType(item, ['object'], itemPath)
    if (itemErr) return [itemErr]
    const entry = item as Record<string, unknown>
    const errors: ValidationError[] = checkRequired(entry, ['source'], itemPath)
    checkFieldType(entry, 'source', ['string'], itemPath, errors)
    checkFieldType(entry, 'target', ['string'], itemPath, errors)
    checkFieldType(entry, 'permissions', ['string'], itemPath, errors)
    errors.push(...checkAdditionalProperties(entry, ['source', 'target', 'permissions'], itemPath))
    return errors
  })
}

function validateModelRefDetail(value: unknown, path: string): ValidationError[] {
  if (value === null) return []
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'endpoint_var', ['string'], path, errors)
  checkFieldType(obj, 'model_var', ['string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, ['endpoint_var', 'model_var'], path))
  return errors
}

function validateModels(value: unknown, path: string): ValidationError[] {
  if (Array.isArray(value)) return validateListOfStrings(value, path)
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  // compose_spec.json leaves this map's additionalProperties unset (i.e.
  // open), so — unlike `networks` below — non-matching keys aren't flagged.
  return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => validateModelRefDetail(entry, childPath(path, key)))
}

function validateNetworkRefDetail(value: unknown, path: string): ValidationError[] {
  if (value === null) return []
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  if (obj.aliases !== undefined) errors.push(...validateListOfStrings(obj.aliases, childPath(path, 'aliases')))
  checkFieldType(obj, 'interface_name', ['string'], path, errors)
  checkFieldType(obj, 'ipv4_address', ['string'], path, errors)
  checkFieldType(obj, 'ipv6_address', ['string'], path, errors)
  if (obj.link_local_ips !== undefined) errors.push(...validateListOfStrings(obj.link_local_ips, childPath(path, 'link_local_ips')))
  checkFieldType(obj, 'mac_address', ['string'], path, errors)
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
  checkFieldType(obj, 'priority', ['number'], path, errors)
  checkFieldType(obj, 'gw_priority', ['number'], path, errors)
  errors.push(
    ...checkAdditionalProperties(
      obj,
      ['aliases', 'interface_name', 'ipv4_address', 'ipv6_address', 'link_local_ips', 'mac_address', 'driver_opts', 'priority', 'gw_priority'],
      path,
    ),
  )
  return errors
}

function validateNetworks(value: unknown, path: string): ValidationError[] {
  if (Array.isArray(value)) return validateListOfStrings(value, path)
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  for (const key of Object.keys(obj)) {
    if (!NAME_PATTERN.test(key)) {
      errors.push({ path: childPath(path, key), type: 'pattern', message: `key must match pattern ${NAME_PATTERN}` })
      continue
    }
    errors.push(...validateNetworkRefDetail(obj[key], childPath(path, key)))
  }
  return errors
}

function validateLogging(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'driver', ['string'], path, errors)
  if (obj.options !== undefined) {
    const optionsPath = childPath(path, 'options')
    const optionsErr = checkType(obj.options, ['object'], optionsPath)
    if (optionsErr) {
      errors.push(optionsErr)
    } else {
      errors.push(
        ...Object.entries(obj.options as Record<string, unknown>).flatMap(([key, entry]) => {
          const entryErr = checkType(entry, ['string', 'number', 'null'], childPath(optionsPath, key))
          return entryErr ? [entryErr] : []
        }),
      )
    }
  }
  errors.push(...checkAdditionalProperties(obj, ['driver', 'options'], path))
  return errors
}

function validateBindOptions(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'propagation', ['string'], path, errors)
  checkFieldType(obj, 'create_host_path', ['boolean', 'string'], path, errors)
  checkFieldEnum(obj, 'recursive', ['enabled', 'disabled', 'writable', 'readonly'], path, errors)
  checkFieldEnum(obj, 'selinux', ['z', 'Z'], path, errors)
  errors.push(...checkAdditionalProperties(obj, ['propagation', 'create_host_path', 'recursive', 'selinux'], path))
  return errors
}

function validateVolumeOptions(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  if (obj.labels !== undefined) errors.push(...validateListOrDict(obj.labels, childPath(path, 'labels')))
  checkFieldType(obj, 'nocopy', ['boolean', 'string'], path, errors)
  checkFieldType(obj, 'subpath', ['string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, ['labels', 'nocopy', 'subpath'], path))
  return errors
}

function validateTmpfsOptions(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  if (obj.size !== undefined) {
    const sizePath = childPath(path, 'size')
    if (typeof obj.size !== 'string') {
      const sizeErr = checkType(obj.size, ['integer'], sizePath) ?? checkRange(obj.size, 0, undefined, sizePath)
      if (sizeErr) errors.push(sizeErr)
    }
  }
  checkFieldType(obj, 'mode', ['number', 'string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, ['size', 'mode'], path))
  return errors
}

function validateImageMountOptions(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'subpath', ['string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, ['subpath'], path))
  return errors
}

const MOUNT_TYPES = ['bind', 'volume', 'tmpfs', 'cluster', 'npipe', 'image']
const MOUNT_KNOWN_KEYS = ['type', 'source', 'target', 'read_only', 'consistency', 'bind', 'volume', 'tmpfs', 'image']

function validateVolumeMount(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = checkRequired(obj, ['type'], path)
  checkFieldEnum(obj, 'type', MOUNT_TYPES, path, errors)
  checkFieldType(obj, 'source', ['string'], path, errors)
  checkFieldType(obj, 'target', ['string'], path, errors)
  checkFieldType(obj, 'read_only', ['boolean', 'string'], path, errors)
  checkFieldType(obj, 'consistency', ['string'], path, errors)
  if (obj.bind !== undefined) errors.push(...validateBindOptions(obj.bind, childPath(path, 'bind')))
  if (obj.volume !== undefined) errors.push(...validateVolumeOptions(obj.volume, childPath(path, 'volume')))
  if (obj.tmpfs !== undefined) errors.push(...validateTmpfsOptions(obj.tmpfs, childPath(path, 'tmpfs')))
  if (obj.image !== undefined) errors.push(...validateImageMountOptions(obj.image, childPath(path, 'image')))
  errors.push(...checkAdditionalProperties(obj, MOUNT_KNOWN_KEYS, path))
  return errors
}

function validateContainerVolumes(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['array'], path)
  if (err) return [err]
  const items = value as unknown[]
  const errors: ValidationError[] = items.flatMap((item, i) => {
    const itemPath = indexPath(path, i)
    if (typeof item === 'string') return []
    return validateVolumeMount(item, itemPath)
  })
  const seen = new Set<string>()
  items.forEach((item, i) => {
    const key = JSON.stringify(item)
    if (seen.has(key)) errors.push({ path: indexPath(path, i), type: 'unique_items', message: 'duplicate volume mount' })
    seen.add(key)
  })
  return errors
}

/** Validates every present container_spec field's value; does not check for unknown keys. */
export function validateContainerSpecFields(obj: Record<string, unknown>, path: string): ValidationError[] {
  const errors: ValidationError[] = []

  if (obj.annotations !== undefined) errors.push(...validateListOrDict(obj.annotations, childPath(path, 'annotations')))
  if (obj.blkio_config !== undefined) errors.push(...validateBlkioConfig(obj.blkio_config, childPath(path, 'blkio_config')))
  if (obj.cap_add !== undefined) errors.push(...validateListOfStrings(obj.cap_add, childPath(path, 'cap_add')))
  if (obj.cap_drop !== undefined) errors.push(...validateListOfStrings(obj.cap_drop, childPath(path, 'cap_drop')))
  checkFieldEnum(obj, 'cgroup', ['host', 'private'], path, errors)
  checkFieldType(obj, 'cgroup_parent', ['string'], path, errors)
  if (obj.command !== undefined) errors.push(...validateCommand(obj.command, childPath(path, 'command')))
  if (obj.configs !== undefined) errors.push(...validateServiceConfigOrSecret(obj.configs, childPath(path, 'configs')))

  if (obj.cpu_count !== undefined) {
    const p = childPath(path, 'cpu_count')
    if (typeof obj.cpu_count !== 'string') errors.push(...[checkType(obj.cpu_count, ['integer'], p), checkRange(obj.cpu_count, 0, undefined, p)].filter((e) => e !== null))
  }
  if (obj.cpu_percent !== undefined) {
    const p = childPath(path, 'cpu_percent')
    if (typeof obj.cpu_percent !== 'string') errors.push(...[checkType(obj.cpu_percent, ['integer'], p), checkRange(obj.cpu_percent, 0, 100, p)].filter((e) => e !== null))
  }
  checkFieldType(obj, 'cpu_shares', ['number', 'string'], path, errors)
  checkFieldType(obj, 'cpu_quota', ['number', 'string'], path, errors)
  checkFieldType(obj, 'cpu_period', ['number', 'string'], path, errors)
  checkFieldType(obj, 'cpu_rt_period', ['number', 'string'], path, errors)
  checkFieldType(obj, 'cpu_rt_runtime', ['number', 'string'], path, errors)
  checkFieldType(obj, 'cpus', ['number', 'string'], path, errors)
  checkFieldType(obj, 'cpuset', ['string'], path, errors)
  if (obj.credential_spec !== undefined) errors.push(...validateCredentialSpec(obj.credential_spec, childPath(path, 'credential_spec')))
  if (obj.device_cgroup_rules !== undefined) errors.push(...validateListOfStrings(obj.device_cgroup_rules, childPath(path, 'device_cgroup_rules')))
  if (obj.devices !== undefined) errors.push(...validateDevices(obj.devices, childPath(path, 'devices')))
  if (obj.dns !== undefined) errors.push(...validateStringOrList(obj.dns, childPath(path, 'dns')))
  if (obj.dns_opt !== undefined) errors.push(...validateListOfStrings(obj.dns_opt, childPath(path, 'dns_opt')))
  if (obj.dns_search !== undefined) errors.push(...validateStringOrList(obj.dns_search, childPath(path, 'dns_search')))
  checkFieldType(obj, 'domainname', ['string'], path, errors)
  if (obj.entrypoint !== undefined) errors.push(...validateCommand(obj.entrypoint, childPath(path, 'entrypoint')))
  if (obj.env_file !== undefined) errors.push(...validateEnvFile(obj.env_file, childPath(path, 'env_file')))
  if (obj.label_file !== undefined) errors.push(...validateLabelFile(obj.label_file, childPath(path, 'label_file')))
  if (obj.environment !== undefined) errors.push(...validateListOrDict(obj.environment, childPath(path, 'environment')))
  if (obj.extra_hosts !== undefined) errors.push(...validateExtraHosts(obj.extra_hosts, childPath(path, 'extra_hosts')))
  if (obj.gpus !== undefined) errors.push(...validateGpus(obj.gpus, childPath(path, 'gpus')))
  if (obj.group_add !== undefined) {
    const p = childPath(path, 'group_add')
    const listErr = checkType(obj.group_add, ['array'], p)
    if (listErr) {
      errors.push(listErr)
    } else {
      errors.push(
        ...(obj.group_add as unknown[]).flatMap((item, i) => {
          const itemErr = checkType(item, ['string', 'number'], indexPath(p, i))
          return itemErr ? [itemErr] : []
        }),
      )
    }
  }
  checkFieldType(obj, 'hostname', ['string'], path, errors)
  checkFieldType(obj, 'image', ['string'], path, errors)
  checkFieldType(obj, 'init', ['boolean', 'string'], path, errors)
  checkFieldType(obj, 'ipc', ['string'], path, errors)
  checkFieldType(obj, 'isolation', ['string'], path, errors)
  if (obj.labels !== undefined) errors.push(...validateListOrDict(obj.labels, childPath(path, 'labels')))
  if (obj.logging !== undefined) errors.push(...validateLogging(obj.logging, childPath(path, 'logging')))
  checkFieldType(obj, 'mac_address', ['string'], path, errors)
  checkFieldType(obj, 'mem_limit', ['number', 'string'], path, errors)
  checkFieldType(obj, 'mem_reservation', ['string', 'integer'], path, errors)
  checkFieldType(obj, 'mem_swappiness', ['integer', 'string'], path, errors)
  checkFieldType(obj, 'memswap_limit', ['number', 'string'], path, errors)
  checkFieldType(obj, 'network_mode', ['string'], path, errors)
  if (obj.models !== undefined) errors.push(...validateModels(obj.models, childPath(path, 'models')))
  if (obj.networks !== undefined) errors.push(...validateNetworks(obj.networks, childPath(path, 'networks')))
  checkFieldType(obj, 'oom_kill_disable', ['boolean', 'string'], path, errors)
  if (obj.oom_score_adj !== undefined) {
    const p = childPath(path, 'oom_score_adj')
    if (typeof obj.oom_score_adj !== 'string') errors.push(...[checkType(obj.oom_score_adj, ['integer'], p), checkRange(obj.oom_score_adj, -1000, 1000, p)].filter((e) => e !== null))
  }
  checkFieldType(obj, 'pid', ['string', 'null'], path, errors)
  checkFieldType(obj, 'pids_limit', ['number', 'string'], path, errors)
  checkFieldType(obj, 'platform', ['string'], path, errors)
  checkFieldType(obj, 'privileged', ['boolean', 'string'], path, errors)
  checkFieldPattern(obj, 'pull_policy', PULL_POLICY_PATTERN, path, errors)
  checkFieldType(obj, 'pull_refresh_after', ['string'], path, errors)
  checkFieldType(obj, 'read_only', ['boolean', 'string'], path, errors)
  checkFieldType(obj, 'runtime', ['string'], path, errors)
  if (obj.security_opt !== undefined) errors.push(...validateListOfStrings(obj.security_opt, childPath(path, 'security_opt')))
  checkFieldType(obj, 'shm_size', ['number', 'string'], path, errors)
  if (obj.secrets !== undefined) errors.push(...validateServiceConfigOrSecret(obj.secrets, childPath(path, 'secrets')))
  if (obj.sysctls !== undefined) errors.push(...validateListOrDict(obj.sysctls, childPath(path, 'sysctls')))
  checkFieldType(obj, 'stop_grace_period', ['string'], path, errors)
  checkFieldType(obj, 'stop_signal', ['string'], path, errors)
  checkFieldType(obj, 'storage_opt', ['object'], path, errors)
  if (obj.tmpfs !== undefined) errors.push(...validateStringOrList(obj.tmpfs, childPath(path, 'tmpfs')))
  if (obj.ulimits !== undefined) errors.push(...validateUlimits(obj.ulimits, childPath(path, 'ulimits')))
  checkFieldType(obj, 'use_api_socket', ['boolean'], path, errors)
  checkFieldType(obj, 'user', ['string'], path, errors)
  checkFieldType(obj, 'uts', ['string'], path, errors)
  if (obj.volumes !== undefined) errors.push(...validateContainerVolumes(obj.volumes, childPath(path, 'volumes')))
  if (obj.volumes_from !== undefined) errors.push(...validateListOfStrings(obj.volumes_from, childPath(path, 'volumes_from')))
  checkFieldType(obj, 'working_dir', ['string'], path, errors)

  return errors
}
