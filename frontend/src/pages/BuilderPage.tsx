import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { create } from '@bufbuild/protobuf'
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type Over } from '@dnd-kit/core'
import { CheckIcon, CopyIcon, DownloadIcon, EyeIcon, PencilIcon, Share2Icon, UploadIcon } from 'lucide-react'
import { ExternalLink } from '@/components/ExternalLink'
import { FormRenderer, type FormValues } from '@/components/FormRenderer'
import { OutputPanel } from '@/components/OutputPanel'
import { EMPTY_LIST_DROP_PREFIX, FormTree } from '@/components/builder/FormTree'
import { ImportDialog } from '@/components/builder/ImportDialog'
import { useComposePreview } from '@/lib/useComposePreview'
import {
  ROOT_LIST_ID,
  builderNodesToFormElements,
  formElementsToBuilderNodes,
  insertIntoList,
  moveNode,
  moveWithinList,
  removeNode,
  updateNode,
  type BuilderNode,
} from '@/lib/builderTree'
import { decodeShareLink, encodeShareLink } from '@/lib/shareLink'
import { applicationToSpecYaml } from '@/lib/yamlExport'
import { ApplicationSchema, type Application, type Catalog } from '@/gen/composeeditor/v1/spec_pb'

const DRAFT_STORAGE_KEY = 'compose-editor:builder-draft'
const AUTOSAVE_DEBOUNCE_MS = 500

// A curated subset of common identifiers from https://spdx.org/licenses/
const COMMON_SPDX_LICENSES = [
  'MIT',
  'Apache-2.0',
  'GPL-2.0-only',
  'GPL-3.0-only',
  'LGPL-2.1-only',
  'LGPL-3.0-only',
  'AGPL-3.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'MPL-2.0',
  'ISC',
  'Unlicense',
  'Other',
] as const


interface Metadata {
  slug: string
  name: string
  tagline: string
  url: string
  spdxLicense: string
  licenseUrl: string
  tags: string
}

const EMPTY_METADATA: Metadata = { slug: '', name: '', tagline: '', url: '', spdxLicense: '', licenseUrl: '', tags: '' }


// Directory-name-safe slug, matching specs/README.md's convention
// (lower-case, underscores rather than spaces) closely enough for a
// starting suggestion the user can still edit by hand.
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}


function closeDropdown() {
  ;(document.activeElement as HTMLElement | null)?.blur()
}

interface BuilderPageProps {
  catalog: Catalog
}

export function BuilderPage({ catalog }: BuilderPageProps) {
  const { data } = useParams<{ data?: string }>()

  const [metadata, setMetadata] = useState<Metadata>(EMPTY_METADATA)
  const [tree, setTree] = useState<BuilderNode[]>([])
  const [template, setTemplate] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Opening a shared link is someone handing you a form to try, not a
  // document to start editing — land them where they can use it right away.
  const [mode, setMode] = useState<'edit' | 'preview'>(data ? 'preview' : 'edit')
  const [previewValues, setPreviewValues] = useState<FormValues>({})
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [specYaml, setSpecYaml] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const applyApplication = (app: Application) => {
    setMetadata({
      slug: app.slug,
      name: app.name,
      tagline: app.tagline,
      url: app.url,
      spdxLicense: app.spdxLicense,
      licenseUrl: app.licenseUrl,
      tags: app.tags.join(', '),
    })
    setTree(formElementsToBuilderNodes(app.form))
    setTemplate(app.template)
  }

  // Loads, in priority order: a shared link's data, or an autosaved draft
  // from a previous visit, or (if neither) just starts blank.
  useEffect(() => {
    if (data) {
      decodeShareLink(data)
        .then(applyApplication)
        .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : String(err)))
        .finally(() => setLoaded(true))
      return
    }

    const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!saved) {
      setLoaded(true)
      return
    }
    decodeShareLink(saved)
      .then(applyApplication)
      .catch(() => localStorage.removeItem(DRAFT_STORAGE_KEY))
      .finally(() => setLoaded(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const draftApp = useMemo<Application>(
    () =>
      create(ApplicationSchema, {
        slug: metadata.slug,
        name: metadata.name,
        tagline: metadata.tagline,
        url: metadata.url,
        spdxLicense: metadata.spdxLicense,
        licenseUrl: metadata.licenseUrl,
        tags: metadata.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        template,
        form: builderNodesToFormElements(tree),
      }),
    [metadata, template, tree],
  )

  // Autosaves the draft so navigating away and back doesn't lose progress.
  // Reuses the share-link encoding (gzip + binary protobuf) rather than a
  // second JSON scheme, since it's already exactly "serialize this Application".
  useEffect(() => {
    if (!loaded) return
    const handle = setTimeout(() => {
      void encodeShareLink(draftApp).then((encoded) => localStorage.setItem(DRAFT_STORAGE_KEY, encoded))
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [draftApp, loaded])

  const { composeOutput, errors, warnings } = useComposePreview(template, previewValues)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Where a drag-over target actually lands: either a real sortable item
  // (which carries its list id and index via dnd-kit's sortable data), or
  // an empty list's dedicated drop zone (see FormTree's EMPTY_LIST_DROP_PREFIX).
  const resolveOverTarget = (over: Over): { listId: string; index: number } | null => {
    const overId = String(over.id)
    if (overId.startsWith(EMPTY_LIST_DROP_PREFIX)) {
      return { listId: overId.slice(EMPTY_LIST_DROP_PREFIX.length), index: 0 }
    }
    const sortable = over.data.current?.sortable
    if (sortable) return { listId: sortable.containerId as string, index: sortable.index as number }
    return null
  }

  // Cross-container moves are re-parented live as the drag crosses into a
  // different list, so the item is already in the right list by the time
  // onDragEnd fires — same-list reordering is left to onDragEnd, matching
  // dnd-kit's own multi-container recipe.
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const fromList = active.data.current?.sortable?.containerId
    const target = resolveOverTarget(over)
    if (typeof fromList !== 'string' || !target || fromList === target.listId) return
    setTree((t) => moveNode(t, String(active.id), target.listId, target.index))
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    const fromList = active.data.current?.sortable?.containerId
    const target = resolveOverTarget(over)
    if (typeof fromList !== 'string' || !target || fromList !== target.listId) return
    const oldIndex = active.data.current?.sortable?.index
    if (typeof oldIndex !== 'number' || oldIndex === target.index) return
    setTree((t) => moveWithinList(t, fromList, oldIndex, target.index))
  }

  const handleAdd = (listId: string, node: BuilderNode) => setTree((t) => insertIntoList(t, listId, node))
  const handleDelete = (id: string) => setTree((t) => removeNode(t, id))
  const handleElementChange = (id: string, next: BuilderNode) => setTree((t) => updateNode(t, id, () => next))

  const updateMetadata = (patch: Partial<Metadata>) => {
    setMetadata((m) => {
      const next = { ...m, ...patch }
      // Only ever auto-fill an untouched slug — once the user has typed
      // anything into it, their input wins from then on.
      if (patch.name !== undefined && m.slug === '') next.slug = slugify(patch.name)
      return next
    })
  }

  const handleShare = async () => {
    setShareLoading(true)
    try {
      const encoded = await encodeShareLink(draftApp)
      setShareLink(`${window.location.origin}${window.location.pathname}#/build/${encoded}`)
    } finally {
      setShareLoading(false)
    }
  }

  const handleImport = (app: Application) => {
    const hasContent = metadata.name !== '' || template !== '' || tree.length > 0
    if (hasContent && !window.confirm('Importing will replace the current draft. Continue?')) return
    applyApplication(app)
    setImportOpen(false)
  }

  if (!loaded) {
    return <p className="p-6 text-base-content/60">Loading draft...</p>
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="w-full shrink-0 border-b border-base-300 bg-base-100">
        <div className="mx-auto flex max-w-6xl items-center gap-1 px-6 py-2">
          <h1 className="mr-2 text-base font-semibold">Builder</h1>

          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
              File
            </div>
            <ul tabIndex={0} className="dropdown-content menu z-20 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
              <li>
                <a
                  onClick={() => {
                    setSpecYaml(applicationToSpecYaml(draftApp))
                    closeDropdown()
                  }}
                >
                  <DownloadIcon className="size-4" /> Export YAML
                </a>
              </li>
              <li>
                <a
                  onClick={() => {
                    setImportOpen(true)
                    closeDropdown()
                  }}
                >
                  <UploadIcon className="size-4" /> Import from existing...
                </a>
              </li>
            </ul>
          </div>

          {loadError && <p className="ml-2 truncate text-sm text-error">Couldn't load the shared draft: {loadError}</p>}

          <div className="flex-1" />

          <button type="button" className="btn btn-primary btn-sm gap-1.5" onClick={handleShare} disabled={shareLoading}>
            <Share2Icon className="size-4" /> Share
          </button>

          <div role="tablist" className="tabs tabs-box tabs-sm ml-2">
            <a role="tab" className={`tab gap-1.5 ${mode === 'edit' ? 'tab-active' : ''}`} onClick={() => setMode('edit')}>
              <PencilIcon className="size-4" /> Edit
            </a>
            <a role="tab" className={`tab gap-1.5 ${mode === 'preview' ? 'tab-active' : ''}`} onClick={() => setMode('preview')}>
              <EyeIcon className="size-4" /> Preview
            </a>
          </div>
        </div>
      </header>

      <main role="main" className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-6 py-5">
        {mode === 'edit' ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
              <MetadataFields metadata={metadata} onChange={updateMetadata} />

              <div>
                <h2 className="mb-2 text-sm font-semibold">Form</h2>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                  <FormTree listId={ROOT_LIST_ID} nodes={tree} onAdd={handleAdd} onChange={handleElementChange} onDelete={handleDelete} />
                </DndContext>
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-1.5">
              <label htmlFor="builder-template" className="text-sm font-semibold">
                Compose template
              </label>
              <p className="text-xs text-base-content/60">
                Reference: <ExternalLink href="https://pkg.go.dev/text/template" text="Go template syntax" /> and{' '}
                <ExternalLink href="https://masterminds.github.io/sprig/" text="Sprig functions" /> (the same template language and
                function library used in Helm charts).
              </p>
              <textarea
                id="builder-template"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                spellCheck={false}
                className="textarea h-full min-h-64 w-full flex-1 font-mono text-sm"
                placeholder={'services:\n  app:\n    image: {{ .Values.image | quote }}'}
              />
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
            <div className="min-h-0 overflow-y-auto p-1 pr-4">
              {draftApp.form.length > 0 ? (
                <FormRenderer elements={draftApp.form} onUpdate={(patch) => setPreviewValues((v) => ({ ...v, ...patch }))} />
              ) : (
                <p className="text-base-content/60">Add elements in Edit mode to preview the form here.</p>
              )}
            </div>
            <div className="h-full min-h-0">
              <OutputPanel
                composeOutput={composeOutput}
                errors={errors}
                warnings={warnings}
                values={previewValues}
                downloadName={`${metadata.slug || 'draft'}.compose.yaml`}
              />
            </div>
          </div>
        )}
      </main>

      {importOpen && <ImportDialog catalog={catalog} onImport={handleImport} onClose={() => setImportOpen(false)} />}

      {shareLink && <CopyDialog title="Shareable link" value={shareLink} onClose={() => setShareLink(null)} />}
      {specYaml !== null && (
        <CopyDialog
          title="spec.yaml"
          value={specYaml}
          filename={`${metadata.slug || 'draft'}.spec.yaml`}
          onClose={() => setSpecYaml(null)}
        />
      )}
    </div>
  )
}

function MetadataFields({ metadata, onChange }: { metadata: Metadata; onChange: (patch: Partial<Metadata>) => void }) {
  // Whether the custom-license text box is showing can't be derived purely
  // from metadata.spdxLicense: picking "Other" while a known license was
  // selected clears nothing (so the box starts pre-filled with the old
  // value, still a "known" string) and an empty value is ambiguous between
  // "nothing chosen" and "chose Other, haven't typed one yet". Local state
  // tracks the choice directly, resynced whenever the license changes for
  // a reason other than typing into that box (e.g. an import).
  const [customLicense, setCustomLicense] = useState(false)
  const [syncedLicense, setSyncedLicense] = useState(metadata.spdxLicense)
  if (metadata.spdxLicense !== syncedLicense) {
    setSyncedLicense(metadata.spdxLicense)
    setCustomLicense(metadata.spdxLicense !== '' && !(COMMON_SPDX_LICENSES as readonly string[]).includes(metadata.spdxLicense))
  }
  const licenseSelectValue = customLicense ? 'Other' : metadata.spdxLicense

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="col-span-full flex flex-col gap-1 text-sm">
        <label className="font-medium" htmlFor="metadata_app_name">Application Name</label>
        <span className="text-base-content/60">Human readable name of the application.</span>
        <input id="metadata_app_name" className="input input-sm w-full" value={metadata.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="My Application" />
      </div>
      <div className="col-span-full flex flex-col gap-1 text-sm">
        <label className="font-medium">Tagline</label>
        <span className="text-base-content/60">One sentence description of the application.</span>
        <input className="input input-sm w-full" value={metadata.tagline} onChange={(e) => onChange({ tagline: e.target.value })} />
      </div>
      <label className="col-span-full flex flex-col gap-1 text-sm">
        <span className="font-medium">Website URL</span>
        <span className="text-base-content/60">The main website for the application.</span>
        <input className="input input-sm w-full" value={metadata.url} onChange={(e) => onChange({ url: e.target.value })} />
      </label>
      <div className="flex flex-col gap-1 text-sm">
        <label className="font-medium">SPDX license</label>
        <span className="text-base-content/60">
          <ExternalLink href="https://spdx.org/licenses/" text="SPDX license"/> for the main app. Use <code>Other</code> if unknown.
        </span>
        <datalist id="spdx-license-datalist">
          {COMMON_SPDX_LICENSES.map((license) => (
            <option key={license} value={license} />
          ))}
        </datalist>
        <input
          className="input input-sm w-full"
          value={licenseSelectValue}
          onChange={(e) => {
            const v = e.target.value
            onChange({ spdxLicense: v })
          }}
          list="spdx-license-datalist"
        />
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <label className="font-medium">License URL</label>
        <input className="input input-sm w-full" value={metadata.licenseUrl} onChange={(e) => onChange({ licenseUrl: e.target.value })} />
      </div>
      <div className="col-span-full flex flex-col gap-1 text-sm">
        <label className="font-medium">Tags (comma separated)</label>
        <input className="input input-sm w-full" value={metadata.tags} onChange={(e) => onChange({ tags: e.target.value })} />
      </div>
    </div>
  )
}

function CopyDialog({
  title,
  value,
  filename,
  onClose,
}: {
  title: string
  value: string
  filename?: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename ?? 'download.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <textarea
          readOnly
          value={value}
          className="textarea mt-3 h-64 w-full font-mono text-xs"
          spellCheck={false}
          onFocus={(e) => e.target.select()}
        />
        <div className="modal-action">
          {filename && (
            <button type="button" className="btn btn-outline" onClick={download}>
              <DownloadIcon className="size-4" /> Download
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={copy}>
            {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />} {copied ? 'Copied!' : 'Copy'}
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  )
}
