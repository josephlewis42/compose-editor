import type { ReactNode } from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import {
  createTab,
  type BuilderNode,
  type HeadingFields,
  type TextBlockFields,
  type AlertFields,
  type TextLikeFields,
  type ToggleFields,
  type NumberFields,
  type DateFields,
  type SelectFields,
  type SelectOptionFields,
  type PortFields,
  type CollapsibleFields,
  type ToggleSectionFields,
  type OneOfFields,
} from '@/lib/builderTree'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}

function CommonFields({
  value,
  onChange,
}: {
  value: { keyname: string; label: string; description: string }
  onChange: (patch: Partial<{ keyname: string; label: string; description: string }>) => void
}) {
  return (
    <>
      <Field label="Keyname">
        <input
          className="input input-sm w-full font-mono"
          value={value.keyname}
          onChange={(e) => onChange({ keyname: e.target.value })}
        />
      </Field>
      <Field label="Label">
        <input className="input input-sm w-full" value={value.label} onChange={(e) => onChange({ label: e.target.value })} />
      </Field>
      <Field label="Description (markdown)">
        <textarea
          className="textarea textarea-sm w-full"
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </Field>
    </>
  )
}

function ValidationFields({
  value,
  onChange,
}: {
  value: TextLikeFields['validation']
  onChange: (patch: Partial<TextLikeFields['validation']>) => void
}) {
  return (
    <>
      <Field label="Validation regex (optional)">
        <input className="input input-sm w-full font-mono" value={value.regex} onChange={(e) => onChange({ regex: e.target.value })} />
      </Field>
      <Field label="Validation help text (optional, markdown)">
        <textarea className="textarea textarea-sm w-full" value={value.helpText} onChange={(e) => onChange({ helpText: e.target.value })} />
      </Field>
    </>
  )
}

// Inline, type-specific edit fields for one element. Used by ElementCard's
// pencil view — replaces what used to be a side drawer.
export function ElementFields({ node, onChange }: { node: BuilderNode; onChange: (next: BuilderNode) => void }) {
  switch (node.case) {
    case 'info':
    case 'warning':
    case 'danger':
    case 'success': {
      const setValue = (patch: Partial<AlertFields>) => onChange({ ...node, value: { ...node.value, ...patch } })
      return (
        <Field label="Content (markdown)">
          <textarea
            className="textarea textarea-sm w-full"
            rows={3}
            value={node.value.content}
            onChange={(e) => setValue({ content: e.target.value })}
          />
        </Field>
      )
    }

    case 'heading': {
      const setValue = (patch: Partial<HeadingFields>) => onChange({ ...node, value: { ...node.value, ...patch } })
      return (
        <>
          <Field label="Title">
            <input className="input input-sm w-full" value={node.value.title} onChange={(e) => setValue({ title: e.target.value })} />
          </Field>
          <Field label="Content (markdown, optional)">
            <textarea
              className="textarea textarea-sm w-full"
              value={node.value.content}
              onChange={(e) => setValue({ content: e.target.value })}
            />
          </Field>
        </>
      )
    }

    case 'markdown': {
      const setValue = (patch: Partial<TextBlockFields>) => onChange({ ...node, value: { ...node.value, ...patch } })
      return (
        <Field label="Content (markdown)">
          <textarea
            className="textarea textarea-sm w-full"
            rows={3}
            value={node.value.content}
            onChange={(e) => setValue({ content: e.target.value })}
          />
        </Field>
      )
    }

    case 'url':
    case 'str':
    case 'text':
    case 'code':
    case 'password': {
      const setValue = (patch: Partial<TextLikeFields>) => onChange({ ...node, value: { ...node.value, ...patch } })
      return (
        <>
          <CommonFields value={node.value} onChange={setValue} />
          <Field label="Default value">
            <input className="input input-sm w-full" value={node.value.defaultValue} onChange={(e) => setValue({ defaultValue: e.target.value })} />
          </Field>
          <Field label="Placeholder">
            <input className="input input-sm w-full" value={node.value.placeholder} onChange={(e) => setValue({ placeholder: e.target.value })} />
          </Field>
          <ValidationFields
            value={node.value.validation}
            onChange={(patch) => setValue({ validation: { ...node.value.validation, ...patch } })}
          />
        </>
      )
    }

    case 'toggle': {
      const setValue = (patch: Partial<ToggleFields>) => onChange({ ...node, value: { ...node.value, ...patch } })
      return (
        <>
          <CommonFields value={node.value} onChange={setValue} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="toggle"
              checked={node.value.defaultValue}
              onChange={(e) => setValue({ defaultValue: e.target.checked })}
            />
            Default on
          </label>
        </>
      )
    }

    case 'number': {
      const setValue = (patch: Partial<NumberFields>) => onChange({ ...node, value: { ...node.value, ...patch } })
      return (
        <>
          <CommonFields value={node.value} onChange={setValue} />
          <Field label="Default value">
            <input
              type="number"
              className="input input-sm w-full"
              value={node.value.defaultValue}
              onChange={(e) => setValue({ defaultValue: e.target.valueAsNumber })}
            />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Min">
              <input
                type="number"
                className="input input-sm w-full"
                value={node.value.minimum}
                onChange={(e) => setValue({ minimum: e.target.valueAsNumber })}
              />
            </Field>
            <Field label="Max">
              <input
                type="number"
                className="input input-sm w-full"
                value={node.value.maximum}
                onChange={(e) => setValue({ maximum: e.target.valueAsNumber })}
              />
            </Field>
            <Field label="Step">
              <input
                type="number"
                className="input input-sm w-full"
                value={node.value.step}
                onChange={(e) => setValue({ step: e.target.valueAsNumber })}
              />
            </Field>
          </div>
        </>
      )
    }

    case 'date': {
      const setValue = (patch: Partial<DateFields>) => onChange({ ...node, value: { ...node.value, ...patch } })
      return (
        <>
          <CommonFields value={node.value} onChange={setValue} />
          <Field label="Default value (YYYY-MM-DD)">
            <input
              type="date"
              className="input input-sm w-full"
              value={node.value.defaultValue}
              onChange={(e) => setValue({ defaultValue: e.target.value })}
            />
          </Field>
        </>
      )
    }

    case 'port': {
      const setValue = (patch: Partial<PortFields>) => onChange({ ...node, value: { ...node.value, ...patch } })
      return (
        <>
          <CommonFields value={node.value} onChange={setValue} />
          <Field label="Default value">
            <input
              type="number"
              min={1}
              max={65536}
              className="input input-sm w-full"
              value={node.value.defaultValue}
              onChange={(e) => setValue({ defaultValue: e.target.valueAsNumber })}
            />
          </Field>
        </>
      )
    }

    case 'select': {
      const setValue = (patch: Partial<SelectFields>) => onChange({ ...node, value: { ...node.value, ...patch } })
      const setOption = (index: number, patch: Partial<SelectOptionFields>) => {
        const options = node.value.options.map((o, i) => (i === index ? { ...o, ...patch } : o))
        setValue({ options })
      }
      return (
        <>
          <CommonFields value={node.value} onChange={setValue} />
          <Field label="Default value">
            <input
              className="input input-sm w-full"
              value={node.value.defaultValue}
              onChange={(e) => setValue({ defaultValue: e.target.value })}
            />
          </Field>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Options</span>
            {node.value.options.map((option, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  className="input input-sm w-full"
                  placeholder="Title"
                  value={option.title}
                  onChange={(e) => setOption(i, { title: e.target.value })}
                />
                <input
                  className="input input-sm w-full"
                  placeholder="Value (optional)"
                  value={option.value}
                  onChange={(e) => setOption(i, { value: e.target.value })}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-square btn-sm text-error"
                  onClick={() => setValue({ options: node.value.options.filter((_, oi) => oi !== i) })}
                  aria-label="Remove option"
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline btn-sm gap-1.5 self-start"
              onClick={() => setValue({ options: [...node.value.options, { title: '', value: '', optgroup: '' }] })}
            >
              <PlusIcon className="size-4" /> Add option
            </button>
          </div>
        </>
      )
    }

    case 'collapsible': {
      const setValue = (patch: Partial<CollapsibleFields>) => onChange({ ...node, value: { ...node.value, ...patch } })
      return (
        <>
          <Field label="Title">
            <input className="input input-sm w-full" value={node.value.title} onChange={(e) => setValue({ title: e.target.value })} />
          </Field>
          <p className="text-xs text-base-content/60">Elements inside this section are edited in the tree below.</p>
        </>
      )
    }

    case 'toggleSection': {
      const setValue = (patch: Partial<ToggleSectionFields>) => onChange({ ...node, value: { ...node.value, ...patch } })
      return (
        <>
          <CommonFields value={node.value} onChange={setValue} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="toggle"
              checked={node.value.defaultValue === 'true'}
              onChange={(e) => setValue({ defaultValue: e.target.checked ? 'true' : 'false' })}
            />
            Default on
          </label>
          <p className="text-xs text-base-content/60">Elements revealed by the toggle are edited in the tree below.</p>
        </>
      )
    }

    case 'oneOf': {
      const setValue = (patch: Partial<OneOfFields>) => onChange({ ...node, value: { ...node.value, ...patch } })
      const setTab = (id: string, patch: Partial<{ title: string; value: string }>) =>
        onChange({ ...node, tabs: node.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
      const removeTab = (id: string) => onChange({ ...node, tabs: node.tabs.filter((t) => t.id !== id) })

      return (
        <>
          <Field label="Keyname">
            <input className="input input-sm w-full font-mono" value={node.value.keyname} onChange={(e) => setValue({ keyname: e.target.value })} />
          </Field>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Tabs</span>
            {node.tabs.map((tab) => (
              <div key={tab.id} className="flex items-center gap-1.5">
                <input
                  className="input input-sm w-full"
                  placeholder="Title"
                  value={tab.title}
                  onChange={(e) => setTab(tab.id, { title: e.target.value })}
                />
                <input
                  className="input input-sm w-full font-mono"
                  placeholder="Value"
                  value={tab.value}
                  onChange={(e) => setTab(tab.id, { value: e.target.value })}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-square btn-sm text-error"
                  onClick={() => removeTab(tab.id)}
                  aria-label="Remove tab"
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline btn-sm gap-1.5 self-start"
              onClick={() => onChange({ ...node, tabs: [...node.tabs, createTab()] })}
            >
              <PlusIcon className="size-4" /> Add tab
            </button>
          </div>
          <p className="text-xs text-base-content/60">Each tab's elements are edited in the tree below.</p>
        </>
      )
    }
  }
}
