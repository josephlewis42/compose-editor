// Builds the catalog (proto/composeeditor/v1/spec.proto's Catalog message)
// directly from the specs/<slug>/spec.yaml files, decoding each with the
// generated protobuf-es types instead of a hand-written JSON shape (see
// specs/README.md).

import { create, fromJson, type JsonValue } from '@bufbuild/protobuf'
import { parse } from 'yaml'
import { type Application, type Catalog, ApplicationSchema, CatalogSchema } from '@/gen/composeeditor/v1/spec_pb'

export type { FormElement } from '@/gen/composeeditor/v1/spec_pb'

// Bundled at build time; edits to a spec hot-reload under `pnpm dev`.
// Glob keys look like ../../../specs/<slug>/spec.yaml.
const specSlugPattern = /\/specs\/(?<slug>[^/]+)\/spec\.yaml$/u

const specFiles = import.meta.glob<string>('../../../specs/*/spec.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Decodes one spec.yaml. fromJson rejects any key spec.proto
// doesn't define, so a typo'd field name (or a YAML indentation mistake that
// moves a form input's fields next to its oneof key) fails loudly instead of
// silently dropping data.
export function parseSpec(slug: string, yamlText: string): Application {
  try {
    const application = fromJson(ApplicationSchema, (parse(yamlText) ?? {}) as JsonValue)
    application.slug = slug
    return application
  } catch (error) {
    throw new Error(`couldn't load spec "${slug}": ${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }
}

export async function loadCatalog(): Promise<Catalog> {
  const applications = Object.entries(specFiles).
    map(([path, yamlText]) => parseSpec(specSlugPattern.exec(path)?.groups?.slug ?? path, yamlText)).
    sort((a, b) => a.slug.localeCompare(b.slug))

  return create(CatalogSchema, { applications })
}
