// #/$defs/job — allOf[container_spec, workload_spec] plus `triggers`
// (required), closed with unevaluatedProperties: false.

import { childPath, indexPath, type ValidationError } from './errors'
import { CONTAINER_SPEC_KNOWN_KEYS, validateContainerSpecFields, type ContainerSpec } from './containerSpec'
import { WORKLOAD_SPEC_KNOWN_KEYS, validateWorkloadSpecFields, type WorkloadSpec } from './workloadSpec'
import { validateSchedule, type Schedule } from './schedule'
import { checkAdditionalProperties, checkFieldType, checkRequired, checkType, validateListOfStrings, type ListOfStrings } from './primitives'

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
  if (err) return [err]
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
    errors.push({ path, type: 'one_of', message: '"triggers" must set at least one of "manual" or "schedule"' })
  }
  errors.push(...checkAdditionalProperties(obj, ['manual', 'schedule'], path))
  return errors
}

export function validateJob(value: unknown, path: string): ValidationError[] {
  const err = checkType(value, ['object'], path)
  if (err) return [err]
  const obj = value as Record<string, unknown>
  const errors: ValidationError[] = [...checkRequired(obj, ['triggers'], path), ...validateContainerSpecFields(obj, path), ...validateWorkloadSpecFields(obj, path)]

  if (obj.profiles !== undefined) errors.push(...validateListOfStrings(obj.profiles, childPath(path, 'profiles')))
  if (obj.triggers !== undefined) errors.push(...validateTriggers(obj.triggers, childPath(path, 'triggers')))

  errors.push(...checkAdditionalProperties(obj, JOB_KNOWN_KEYS, path))
  return errors
}
