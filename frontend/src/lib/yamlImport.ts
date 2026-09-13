// Parses a hand-authored spec.yaml (specs/README.md's format) back into an
// Application message. fromJson accepts a field's proto name as well as its
// jsonName (see node_modules/@bufbuild/protobuf's from-json.js), and the
// only two fields with a jsonName override — FormElement's `one_of`/`str`
// — are written by hand as `oneof`/`string` in real specs, which is exactly
// their jsonName. So no key translation is needed here, unlike yamlExport's
// toJson direction (which only ever emits one spelling at a time).
import { fromJson, type JsonValue } from '@bufbuild/protobuf'
import { parse } from 'yaml'
import { ApplicationSchema, type Application } from '@/gen/composeeditor/v1/spec_pb'

export function specYamlToApplication(yamlText: string): Application {
  const parsed: unknown = parse(yamlText)
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected a YAML mapping at the top level, like specs/README.md describes')
  }
  return fromJson(ApplicationSchema, parsed as JsonValue, { ignoreUnknownFields: true })
}
