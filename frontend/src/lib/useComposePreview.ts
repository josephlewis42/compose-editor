// Shared debounced "template + values -> compose output/errors" preview
// logic, used by both the catalog EditorPage and the Builder page's preview
// mode against the same WASM template engine.

import { create } from '@bufbuild/protobuf'
import { useEffect, useState } from 'react'
import { convertComposeSpec } from '@/lib/wasm'
import type { FormValues } from '@/components/FormRenderer'
import { MessageSchema, type Message } from '@/gen/composeeditor/v1/wasm_pb'

const DEBOUNCE_MS = 100

export interface ComposePreview {
  composeOutput: string
  errors: Message[]
  warnings: Message[]
}

export function useComposePreview(template: string, values: FormValues): ComposePreview {
  const [composeOutput, setComposeOutput] = useState('')
  const [errors, setErrors] = useState<Message[]>([])
  const [warnings, setWarnings] = useState<Message[]>([])

  useEffect(() => {
    const handle = setTimeout(() => {
      convertComposeSpec({ template, values })
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
  }, [template, values])

  return { composeOutput, errors, warnings }
}
