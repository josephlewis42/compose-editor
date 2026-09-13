import { CheckCircle2Icon, InfoIcon, TriangleAlertIcon, XCircleIcon } from 'lucide-react'
import { Markdown } from '@/components/Markdown'
import type { FormElement } from '@/lib/catalog'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  CodeInput,
  DateInput,
  NumberInput,
  OneOf,
  PasswordInput,
  PortInput,
  SelectInput,
  StringInput,
  StringValidation,
  TextAreaInput,
  ToggleInput,
  ToggleSection,
  URLInput,
} from '@/gen/composeeditor/v1/spec_pb'

export type Value = string | number | boolean | null
export type FormValues = Record<string, Value>
export type FormUpdate = (values: FormValues) => void

export function FormRenderer({
  elements,
  onUpdate,
}: {
  elements: FormElement[]
  onUpdate: FormUpdate
}) {
  return (
    <div className="flex flex-col gap-5">
      {elements.map((el, i) => (
        <FormElementView key={i} element={el} onUpdate={onUpdate} />
      ))}
    </div>
  )
}

function FormElementView({
  element,
  onUpdate,
}: {
  element: FormElement
  onUpdate: FormUpdate
}) {
  const el = element.element

  switch (el.case) {
    case 'info':
    case 'warning':
    case 'danger':
    case 'success':
      return <AlertView content={el.value.content} variant={el.case} />

    case 'heading':
      return (
        <div>
          <h3 className="text-base font-semibold">{el.value.title}</h3>
          {el.value.content && <Markdown className="text-base-content/60">{el.value.content}</Markdown>}
        </div>
      )

    case 'markdown':
      return <Markdown>{el.value.content}</Markdown>

    case 'collapsible':
      return (
        <details className="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary className="collapse-title text-sm font-medium">{el.value.title}</summary>
          <div className="collapse-content">
            <FormRenderer elements={el.value.form} onUpdate={onUpdate} />
          </div>
        </details>
      )

    case 'oneOf':
      return <FieldOneOf field={el.value} onUpdate={onUpdate} />

    case 'toggleSection':
      return <FieldToggleSection field={el.value} onUpdate={onUpdate} />

    case 'url':
      return <FieldUrl field={el.value} onUpdate={onUpdate} />

    case 'str':
      return <FieldString field={el.value} onUpdate={onUpdate} />

    case 'text':
      return <FieldTextArea field={el.value} onUpdate={onUpdate} />

    case 'code':
      return <FieldCode field={el.value} onUpdate={onUpdate} />

    case 'password':
      return <FieldPassword field={el.value} onUpdate={onUpdate} />

    case 'toggle':
      return <FieldToggle field={el.value} onUpdate={onUpdate} />

    case 'number':
      return <FieldNumber field={el.value} onUpdate={onUpdate} />

    case 'date':
      return <FieldDate field={el.value} onUpdate={onUpdate} />

    case 'select':
      return <FieldSelect field={el.value} onUpdate={onUpdate} />

    case 'port':
      return <FieldPort field={el.value} onUpdate={onUpdate} />

    case undefined:
      return null
  }
}

function AlertView({
  content,
  variant,
}: {
  content: string
  variant: 'info' | 'warning' | 'danger' | 'success'
}) {
  const variantClass = {
    info: 'alert-info',
    warning: 'alert-warning',
    danger: 'alert-error',
    success: 'alert-success',
  }[variant]

  const Icon = {
    info: InfoIcon,
    warning: TriangleAlertIcon,
    danger: XCircleIcon,
    success: CheckCircle2Icon,
  }[variant]

  return (
    <div role="alert" className={`alert ${variantClass} alert-outline`}>
      <Icon />
      <Markdown>{content}</Markdown>
    </div>
  )
}

function FieldLabel({
  keyname,
  label,
  description,
}: {
  keyname: string
  label: string
  description?: string
}) {
  return (
    <>
      <label className="label" htmlFor={keyname}>
        {label}
      </label>
      {description && <Markdown className="text-base-content/60">{description}</Markdown>}
    </>
  )
}

// Emits the field's value under `keyname` once on mount (its default) and
// again on every change, per FormRenderer's propagate-up-the-tree contract.
function useFieldValue<T extends Value>(keyname: string, defaultValue: T, onUpdate: FormUpdate): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    onUpdate({ [keyname]: defaultValue })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update = (next: T) => {
    setValue(next)
    onUpdate({ [keyname]: next })
  }

  return [value, update]
}

type TextLikeInput = {
  keyname: string
  label: string
  description: string
  defaultValue: string
  placeholder: string
  validation?: StringValidation
}

function useTextInput(field: TextLikeInput, onUpdate: FormUpdate) {
  const [value, setValue] = useFieldValue(field.keyname, field.defaultValue, onUpdate)
  const [invalid, setInvalid] = useState(false)

  const rawRegex = useMemo(() => {
    return field.validation?.regex
  }, [field])

  const setAndCheckValidity = useCallback((newValue: string) => {
    var isInvalid = false
    if (rawRegex && !(new RegExp(rawRegex)).test(newValue)) {
      isInvalid = true
    }

    setValue(newValue)
    setInvalid(isInvalid)
  }, [setValue, setInvalid, rawRegex]);

  return { value, setAndCheckValidity, invalid }
}

function FieldUrl({ field, onUpdate }: { field: URLInput; onUpdate: FormUpdate }) {
  const { value, setAndCheckValidity, invalid } = useTextInput(field, onUpdate)

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel keyname={field.keyname} label={field.label} description={field.description} />
      <input
        id={field.keyname}
        type="url"
        className="input w-full"
        placeholder={field.placeholder}
        pattern={field.validation?.regex}
        value={value}
        onChange={(e) => setAndCheckValidity(e.target.value)}
      />
      {invalid && field.validation?.helpText && (
        <Markdown className="text-xs text-base-content/60">{field.validation.helpText}</Markdown>
      )}
    </div>
  )
}

function FieldString({ field, onUpdate }: { field: StringInput; onUpdate: FormUpdate }) {
  const { value, setAndCheckValidity, invalid } = useTextInput(field, onUpdate)

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel keyname={field.keyname} label={field.label} description={field.description} />
      <input
        id={field.keyname}
        type="text"
        className="input w-full"
        placeholder={field.placeholder}
        pattern={field.validation?.regex}
        value={value}
        onChange={(e) => setAndCheckValidity(e.target.value)}
      />
      {invalid && field.validation?.helpText && (
        <Markdown className="text-xs text-base-content/60">{field.validation.helpText}</Markdown>
      )}
    </div>
  )
}

function FieldPassword({ field, onUpdate }: { field: PasswordInput; onUpdate: FormUpdate }) {
  const { value, setAndCheckValidity, invalid } = useTextInput(field, onUpdate)

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel keyname={field.keyname} label={field.label} description={field.description} />
      <input
        id={field.keyname}
        type="password"
        className="input w-full"
        placeholder={field.placeholder}
        pattern={field.validation?.regex}
        value={value}
        onChange={(e) => setAndCheckValidity(e.target.value)}
      />
      {invalid && field.validation?.helpText && (
        <Markdown className="text-xs text-base-content/60">{field.validation.helpText}</Markdown>
      )}
    </div>
  )
}

function FieldTextArea({ field, onUpdate }: { field: TextAreaInput; onUpdate: FormUpdate }) {
  const { value, setAndCheckValidity } = useTextInput(field, onUpdate)

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel keyname={field.keyname} label={field.label} description={field.description} />
      <textarea
        id={field.keyname}
        placeholder={field.placeholder}
        value={value}
        className="textarea w-full"
        onChange={(e) => setAndCheckValidity(e.target.value)}
      />
    </div>
  )
}

function FieldCode({ field, onUpdate }: { field: CodeInput; onUpdate: FormUpdate }) {
  const { value, setAndCheckValidity } = useTextInput(field, onUpdate)

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel keyname={field.keyname} label={field.label} description={field.description} />
      <textarea
        id={field.keyname}
        placeholder={field.placeholder}
        value={value}
        className="textarea w-full font-mono text-sm"
        onChange={(e) => setAndCheckValidity(e.target.value)}
      />
    </div>
  )
}

function FieldToggle({ field, onUpdate }: { field: ToggleInput; onUpdate: FormUpdate }) {
  const [checked, setChecked] = useFieldValue(field.keyname, field.defaultValue, onUpdate)

  return (
    <div className="flex items-start gap-2">
      <input
        id={field.keyname}
        type="checkbox"
        className="toggle"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
      <div className="flex flex-col gap-1">
        <label className="label" htmlFor={field.keyname}>
          {field.label}
        </label>
        {field.description && <Markdown className="text-base-content/60">{field.description}</Markdown>}
      </div>
    </div>
  )
}

function FieldNumber({ field, onUpdate }: { field: NumberInput; onUpdate: FormUpdate }) {
  const [value, setValue] = useFieldValue(field.keyname, field.defaultValue, onUpdate)

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel keyname={field.keyname} label={field.label} description={field.description} />
      <input
        id={field.keyname}
        type="number"
        className="input w-full"
        min={field.minimum}
        max={field.maximum}
        step={field.step}
        value={value}
        onChange={(e) => setValue(e.target.valueAsNumber)}
      />
    </div>
  )
}

function FieldPort({ field, onUpdate }: { field: PortInput; onUpdate: FormUpdate }) {
  const [value, setValue] = useFieldValue(field.keyname, field.defaultValue, onUpdate)

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel keyname={field.keyname} label={field.label} description={field.description} />
      <input
        id={field.keyname}
        type="number"
        className="input w-full"
        min={1}
        max={65536}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.valueAsNumber)}
      />
    </div>
  )
}

function FieldDate({ field, onUpdate }: { field: DateInput; onUpdate: FormUpdate }) {
  const [value, setValue] = useFieldValue(field.keyname, field.defaultValue, onUpdate)

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel keyname={field.keyname} label={field.label} description={field.description} />
      <input
        id={field.keyname}
        type="date"
        className="input w-full"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  )
}

function FieldSelect({ field, onUpdate }: { field: SelectInput; onUpdate: FormUpdate }) {
  const [value, setValue] = useFieldValue(field.keyname, field.defaultValue, onUpdate)

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel keyname={field.keyname} label={field.label} description={field.description} />
      <select id={field.keyname} className="select w-full" value={value} onChange={(e) => setValue(e.target.value)}>
        {field.options.map((opt) => (
          <option key={opt.title} value={opt.value || opt.title}>
            {opt.title}
          </option>
        ))}
      </select>
    </div>
  )
}

function FieldOneOf({ field, onUpdate }: { field: OneOf; onUpdate: FormUpdate }) {
  const [selected, setSelected] = useFieldValue(field.keyname, field.tabs[0]?.value ?? '', onUpdate)
  const activeTab = field.tabs.find((tab) => tab.value === selected) ?? field.tabs[0]

  return (
    <div>
      <div role="tablist" className="tabs tabs-lift">
        {field.tabs.map((tab) => (
          <a
            key={tab.value}
            role="tab"
            className={`tab ${tab.value === selected ? 'tab-active' : ''}`}
            onClick={() => setSelected(tab.value)}
          >
            {tab.title}
          </a>
        ))}
      </div>
      {activeTab && (
        <div className="pt-3">
          {/* Keyed on the tab so switching tabs remounts its fields and re-emits their defaults. */}
          <FormRenderer key={activeTab.value} elements={activeTab.form} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  )
}

function FieldToggleSection({ field, onUpdate }: { field: ToggleSection; onUpdate: FormUpdate }) {
  const [checked, setChecked] = useFieldValue(field.keyname, field.defaultValue === 'true', onUpdate)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
      <div className="flex items-start gap-2">
        <input
          id={field.keyname}
          type="checkbox"
          className="toggle"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor={field.keyname}>
            {field.label}
          </label>
          {field.description && <Markdown className="text-base-content/60">{field.description}</Markdown>}
        </div>
      </div>
      {checked && (
        <div className="pl-2">
          <FormRenderer elements={field.form} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  )
}
