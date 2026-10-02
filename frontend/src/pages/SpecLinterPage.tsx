import { useDeferredValue, useMemo, useState } from 'react'
import { CircleCheckIcon } from 'lucide-react'
import { YamlViewer } from '@/components/YamlViewer'
import { parseComposeYaml, type ValidationError } from '@/lib/validator'

const DEFAULT_SPEC = `# This is a demo spec, you can paste yours here.
version: 1.0
services:
  my-server:
    image: php:latest
`

// Runs the same validators the Output panel runs over rendered templates
// (lib/validator) against any compose file pasted in by hand.
export function SpecLinterPage() {
  const [composeYaml, setComposeYaml] = useState(DEFAULT_SPEC)
  const deferredYaml = useDeferredValue(composeYaml)
  const errors = useMemo(() => parseComposeYaml(deferredYaml).errors, [deferredYaml])
  const hasInput = composeYaml.trim().length > 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="w-full shrink-0 bg-primary/30">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <h1 className="text-2xl font-semibold tracking-tight">Compose Spec Linter</h1>
          <p className="text-base-content/60">
            Paste a Docker compose file to check syntax and best practices.
          </p>
        </div>
      </header>

      <main role="main" className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-5">
        <div className="flex shrink-0 items-center gap-2">
          <h2 className="text-sm font-medium">compose.yaml</h2>
          <div className="flex-1" />
          {hasInput &&
            (errors.length === 0 ? (
              <span className="badge badge-success gap-1">
                <CircleCheckIcon className="size-3.5" /> No issues
              </span>
            ) : (
              <span className="badge badge-error">
                {errors.length} {errors.length === 1 ? 'issue' : 'issues'}
              </span>
            ))}
          <button type="button" className="btn btn-ghost btn-sm" disabled={!hasInput} onClick={() => setComposeYaml('')}>
            Clear
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={composeYaml == DEFAULT_SPEC} onClick={() => setComposeYaml(DEFAULT_SPEC)}>
            Load Demo
          </button>
        </div>

        <YamlViewer
          value={composeYaml}
          errors={errors}
          onChange={setComposeYaml}
          className="min-h-80 flex-1 overflow-hidden rounded-lg border border-base-300"
        />

        {hasInput && errors.length > 0 && (
          <div className="shrink-0 overflow-y-auto rounded-lg border border-base-300 bg-base-100 p-4 lg:max-h-64">
            <IssueList errors={errors} />
          </div>
        )}
      </main>
    </div>
  )
}

function IssueList({ errors }: { errors: ValidationError[] }) {
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {errors.map((e, i) => (
        <li key={i} className="rounded-md border border-base-300 px-2.5 py-1.5">
          {e.line !== undefined && (
            <span className="mr-1 font-mono text-xs text-base-content/60">
              L{e.line}
              {e.col !== undefined ? `:${e.col}` : ''}
            </span>
          )}
          <span className="mr-1 font-mono text-xs text-base-content/60">[{e.path}]</span>
          <span className="badge badge-ghost badge-sm mr-1">{e.type}</span>
          {e.message}
        </li>
      ))}
    </ul>
  )
}
