// Renders a Builder draft as a spec.yaml matching specs/README.md's format,
// ready to drop into specs/<slug>/spec.yaml.

import { toJson } from '@bufbuild/protobuf'
import { stringify } from 'yaml'
import { ApplicationSchema, type Application } from '@/gen/composeeditor/v1/spec_pb'

// toJson's `useProtoFieldName` uses each field's literal .proto name, which
// matches spec.yaml's keys (spdx_license, default_value, help_text, ...)
// for every field except the two with an explicit json_name override:
// FormElement's `one_of` (spec.yaml key: "oneof") and `str` (spec.yaml key:
// "string"). Fix those up wherever a FormElement's single-key union
// appears in the tree.
function fixFormElementKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(fixFormElementKeys)

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, v]) => {
        const fixedKey = key === 'one_of' ? 'oneof' : key === 'str' ? 'string' : key
        return [fixedKey, fixFormElementKeys(v)]
      }),
    )
  }

  return value
}

export function applicationToSpecYaml(app: Application): string {
  const json = toJson(ApplicationSchema, app, { useProtoFieldName: true }) as Record<string, unknown>
  // The slug comes from the spec directory name, not the YAML content.
  delete json.slug
  return stringify(fixFormElementKeys(json), { lineWidth: 0 })
}
