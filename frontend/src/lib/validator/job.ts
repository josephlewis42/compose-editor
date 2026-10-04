// #/$defs/job — allOf[container_spec, workload_spec] plus `triggers`
// (required), closed with unevaluatedProperties: false.

import { type ValidationError, childPath, indexPath } from './errors'
import { CONTAINER_SPEC_KNOWN_KEYS, type ContainerSpec, validateContainerSpecFields } from './containerSpec'
import { WORKLOAD_SPEC_KNOWN_KEYS, type WorkloadSpec, validateWorkloadSpecFields } from './workloadSpec'
import { type Schedule, validateSchedule } from './schedule'
import { type ListOfStrings, checkAdditionalProperties, checkFieldType, checkRequired, checkType, validateListOfStrings } from './primitives'

export interface Triggers {
  manual?: boolean | string
  schedule?: (string | Schedule)[]
}

export type Job = ContainerSpec &
  WorkloadSpec & {
    profiles?: ListOfStrings
    triggers: Triggers
  }

const JOB_OWN_KEYS = ['profiles', 'triggers']
const JOB_KNOWN_KEYS = [...CONTAINER_SPEC_KNOWN_KEYS, ...WORKLOAD_SPEC_KNOWN_KEYS, ...JOB_OWN_KEYS]

function validateTriggers(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) {return [err]}
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = []
  checkFieldType(obj, 'manual', ['boolean', 'string'], path, errors)
  if (obj.schedule !== undefined) {
    const schedulePath = childPath(path, 'schedule')
    const scheduleErr = checkType(obj.schedule, ['array'], schedulePath)
    if (scheduleErr) {
      errors.push(scheduleErr)
    } else {
      errors.push(
        ...(obj.schedule as unknown[]).flatMap((item, i) => (typeof item === 'string' ? [] : validateSchedule(item, indexPath(schedulePath, i)))),
      )
    }
  }
  if (obj.manual === undefined && obj.schedule === undefined) {
    errors.push({ path, type: 'parse', message: '"triggers" must set at least one of "manual" or "schedule"' })
  }
  errors.push(...checkAdditionalProperties(obj, ['manual', 'schedule'], path))
  return errors
}

export function validateJob(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) {return [err]}
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = [...checkRequired(obj, ['triggers'], path), ...validateContainerSpecFields(obj, path), ...validateWorkloadSpecFields(obj, path)]

  if (obj.profiles !== undefined) {errors.push(...validateListOfStrings(obj.profiles, childPath(path, 'profiles')))}
  if (obj.triggers !== undefined) {errors.push(...validateTriggers(obj.triggers, childPath(path, 'triggers')))}

  errors.push(...checkAdditionalProperties(obj, JOB_KNOWN_KEYS, path))
  return errors
}
