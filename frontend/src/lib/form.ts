import type { FormValues } from '@/components/FormRenderer'
import type { FormElement } from '@/lib/catalog'

export function defaultFormValues(elements: FormElement[] | undefined): FormValues {
  const values: FormValues = {}
  collect(elements, values)
  return values
}

function collect(elements: FormElement[] | undefined, values: FormValues) {
  for (const fe of elements ?? []) {
    const el = fe.element
    switch (el.case) {
      case 'collapsible':
        collect(el.value.form, values)
        break
      case 'oneOf':
        values[el.value.keyname] = el.value.tabs[0]?.value
        for (const tab of el.value.tabs) {
          collect(tab.form, values)
        }
        break
      case 'toggleSection':
        collect(el.value.form, values)
        break
      case 'info':
      case 'warning':
      case 'danger':
      case 'success':
      case 'heading':
      case 'markdown':
      case undefined:
        break
      default:
        if (el.value.defaultValue !== undefined) {
          values[el.value.keyname] = el.value.defaultValue
        }
    }
  }
}
