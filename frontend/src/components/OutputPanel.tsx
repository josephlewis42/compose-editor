import { useState } from 'react'
import { CheckIcon, CodeIcon, CopyIcon, DownloadIcon } from 'lucide-react'
import type { Message } from '@/gen/composeeditor/v1/engine_pb'
import type { FormValues } from './FormRenderer'

interface OutputPanelProps {
  composeOutput: string
  errors: Message[]
  warnings: Message[]
  values: FormValues
  downloadName: string
}

export function OutputPanel({ composeOutput, errors, warnings, values, downloadName }: OutputPanelProps) {
  const [tab, setTab] = useState<'output' | 'details'>('output')
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(composeOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    const blob = new Blob([composeOutput], { type: 'application/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full flex-col bg-base-200">
      <div className="flex items-center justify-between px-4 pt-3">
        <div role="tablist" className="tabs tabs-lift">
          <a
            role="tab"
            className={`tab gap-1.5 ${tab === 'output' ? 'tab-active' : ''}`}
            onClick={() => setTab('output')}
          >
            <CodeIcon className="size-4" /> Compose Output
          </a>
          <a
            role="tab"
            className={`tab gap-1.5 ${tab === 'details' ? 'tab-active' : ''}`}
            onClick={() => setTab('details')}
          >
            Details
            {errors.length > 0 && <span className="badge badge-error badge-sm ml-1">{errors.length}</span>}
          </a>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={copy} disabled={!composeOutput}>
            {copied ? <CheckIcon /> : <CopyIcon />} {copied ? 'Copied!' : 'Copy'}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={download} disabled={!composeOutput}>
            <DownloadIcon /> Download
          </button>
        </div>
      </div>

      {tab === 'output' && (
        <div className="min-h-0 flex-1 px-4 pb-4">
          <textarea
            readOnly
            value={composeOutput}
            className="textarea h-full w-full resize-none font-mono text-sm"
            spellCheck={false}
          />
        </div>
      )}

      {tab === 'details' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <div className="flex flex-col gap-4 pr-4">
            {errors.length > 0 && <MessageList title="Errors" messages={errors} tone="error" />}
            {warnings.length > 0 && <MessageList title="Warnings" messages={warnings} tone="warning" />}
            <div>
              <h4 className="mb-1 text-sm font-medium">Form values</h4>
              <pre className="overflow-x-auto rounded-lg border border-base-300 bg-base-200 p-3 font-mono text-xs">
                {JSON.stringify(values, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MessageList({
  title,
  messages,
  tone,
}: {
  title: string
  messages: Message[]
  tone: 'error' | 'warning'
}) {
  return (
    <div>
      <h4 className={`mb-1 text-sm font-medium ${tone === 'error' ? 'text-error' : ''}`}>{title}</h4>
      <ul className="flex flex-col gap-1 text-sm">
        {messages.map((m, i) => (
          <li key={i} className="rounded-md border border-base-300 px-2.5 py-1.5">
            {m.field && <span className="mr-1 font-mono text-xs text-base-content/60">[{m.field}]</span>}
            {m.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
