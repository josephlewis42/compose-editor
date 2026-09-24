// Generic JSON Schema-style checks (type/enum/pattern/range/required/
// additionalProperties) plus the handful of union type aliases
// (`#/$defs/string_or_list`, `list_or_dict`, ...) that compose_spec.json
// reuses across many definitions. Everything under this folder that
// validates a field's shape is built out of these.

import { type ValidationError, childPath, indexPath } from './errors'

export type JsonType = 'string' | 'number' | 'integer' | 'boolean' | 'null' | 'object' | 'array'

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function jsonTypeOf(value: unknown): Exclude<JsonType, 'integer'> {
  if (value === null || value === undefined) return 'null'
  if (Array.isArray(value)) return 'array'
  if (isPlainObject(value)) return 'object'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  return 'null'
}

/** Checks `value` against a JSON Schema `type` (or `type: [...]` union). */
export function checkType(value: unknown, allowed: readonly JsonType[], path: string): ValidationError | null {
  for (const t of allowed) {
    if (t === 'integer') {
      if (typeof value === 'number' && Number.isInteger(value)) return null
      continue
    }
    if (jsonTypeOf(value) === t) return null
  }
  return { path, type: 'type', message: `expected ${allowed.join(' or ')}, got ${jsonTypeOf(value)}` }
}

/** Runs checkType only when the field is actually present (most compose_spec.json fields are optional). */
export function checkFieldType(
  obj: Record<string, unknown>,
  key: string,
  allowed: readonly JsonType[],
  path: string,
  errors: ValidationError[],
): void {
  if (obj[key] === undefined) return
  const err = checkType(obj[key], allowed, childPath(path, key))
  if (err) errors.push(err)
}

export function checkEnum(value: unknown, allowed: readonly string[], path: string): ValidationError | null {
  if (typeof value === 'string' && allowed.includes(value)) return null
  return { path, type: 'enum', message: `expected one of ${allowed.join(', ')}, got ${JSON.stringify(value)}` }
}

export function checkFieldEnum(
  obj: Record<string, unknown>,
  key: string,
  allowed: readonly string[],
  path: string,
  errors: ValidationError[],
): void {
  if (obj[key] === undefined) return
  const err = checkEnum(obj[key], allowed, childPath(path, key))
  if (err) errors.push(err)
}

export function checkPattern(value: unknown, pattern: RegExp, path: string): ValidationError | null {
  if (typeof value !== 'string') return null // checkType reports the type mismatch separately
  if (pattern.test(value)) return null
  return { path, type: 'pattern', message: `must match pattern ${pattern}` }
}

export function checkFieldPattern(
  obj: Record<string, unknown>,
  key: string,
  pattern: RegExp,
  path: string,
  errors: ValidationError[],
): void {
  if (obj[key] === undefined) return
  const err = checkPattern(obj[key], pattern, childPath(path, key))
  if (err) errors.push(err)
}

export function checkRange(value: unknown, min: number | undefined, max: number | undefined, path: string): ValidationError | null {
  if (typeof value !== 'number') return null // checkType reports the type mismatch separately
  if (min !== undefined && value < min) return { path, type: 'range', message: `must be >= ${min}, got ${value}` }
  if (max !== undefined && value > max) return { path, type: 'range', message: `must be <= ${max}, got ${value}` }
  return null
}

export function checkRequired(obj: Record<string, unknown>, fields: readonly string[], path: string): ValidationError[] {
  return fields
    .filter((field) => obj[field] === undefined)
    .map((field) => ({ path: childPath(path, field), type: 'required' as const, message: `"${field}" is required` }))
}

const DEFAULT_ADDITIONAL_PATTERNS = [/^x-/]

/** additionalProperties: false (optionally combined with patternProperties like `^x-`). */
export function checkAdditionalProperties(
  obj: Record<string, unknown>,
  knownKeys: readonly string[],
  path: string,
  allowedPatterns: readonly RegExp[] = DEFAULT_ADDITIONAL_PATTERNS,
): ValidationError[] {
  const errors: ValidationError[] = []
  for (const key of Object.keys(obj)) {
    if (knownKeys.includes(key)) continue
    if (allowedPatterns.some((pattern) => pattern.test(key))) continue
    errors.push({ path: childPath(path, key), type: 'additional_property', message: `unknown property "${key}"` })
  }
  return errors
}

/** For `patternProperties` maps (services/networks/volumes/...) keyed by e.g. `^[a-zA-Z0-9._-]+$`. */
export function checkKeyPattern(keys: readonly string[], pattern: RegExp, path: string): ValidationError[] {
  return keys
    .filter((key) => !pattern.test(key))
    .map((key) => ({ path: childPath(path, key), type: 'pattern' as const, message: `key must match pattern ${pattern}` }))
}

export function validateMapOf(
  value: unknown,
  path: string,
  keyPattern: RegExp,
  validateEntry: (entry: unknown, entryPath: string) => ValidationError[],
): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  return [...checkKeyPattern(Object.keys(obj), keyPattern, path), ...Object.entries(obj).flatMap(([key, entry]) => validateEntry(entry, childPath(path, key)))]
}

// #/$defs/list_of_strings
export type ListOfStrings = string[]

export function validateListOfStrings(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['array'], path)
  if (err) return [err]
  return (value as unknown[]).flatMap((item, i) => {
    const itemErr = checkType(item, ['string'], indexPath(path, i))
    return itemErr ? [itemErr] : []
  })
}

// #/$defs/string_or_list
export type StringOrList = string | string[]

export function validateStringOrList(value: unknown, path: string): ValidationError[] {
  if (typeof value === 'string') return []
  return validateListOfStrings(value, path)
}

// #/$defs/list_or_dict
export type ListOrDict = Record<string, string | number | boolean | null> | string[]

export function validateListOrDict(value: unknown, path: string): ValidationError[] {
  if (Array.isArray(value)) return validateListOfStrings(value, path)
  if (isPlainObject(value)) {
    return Object.entries(value).flatMap(([key, entry]) => {
      const err = checkType(entry, ['string', 'number', 'boolean', 'null'], childPath(path, key))
      return err ? [err] : []
    })
  }
  return [{ path, type: 'one_of', message: 'expected a mapping of string to scalar, or a list of strings' }]
}

// #/$defs/extra_hosts
export type ExtraHosts = Record<string, string | string[]> | string[]

export function validateExtraHosts(value: unknown, path: string): ValidationError[] {
  if (Array.isArray(value)) return validateListOfStrings(value, path)
  if (isPlainObject(value)) {
    return Object.entries(value).flatMap(([key, entry]) => {
      const entryPath = childPath(path, key)
      if (typeof entry === 'string') return []
      return validateListOfStrings(entry, entryPath)
    })
  }
  return [{ path, type: 'one_of', message: 'expected a mapping of hostname to IP(s), or a list of "host:ip" strings' }]
}

// #/$defs/command
export type Command = null | string | string[]

export function validateCommand(value: unknown, path: string): ValidationError[] {
  if (value === null || typeof value === 'string') return []
  return validateListOfStrings(value, path)
}

// #/$defs/label_file
export type LabelFile = string | string[]

export function validateLabelFile(value: unknown, path: string): ValidationError[] {
  if (typeof value === 'string') return []
  return validateListOfStrings(value, path)
}

// #/$defs/env_file
export interface EnvFileEntry {
  path: string
  format?: string
  required?: boolean | string
}
export type EnvFile = string | (string | EnvFileEntry)[]

export function validateEnvFile(value: unknown, path: string): ValidationError[] {
  if (typeof value === 'string') return []
  const err = checkType(value, ['array'], path)
  if (err) return [err]
  return (value as unknown[]).flatMap((item, i) => {
    const itemPath = indexPath(path, i)
    if (typeof item === 'string') return []
    const itemErr = checkType(item, ['object'], itemPath)
    if (itemErr) return [itemErr]
    const entry = item as Record<string, unknown>
    const errors: ValidationError[] = checkRequired(entry, ['path'], itemPath)
    checkFieldType(entry, 'path', ['string'], itemPath, errors)
    checkFieldType(entry, 'format', ['string'], itemPath, errors)
    checkFieldType(entry, 'required', ['boolean', 'string'], itemPath, errors)
    errors.push(...checkAdditionalProperties(entry, ['path', 'format', 'required'], itemPath))
    return errors
  })
}

// #/$defs/ulimits
export interface UlimitDetail {
  soft: number | string
  hard: number | string
}
export type Ulimits = Record<string, number | string | UlimitDetail>

export function validateUlimits(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => {
    const entryPath = childPath(path, key)
    if (typeof entry === 'number' || typeof entry === 'string') return []
    const entryErr = checkType(entry, ['object'], entryPath)
    if (entryErr) return [entryErr]
    const detail = entry as Record<string, unknown>
    const errors: ValidationError[] = checkRequired(detail, ['soft', 'hard'], entryPath)
    checkFieldType(detail, 'soft', ['integer', 'string'], entryPath, errors)
    checkFieldType(detail, 'hard', ['integer', 'string'], entryPath, errors)
    errors.push(...checkAdditionalProperties(detail, ['soft', 'hard'], entryPath))
    return errors
  })
}

// #/$defs/service_config_or_secret
export interface ServiceConfigOrSecretDetail {
  source?: string
  target?: string
  uid?: string
  gid?: string
  mode?: number | string
}
export type ServiceConfigOrSecret = (string | ServiceConfigOrSecretDetail)[]

export function validateServiceConfigOrSecret(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['array'], path)
  if (err) return [err]
  return (value as unknown[]).flatMap((item, i) => {
    const itemPath = indexPath(path, i)
    if (typeof item === 'string') return []
    const itemErr = checkType(item, ['object'], itemPath)
    if (itemErr) return [itemErr]
    const entry = item as Record<string, unknown>
    const errors: ValidationError[] = []
    checkFieldType(entry, 'source', ['string'], itemPath, errors)
    checkFieldType(entry, 'target', ['string'], itemPath, errors)
    checkFieldType(entry, 'uid', ['string'], itemPath, errors)
    checkFieldType(entry, 'gid', ['string'], itemPath, errors)
    checkFieldType(entry, 'mode', ['number', 'string'], itemPath, errors)
    errors.push(...checkAdditionalProperties(entry, ['source', 'target', 'uid', 'gid', 'mode'], itemPath))
    return errors
  })
}

// #/$defs/blkio_limit
export interface BlkioLimit {
  path?: string
  rate?: number | string
}

export function validateBlkioLimit(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'path', ['string'], path, errors)
  checkFieldType(obj, 'rate', ['integer', 'string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, ['path', 'rate'], path, []))
  return errors
}

// #/$defs/blkio_weight
export interface BlkioWeight {
  path?: string
  weight?: number | string
}

export function validateBlkioWeight(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'path', ['string'], path, errors)
  checkFieldType(obj, 'weight', ['integer', 'string'], path, errors)
  errors.push(...checkAdditionalProperties(obj, ['path', 'weight'], path, []))
  return errors
}

// #/$defs/generic_resources
export interface GenericResource {
  discrete_resource_spec?: {
    kind?: string
    value?: number | string
  }
}
export type GenericResources = GenericResource[]

export function validateGenericResources(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['array'], path)
  if (err) return [err]
  return (value as unknown[]).flatMap((item, i) => {
    const itemPath = indexPath(path, i)
    const itemErr = checkType(item, ['object'], itemPath)
    if (itemErr) return [itemErr]
    const entry = item as Record<string, unknown>
    const errors: ValidationError[] = []
    if (entry.discrete_resource_spec !== undefined) {
      const specPath = childPath(itemPath, 'discrete_resource_spec')
      const specErr = checkType(entry.discrete_resource_spec, ['object'], specPath)
      if (specErr) {
        errors.push(specErr)
      } else {
        const spec = entry.discrete_resource_spec as Record<string, unknown>
        checkFieldType(spec, 'kind', ['string'], specPath, errors)
        checkFieldType(spec, 'value', ['number', 'string'], specPath, errors)
        errors.push(...checkAdditionalProperties(spec, ['kind', 'value'], specPath, []))
      }
    }
    errors.push(...checkAdditionalProperties(entry, ['discrete_resource_spec'], itemPath))
    return errors
  })
}

// #/$defs/devices (deploy.resources.reservations.devices - GPU/device reservations)
export interface ReservationDevice {
  capabilities: string[]
  count?: number | string
  device_ids?: string[]
  driver?: string
  options?: ListOrDict
}
export type ReservationDevices = ReservationDevice[]

export function validateReservationDevices(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['array'], path)
  if (err) return [err]
  return (value as unknown[]).flatMap((item, i) => {
    const itemPath = indexPath(path, i)
    const itemErr = checkType(item, ['object'], itemPath)
    if (itemErr) return [itemErr]
    const entry = item as Record<string, unknown>
    const errors: ValidationError[] = checkRequired(entry, ['capabilities'], itemPath)
    if (entry.capabilities !== undefined) errors.push(...validateListOfStrings(entry.capabilities, childPath(itemPath, 'capabilities')))
    checkFieldType(entry, 'count', ['string', 'integer'], itemPath, errors)
    if (entry.device_ids !== undefined) errors.push(...validateListOfStrings(entry.device_ids, childPath(itemPath, 'device_ids')))
    checkFieldType(entry, 'driver', ['string'], itemPath, errors)
    if (entry.options !== undefined) errors.push(...validateListOrDict(entry.options, childPath(itemPath, 'options')))
    errors.push(...checkAdditionalProperties(entry, ['capabilities', 'count', 'device_ids', 'driver', 'options'], itemPath, []))
    return errors
  })
}

// The `external:` field shared by network/volume/secret/config: either a
// boolean/string shorthand, or an object with just a `name`.
export type External = boolean | string | { name?: string }

// network/volume close `external` to just {name} (+ x-); secret/config leave
// it open (no additionalProperties: false in compose_spec.json for those).
export function validateExternal(value: unknown, path: string, strict = false): ValidationError[] {
  const err = checkType(value, ['boolean', 'string', 'object'], path)
  if (err) return [err]
  if (!isPlainObject(value)) return []
  const errors: ValidationError[] = []
  checkFieldType(value, 'name', ['string'], path, errors)
  if (strict) errors.push(...checkAdditionalProperties(value, ['name'], path))
  return errors
}

// #/$defs/gpus
export interface GpuDetail {
  capabilities?: string[]
  count?: number | string
  device_ids?: string[]
  driver?: string
  options?: ListOrDict
}
export type Gpus = 'all' | GpuDetail[]

export function validateGpus(value: unknown, path: string): ValidationError[] {
  if (value === 'all') return []
  const err = checkType(value, ['array'], path)
  if (err) return [err]
  return (value as unknown[]).flatMap((item, i) => {
    const itemPath = indexPath(path, i)
    const itemErr = checkType(item, ['object'], itemPath)
    if (itemErr) return [itemErr]
    const entry = item as Record<string, unknown>
    const errors: ValidationError[] = []
    if (entry.capabilities !== undefined) errors.push(...validateListOfStrings(entry.capabilities, childPath(itemPath, 'capabilities')))
    checkFieldType(entry, 'count', ['string', 'integer'], itemPath, errors)
    if (entry.device_ids !== undefined) errors.push(...validateListOfStrings(entry.device_ids, childPath(itemPath, 'device_ids')))
    checkFieldType(entry, 'driver', ['string'], itemPath, errors)
    if (entry.options !== undefined) errors.push(...validateListOrDict(entry.options, childPath(itemPath, 'options')))
    return errors
  })
}
