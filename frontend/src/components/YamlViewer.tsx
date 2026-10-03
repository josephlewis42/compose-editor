import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, highlightActiveLine, highlightActiveLineGutter, lineNumbers } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { yaml } from '@codemirror/lang-yaml'
import { type Diagnostic, lintGutter, setDiagnostics } from '@codemirror/lint'
import { tags } from '@lezer/highlight'
import type { ValidationError } from '@/lib/validator'

// Use DaisyUI CSS vars to keep in sync with the theme and dark/light transitions.
const yamlHighlightStyle = HighlightStyle.define([
  { tag: tags.definition(tags.propertyName), color: 'var(--color-primary)', fontWeight: 600 },
  { tag: tags.string, color: 'var(--color-success)' },
  { tag: tags.special(tags.string), color: 'var(--color-success)' },
  { tag: tags.content, color: 'var(--color-base-content)' },
  { tag: tags.labelName, color: 'var(--color-secondary)' },
  { tag: tags.typeName, color: 'var(--color-accent)' },
  { tag: tags.keyword, color: 'var(--color-secondary)', fontWeight: 600 },
  { tag: tags.attributeValue, color: 'var(--color-accent)' },
  { tag: tags.lineComment, color: 'var(--color-base-content)', opacity: 0.5, fontStyle: 'italic' },
  { tag: [tags.separator, tags.punctuation], color: 'var(--color-base-content)', opacity: 0.55 },
  { tag: [tags.squareBracket, tags.brace], color: 'var(--color-base-content)', opacity: 0.7 },
])

const theme = EditorView.theme({
  '&': {
    height: '100%',
    color: 'var(--color-base-content)',
    backgroundColor: 'var(--color-base-100)',
    fontSize: '0.8125rem',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'color-mix(in oklab, var(--color-primary) 25%, transparent) !important',
  },
  '.cm-content': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    padding: '0.5rem 0',
  },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-gutters': {
    backgroundColor: 'var(--color-base-200)',
    color: 'color-mix(in oklab, var(--color-base-content) 45%, transparent)',
    border: 'none',
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    backgroundColor: 'var(--color-base-200)',
  },
})

interface YamlViewerProps {
  value: string
  errors?: ValidationError[]
  className?: string
  /** If set, the viewer becomes editable. */
  onChange?: (value: string) => void
}

/** Converts our (line, col) validation errors into CodeMirror Diagnostics, positioned against the current doc. */
function toDiagnostics(state: EditorState, errors: ValidationError[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  for (const error of errors) {
    if (error.line === undefined || error.col === undefined) {
      continue
    }
    if (error.line < 1 || error.line > state.doc.lines) {
      continue
    }
    const docLine = state.doc.line(error.line)
    const from = Math.min(docLine.from + (error.col - 1), docLine.to)
    diagnostics.push({ from, to: docLine.to, severity: 'error', source: error.type, message: error.message })
  }
  return diagnostics
}

const NO_ERRORS: ValidationError[] = []

export function YamlViewer({ value, errors = NO_ERRORS, className, onChange }: YamlViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!containerRef.current) {return}

    const view = new EditorView({
      doc: value,
      parent: containerRef.current,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        EditorState.readOnly.of(!onChange),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {onChangeRef.current?.(update.state.doc.toString())}
        }),
        EditorView.lineWrapping,
        yaml(),
        syntaxHighlighting(yamlHighlightStyle),
        theme,
        lintGutter(),
      ],
    })
    viewRef.current = view
    return () => view.destroy()
    // Only the mount-time value seeds the doc; later changes are patched in
    // place by the effect below instead of recreating the view.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Document updates
  useEffect(() => {
    const view = viewRef.current
    if (!view) {return}
    if (view.state.doc.toString() !== value) {
      view.dispatch({ changes: { from: 0, insert: value, to: view.state.doc.length } })
    }
  }, [value])

  // Linter items
  useEffect(() => {
    const view = viewRef.current
    if (view) {
      view.dispatch(setDiagnostics(view.state, toDiagnostics(view.state, errors)))
    }
  }, [errors])


  return <div ref={containerRef} className={className} />
}
