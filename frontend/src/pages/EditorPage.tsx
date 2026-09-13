import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SlidersHorizontalIcon, TerminalIcon } from 'lucide-react'
import { FormRenderer, type FormValues } from '@/components/FormRenderer'
import { OutputPanel } from '@/components/OutputPanel'
import { useComposePreview } from '@/lib/useComposePreview'
import { type Application } from '@/gen/composeeditor/v1/spec_pb'

interface EditorPageProps {
  app: Application
}

export function EditorPage({ app }: EditorPageProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="w-full shrink-0 bg-primary/30">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Link to="/">Catalog</Link>
              </li>
              <li>{app.name}</li>
            </ul>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{app.name}</h1>
          <p className="text-base-content/60">{app.tagline}</p>
          <div className="mt-1 flex gap-3 text-sm">
            <a href={app.url} target="_blank" rel="noreferrer" className="link">
              Website
            </a>
            <a
              href={app.licenseUrl}
              target="_blank"
              rel="noreferrer"
              className="link"
            >
              {app.spdxLicense} license
            </a>
          </div>
        </div>
      </header>


      {/* Keyed on slug so switching applications remounts the form and its
          values from scratch, instead of needing an effect to reset them. */}
      <main role="main" className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-6 py-5">
        <EditorForm key={app.slug} app={app} />
      </main>
    </div>
  )
}

function EditorForm({ app }: { app: Application }) {
  const [values, setValues] = useState<FormValues>({})
  const [mobileTab, setMobileTab] = useState<'form' | 'output'>('form')
  const { composeOutput, errors, warnings } = useComposePreview(app.template, values)

  const onUpdate = (patch: FormValues) => {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 justify-center border-b border-base-300 bg-base-200 p-3 lg:hidden">
        <div role="tablist" className="tabs tabs-box tabs-lg">
          <a
            role="tab"
            className={`tab gap-2 ${mobileTab === 'form' ? 'tab-active' : ''}`}
            onClick={() => setMobileTab('form')}
          >
            <SlidersHorizontalIcon className="size-4" /> Form
          </a>
          <a
            role="tab"
            className={`tab gap-2 ${mobileTab === 'output' ? 'tab-active' : ''}`}
            onClick={() => setMobileTab('output')}
          >
            <TerminalIcon className="size-4" /> Output
          </a>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_1fr]">
        <div
          className={`min-h-0 overflow-y-auto p-6 ${mobileTab === 'form' ? 'block' : 'hidden'} lg:block`}
        >
          {app.form && app.form.length > 0 ? (
            <FormRenderer elements={app.form} onUpdate={onUpdate} />
          ) : (
            <p className="text-base-content/60">This variant has no configurable options.</p>
          )}
        </div>

        <div className={`h-full min-h-0 ${mobileTab === 'output' ? 'block' : 'hidden'} lg:block`}>
          <OutputPanel
            composeOutput={composeOutput}
            errors={errors}
            warnings={warnings}
            values={values}
            downloadName={`${app.slug}-${app.slug}.compose.yaml`}
          />
        </div>
      </div>
    </div>
  )
}
