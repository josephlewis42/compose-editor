// Renders a catalog application's template outside the editor UI, shared by
// the catalog tests and the scripts/render.ts CLI.

import type { Application } from '@/gen/composeeditor/v1/spec_pb'
import { loadCatalog } from './catalog'
import { flattenForm } from './formUtil'
import { type ConvertOutput, convertComposeSpec } from './wasm'

// Returns each form input's default value under its keyname.
export function defaultValues(application: Application): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const element of flattenForm(application.form, '$.form')) {
    const keyName = element.keyName()
    if (keyName !== undefined) {
      values[keyName] = element.defaultValue()
    }
  }
  return values
}

// Renders the application with the given slug using its form
// defaults, with any keys in overrides taking precedence.
export async function renderSpec(slug: string, overrides: Record<string, unknown> = {}): Promise<ConvertOutput> {
  const catalog = await loadCatalog()
  const application = catalog.applications.find((app) => app.slug === slug)
  if (!application) {
    const known = catalog.applications.map((app) => app.slug).join(', ')
    throw new Error(`no spec with slug "${slug}" found, expected one of: ${known}`)
  }

  return convertComposeSpec({
    template: application.template,
    values: { ...defaultValues(application), ...overrides },
  })
}
