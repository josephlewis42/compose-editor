import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { create } from '@bufbuild/protobuf'
import { FormRenderer, type FormValues } from '@/components/FormRenderer'
import { OutputPanel } from '@/components/OutputPanel'
import { defaultFormValues } from '@/lib/form'
import { convertComposeSpec } from '@/lib/wasm'
import { type Application } from '@/gen/composeeditor/v1/spec_pb'
import { MessageSchema, type Message } from '@/gen/composeeditor/v1/wasm_pb'

const DEBOUNCE_MS = 100

interface EditorPageProps {
  app: Application
}

export function EditorPage({ app }: EditorPageProps) {

  const [values, setValues] = useState<FormValues>(() => defaultFormValues(app.form))
  const [composeOutput, setComposeOutput] = useState('')
  const [errors, setErrors] = useState<Message[]>([])
  const [warnings, setWarnings] = useState<Message[]>([])

  useEffect(() => {
    setValues(defaultFormValues(app.form))
  }, [app])

  useEffect(() => {
    const handle = setTimeout(() => {
      convertComposeSpec({ template: app.template, values })
        .then((out) => {
          setComposeOutput(out.compose_output)
          setErrors(out.errors)
          setWarnings(out.warnings)
        })
        .catch((err: unknown) => {
          setComposeOutput('')
          setErrors([create(MessageSchema, { message: err instanceof Error ? err.message : String(err) })])
          setWarnings([])
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(handle)
  }, [app, values])

  const onChange = (keyname: string, value: string|number|boolean|null) => {
    setValues((prev) => ({ ...prev, [keyname]: value }))
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-6 py-4 border-dotted">
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
          <a href={app.url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
            Website
          </a>
          <a
            href={app.licenseUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {app.spdxLicense} license
          </a>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_1fr]">
        <div className="min-h-0 overflow-y-auto p-6">
          {app.form && app.form.length > 0 ? (
            <FormRenderer elements={app.form} values={values} onChange={onChange} />
          ) : (
            <p className="text-base-content/60">This variant has no configurable options.</p>
          )}
        </div>

        <div className="min-h-0">
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
