import { CheckCircle2Icon, InfoIcon, TriangleAlertIcon, XCircleIcon } from 'lucide-react'
import { Markdown } from '@/components/Markdown'
import type { FormElement } from '@/lib/catalog'

export type FormValues = Record<string, string | number | boolean | null>

type ElementUnion = FormElement['element']
type InputUnion = Extract<ElementUnion, { case: 'url' | 'str' | 'text' | 'code' | 'password' | 'toggle' | 'number' | 'date' | 'select' }>

interface FormRendererProps {
  elements: FormElement[]
  values: FormValues
  onChange: (keyname: string, value: string | number | boolean | null) => void
}

export function FormRenderer({ elements, values, onChange }: FormRendererProps) {
  return (
    <div className="flex flex-col gap-5">
      {elements.map((el, i) => (
        <FormElementView key={i} element={el} values={values} onChange={onChange} />
      ))}
    </div>
  )
}

function FormElementView({
  element,
  values,
  onChange,
}: {
  element: FormElement
  values: FormValues
  onChange: (keyname: string, value: string | number | boolean | null) => void
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
          {el.value.content && <Markdown className="mt-1 text-base-content/60">{el.value.content}</Markdown>}
        </div>
      )

    case 'markdown':
      return <Markdown>{el.value.content}</Markdown>

    case 'collapsible':
      return (
        <details className="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary className="collapse-title text-sm font-medium">{el.value.title}</summary>
          <div className="collapse-content">
            <FormRenderer elements={el.value.form} values={values} onChange={onChange} />
          </div>
        </details>
      )

    case 'oneOf': {
      const oneOf = el.value
      const current = (values[oneOf.keyname] as string | undefined) ?? oneOf.tabs[0]?.value
      const activeTab = oneOf.tabs.find((tab) => tab.value === current) ?? oneOf.tabs[0]

      return (
        <div>
          <div role="tablist" className="tabs tabs-lift">
            {oneOf.tabs.map((tab) => (
              <a
                key={tab.value}
                role="tab"
                className={`tab ${tab.value === current ? 'tab-active' : ''}`}
                onClick={() => onChange(oneOf.keyname, tab.value)}
              >
                {tab.title}
              </a>
            ))}
          </div>
          {activeTab && (
            <div className="pt-3">
              <FormRenderer elements={activeTab.form} values={values} onChange={onChange} />
            </div>
          )}
        </div>
      )
    }

    case undefined:
      return null

    default:
      return <InputView el={el} value={values[el.value.keyname]} onChange={onChange} />
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
    <div role="alert" className={`alert ${variantClass}`}>
      <Icon />
      <Markdown>{content}</Markdown>
    </div>
  )
}

function InputView({
  el,
  value,
  onChange,
}: {
  el: InputUnion
  value: unknown
  onChange: (keyname: string, value: string | number | boolean | null) => void
}) {
  const { keyname, label, description, helpText } = el.value
  const stringValue = value === undefined || value === null ? '' : String(value)

  return (
    <div className="flex flex-col gap-1.5">
      {el.case !== 'toggle' && (
        <label className="label" htmlFor={keyname}>
          {label}
        </label>
      )}
      {description && <Markdown className="text-base-content/60">{description}</Markdown>}

      {(el.case === 'url' || el.case === 'str' || el.case === 'password') && (
        <input
          id={keyname}
          type={el.case === 'url' ? 'url' : el.case === 'password' ? 'password' : 'text'}
          className="input w-full"
          placeholder={el.value.placeholder}
          pattern={el.case === 'str' ? el.value.regex : undefined}
          value={stringValue}
          onChange={(e) => onChange(keyname, e.target.value)}
        />
      )}

      {(el.case === 'text' || el.case === 'code') && (
        <textarea
          id={keyname}
          placeholder={el.value.placeholder}
          value={stringValue}
          className={`textarea w-full ${el.case === 'code' ? 'font-mono text-sm' : ''}`}
          onChange={(e) => onChange(keyname, e.target.value)}
        />
      )}

      {el.case === 'number' && (
        <input
          id={keyname}
          type="number"
          className="input w-full"
          min={el.value.minimum}
          max={el.value.maximum}
          step={el.value.step}
          value={stringValue}
          onChange={(e) => onChange(keyname, e.target.valueAsNumber)}
        />
      )}

      {el.case === 'date' && (
        <input
          id={keyname}
          type="date"
          className="input w-full"
          value={stringValue}
          onChange={(e) => onChange(keyname, e.target.value)}
        />
      )}

      {el.case === 'toggle' && (
        <div className="flex items-center gap-2">
          <input
            id={keyname}
            type="checkbox"
            className="toggle"
            checked={Boolean(value)}
            onChange={(e) => onChange(keyname, e.target.checked)}
          />
          <label className="label" htmlFor={keyname}>
            {label}
          </label>
        </div>
      )}

      {el.case === 'select' && (
        <select
          id={keyname}
          className="select w-full"
          value={stringValue}
          onChange={(e) => onChange(keyname, e.target.value)}
        >
          <option value="" disabled>
            Select...
          </option>
          {el.value.options.map((opt) => (
            <option key={opt.title} value={opt.value || opt.title}>
              {opt.title}
            </option>
          ))}
        </select>
      )}

      {helpText && <Markdown className="text-xs text-base-content/60">{helpText}</Markdown>}
    </div>
  )
}
