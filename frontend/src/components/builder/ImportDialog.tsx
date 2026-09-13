import { useState } from 'react'
import { UploadIcon } from 'lucide-react'
import { specYamlToApplication } from '@/lib/yamlImport'
import type { Application, Catalog } from '@/gen/composeeditor/v1/spec_pb'

interface ImportDialogProps {
  catalog: Catalog
  onImport: (app: Application) => void
  onClose: () => void
}

export function ImportDialog({ catalog, onImport, onClose }: ImportDialogProps) {
  const [selectedSlug, setSelectedSlug] = useState('')
  const [yamlText, setYamlText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const apps = [...catalog.applications].sort((a, b) => a.name.localeCompare(b.name))

  const loadFromCatalog = () => {
    const app = apps.find((a) => a.slug === selectedSlug)
    if (app) onImport(app)
  }

  const importYamlText = (text: string) => {
    try {
      onImport(specYamlToApplication(text))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const onFile = async (file: File) => {
    const text = await file.text()
    setYamlText(text)
    importYamlText(text)
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="text-lg font-semibold">Import from existing</h3>

        <div className="mt-4 flex flex-col gap-2">
          <span className="text-sm font-medium">From the catalog</span>
          <div className="flex gap-2">
            <select className="select select-sm w-full" value={selectedSlug} onChange={(e) => setSelectedSlug(e.target.value)}>
              <option value="">Choose an application...</option>
              {apps.map((app) => (
                <option key={app.slug} value={app.slug}>
                  {app.name}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-outline btn-sm" disabled={!selectedSlug} onClick={loadFromCatalog}>
              Load
            </button>
          </div>
        </div>

        <div className="divider">or</div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Paste or upload a spec.yaml</span>
          <textarea
            className="textarea h-40 w-full font-mono text-xs"
            placeholder={'name: My App\ntagline: ...\n...'}
            value={yamlText}
            onChange={(e) => setYamlText(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <label className="btn btn-outline btn-sm gap-1.5">
              <UploadIcon className="size-4" /> Upload file
              <input
                type="file"
                accept=".yaml,.yml,text/yaml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void onFile(file)
                  e.target.value = ''
                }}
              />
            </label>
            <button type="button" className="btn btn-primary btn-sm" disabled={!yamlText.trim()} onClick={() => importYamlText(yamlText)}>
              Import
            </button>
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  )
}
