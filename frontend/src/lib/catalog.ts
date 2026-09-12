// Loads the compiled catalog (proto/composeeditor/v1/spec.proto's Catalog
// message) emitted by `composeeditor build` and served as
// /templates.binpb, decoding it with the generated protobuf-es types
// instead of a hand-written JSON shape (see design/spec_format.md).

import { fromBinary } from '@bufbuild/protobuf'
import { CatalogSchema, type Catalog } from '@/gen/composeeditor/v1/spec_pb'

export type { FormElement } from '@/gen/composeeditor/v1/spec_pb'

export async function loadCatalog(): Promise<Catalog> {
  const res = await fetch(`${import.meta.env.BASE_URL}gen/templates.binpb`)
  if (!res.ok) {
    throw new Error(`couldn't load templates.binpb: ${res.status} ${res.statusText}`)
  }
  const bytes = new Uint8Array(await res.arrayBuffer())
  const catalog = fromBinary(CatalogSchema, bytes)

  return catalog
}
