// Client-side editing model for the Builder page. FormElement (the wire
// protobuf type) has no id field, but dnd-kit needs a stable unique id per
// sortable item, so BuilderNode wraps each FormElement with one. The tree is
// only ever converted to/from FormElement[] at the edges (initial load from
// a catalog entry or shared link, and on every live-preview/export), never
// round-tripped through protobuf on each edit.

import { create } from '@bufbuild/protobuf'
import { arrayMove } from '@dnd-kit/sortable'
import { FormElementSchema, type FormElement } from '@/gen/composeeditor/v1/spec_pb'

export const ROOT_LIST_ID = 'root'

export interface StringValidationFields {
  helpText: string
  regex: string
}

export interface TextLikeFields {
  keyname: string
  label: string
  description: string
  defaultValue: string
  placeholder: string
  validation: StringValidationFields
}

export interface AlertFields {
  content: string
}

export interface HeadingFields {
  title: string
  content: string
}

export interface TextBlockFields {
  content: string
}

export interface ToggleFields {
  keyname: string
  label: string
  description: string
  defaultValue: boolean
}

export interface NumberFields {
  keyname: string
  label: string
  description: string
  defaultValue: number
  minimum: number
  maximum: number
  step: number
}

export interface DateFields {
  keyname: string
  label: string
  description: string
  defaultValue: string
}

export interface SelectOptionFields {
  title: string
  value: string
  optgroup: string
}

export interface SelectFields {
  keyname: string
  label: string
  description: string
  defaultValue: string
  options: SelectOptionFields[]
}

export interface PortFields {
  keyname: string
  label: string
  description: string
  defaultValue: number
}

export interface CollapsibleFields {
  title: string
}

export interface OneOfFields {
  keyname: string
}

export interface ToggleSectionFields {
  keyname: string
  label: string
  description: string
  defaultValue: string
}

export type AlertCase = 'info' | 'warning' | 'danger' | 'success'
export type TextLikeCase = 'url' | 'str' | 'text' | 'code' | 'password'

export interface BuilderTab {
  id: string
  title: string
  value: string
  children: BuilderNode[]
}

export type BuilderNode =
  | { id: string; case: AlertCase; value: AlertFields }
  | { id: string; case: 'heading'; value: HeadingFields }
  | { id: string; case: 'markdown'; value: TextBlockFields }
  | { id: string; case: TextLikeCase; value: TextLikeFields }
  | { id: string; case: 'toggle'; value: ToggleFields }
  | { id: string; case: 'number'; value: NumberFields }
  | { id: string; case: 'date'; value: DateFields }
  | { id: string; case: 'select'; value: SelectFields }
  | { id: string; case: 'port'; value: PortFields }
  | { id: string; case: 'collapsible'; value: CollapsibleFields; children: BuilderNode[] }
  | { id: string; case: 'toggleSection'; value: ToggleSectionFields; children: BuilderNode[] }
  | { id: string; case: 'oneOf'; value: OneOfFields; tabs: BuilderTab[] }

export type BuilderNodeCase = BuilderNode['case']

export const ELEMENT_TYPES: { case: BuilderNodeCase; label: string; group: 'layout' | 'input' }[] = [
  { case: 'heading', label: 'Heading', group: 'layout' },
  { case: 'markdown', label: 'Markdown block', group: 'layout' },
  { case: 'info', label: 'Info alert', group: 'layout' },
  { case: 'warning', label: 'Warning alert', group: 'layout' },
  { case: 'danger', label: 'Danger alert', group: 'layout' },
  { case: 'success', label: 'Success alert', group: 'layout' },
  { case: 'collapsible', label: 'Collapsible section', group: 'layout' },
  { case: 'oneOf', label: 'Tabs (one of)', group: 'layout' },
  { case: 'toggleSection', label: 'Toggle section', group: 'layout' },
  { case: 'str', label: 'Text input', group: 'input' },
  { case: 'text', label: 'Textarea', group: 'input' },
  { case: 'code', label: 'Code textarea', group: 'input' },
  { case: 'url', label: 'URL input', group: 'input' },
  { case: 'password', label: 'Password input', group: 'input' },
  { case: 'toggle', label: 'Toggle', group: 'input' },
  { case: 'number', label: 'Number input', group: 'input' },
  { case: 'port', label: 'Port input', group: 'input' },
  { case: 'date', label: 'Date input', group: 'input' },
  { case: 'select', label: 'Select dropdown', group: 'input' },
]

function newId(): string {
  return crypto.randomUUID()
}

export function createNode(caseName: BuilderNodeCase): BuilderNode {
  const id = newId()
  switch (caseName) {
    case 'info':
    case 'warning':
    case 'danger':
    case 'success':
      return { id, case: caseName, value: { content: '' } }
    case 'heading':
      return { id, case: 'heading', value: { title: '', content: '' } }
    case 'markdown':
      return { id, case: 'markdown', value: { content: '' } }
    case 'url':
    case 'str':
    case 'text':
    case 'code':
    case 'password':
      return {
        id,
        case: caseName,
        value: {
          keyname: '',
          label: '',
          description: '',
          placeholder: '',
          defaultValue: '',
          validation: { helpText: '', regex: '' },
        },
      }
    case 'toggle':
      return { id, case: 'toggle', value: { keyname: '', label: '', description: '', defaultValue: false } }
    case 'number':
      return { id, case: 'number', value: { keyname: '', label: '', description: '', defaultValue: 0, minimum: 0, maximum: 100, step: 1 } }
    case 'date':
      return { id, case: 'date', value: { keyname: '', label: '', description: '', defaultValue: '' } }
    case 'select':
      return { id, case: 'select', value: { keyname: '', label: '', description: '', defaultValue: '', options: [] } }
    case 'port':
      return { id, case: 'port', value: { keyname: '', label: '', description: '', defaultValue: 8080 } }
    case 'collapsible':
      return { id, case: 'collapsible', value: { title: '' }, children: [] }
    case 'toggleSection':
      return { id, case: 'toggleSection', value: { keyname: '', label: '', description: '', defaultValue: 'false' }, children: [] }
    case 'oneOf':
      return { id, case: 'oneOf', value: { keyname: '' }, tabs: [] }
  }
}

export function createTab(): BuilderTab {
  return { id: newId(), title: '', value: '', children: [] }
}

// --- FormElement[] -> BuilderNode[] -------------------------------------

export function formElementsToBuilderNodes(elements: FormElement[]): BuilderNode[] {
  return elements.map(formElementToBuilderNode)
}

function formElementToBuilderNode(el: FormElement): BuilderNode {
  const id = newId()
  const e = el.element

  switch (e.case) {
    case 'info':
    case 'warning':
    case 'danger':
    case 'success':
      return { id, case: e.case, value: { content: e.value.content } }
    case 'heading':
      return { id, case: 'heading', value: { title: e.value.title, content: e.value.content } }
    case 'markdown':
      return { id, case: 'markdown', value: { content: e.value.content } }
    case 'url':
    case 'str':
    case 'text':
    case 'code':
    case 'password':
      return {
        id,
        case: e.case,
        value: {
          keyname: e.value.keyname,
          label: e.value.label,
          description: e.value.description,
          placeholder: e.value.placeholder,
          defaultValue: e.value.defaultValue,
          validation: { helpText: e.value.validation?.helpText ?? '', regex: e.value.validation?.regex ?? '' },
        },
      }
    case 'toggle':
      return {
        id,
        case: 'toggle',
        value: { keyname: e.value.keyname, label: e.value.label, description: e.value.description, defaultValue: e.value.defaultValue },
      }
    case 'number':
      return {
        id,
        case: 'number',
        value: {
          keyname: e.value.keyname,
          label: e.value.label,
          description: e.value.description,
          defaultValue: e.value.defaultValue,
          minimum: e.value.minimum,
          maximum: e.value.maximum,
          step: e.value.step,
        },
      }
    case 'date':
      return {
        id,
        case: 'date',
        value: { keyname: e.value.keyname, label: e.value.label, description: e.value.description, defaultValue: e.value.defaultValue },
      }
    case 'select':
      return {
        id,
        case: 'select',
        value: {
          keyname: e.value.keyname,
          label: e.value.label,
          description: e.value.description,
          defaultValue: e.value.defaultValue,
          options: e.value.options.map((o) => ({ title: o.title, value: o.value, optgroup: o.optgroup })),
        },
      }
    case 'port':
      return {
        id,
        case: 'port',
        value: { keyname: e.value.keyname, label: e.value.label, description: e.value.description, defaultValue: e.value.defaultValue },
      }
    case 'collapsible':
      return { id, case: 'collapsible', value: { title: e.value.title }, children: formElementsToBuilderNodes(e.value.form) }
    case 'toggleSection':
      return {
        id,
        case: 'toggleSection',
        value: {
          keyname: e.value.keyname,
          label: e.value.label,
          description: e.value.description,
          defaultValue: e.value.defaultValue,
        },
        children: formElementsToBuilderNodes(e.value.form),
      }
    case 'oneOf':
      return {
        id,
        case: 'oneOf',
        value: { keyname: e.value.keyname },
        tabs: e.value.tabs.map((tab) => ({ id: newId(), title: tab.title, value: tab.value, children: formElementsToBuilderNodes(tab.form) })),
      }
    case undefined:
      return { id, case: 'markdown', value: { content: '' } }
  }
}

// --- BuilderNode[] -> FormElement[] -------------------------------------

export function builderNodesToFormElements(nodes: BuilderNode[]): FormElement[] {
  return nodes.map(builderNodeToFormElement)
}

export function builderNodeToFormElement(node: BuilderNode): FormElement {
  switch (node.case) {
    case 'info':
      return create(FormElementSchema, { element: { case: 'info', value: { content: node.value.content } } })
    case 'warning':
      return create(FormElementSchema, { element: { case: 'warning', value: { content: node.value.content } } })
    case 'danger':
      return create(FormElementSchema, { element: { case: 'danger', value: { content: node.value.content } } })
    case 'success':
      return create(FormElementSchema, { element: { case: 'success', value: { content: node.value.content } } })
    case 'heading':
      return create(FormElementSchema, { element: { case: 'heading', value: { title: node.value.title, content: node.value.content } } })
    case 'markdown':
      return create(FormElementSchema, { element: { case: 'markdown', value: { content: node.value.content } } })
    case 'url':
    case 'str':
    case 'text':
    case 'code':
    case 'password': {
      const hasValidation = node.value.validation.helpText !== '' || node.value.validation.regex !== ''
      const fields = {
        keyname: node.value.keyname,
        label: node.value.label,
        description: node.value.description,
        placeholder: node.value.placeholder,
        defaultValue: node.value.defaultValue,
        validation: hasValidation ? node.value.validation : undefined,
      }
      switch (node.case) {
        case 'url':
          return create(FormElementSchema, { element: { case: 'url', value: fields } })
        case 'str':
          return create(FormElementSchema, { element: { case: 'str', value: fields } })
        case 'text':
          return create(FormElementSchema, { element: { case: 'text', value: fields } })
        case 'code':
          return create(FormElementSchema, { element: { case: 'code', value: fields } })
        case 'password':
          return create(FormElementSchema, { element: { case: 'password', value: fields } })
      }
      break
    }
    case 'toggle':
      return create(FormElementSchema, { element: { case: 'toggle', value: node.value } })
    case 'number':
      return create(FormElementSchema, { element: { case: 'number', value: node.value } })
    case 'date':
      return create(FormElementSchema, { element: { case: 'date', value: node.value } })
    case 'select':
      return create(FormElementSchema, { element: { case: 'select', value: node.value } })
    case 'port':
      return create(FormElementSchema, { element: { case: 'port', value: node.value } })
    case 'collapsible':
      return create(FormElementSchema, {
        element: { case: 'collapsible', value: { title: node.value.title, form: builderNodesToFormElements(node.children) } },
      })
    case 'toggleSection':
      return create(FormElementSchema, {
        element: { case: 'toggleSection', value: { ...node.value, form: builderNodesToFormElements(node.children) } },
      })
    case 'oneOf':
      return create(FormElementSchema, {
        element: {
          case: 'oneOf',
          value: {
            keyname: node.value.keyname,
            tabs: node.tabs.map((tab) => ({ title: tab.title, value: tab.value, form: builderNodesToFormElements(tab.children) })),
          },
        },
      })
  }
  throw new Error(`unreachable: unhandled node case`)
}

// --- Tree editing helpers ------------------------------------------------

// Applies `fn` to the list identified by `listId` ('root', or a
// collapsible/toggleSection/oneOf-tab node's own id), leaving the rest of
// the tree untouched.
function mapList(nodes: BuilderNode[], listId: string, fn: (list: BuilderNode[]) => BuilderNode[]): BuilderNode[] {
  if (listId === ROOT_LIST_ID) return fn(nodes)

  return nodes.map((node) => {
    if (node.case === 'collapsible' || node.case === 'toggleSection') {
      return node.id === listId ? { ...node, children: fn(node.children) } : { ...node, children: mapList(node.children, listId, fn) }
    }
    if (node.case === 'oneOf') {
      return {
        ...node,
        tabs: node.tabs.map((tab) =>
          tab.id === listId ? { ...tab, children: fn(tab.children) } : { ...tab, children: mapList(tab.children, listId, fn) },
        ),
      }
    }
    return node
  })
}

// Visits every node in preorder, replacing it with `fn(node)`, or dropping
// it entirely if `fn` returns null. Used for both editing a node in place
// and deleting one, so both share the same tree-walk.
function mapNodes(nodes: BuilderNode[], fn: (node: BuilderNode) => BuilderNode | null): BuilderNode[] {
  const result: BuilderNode[] = []
  for (const node of nodes) {
    const mapped = fn(node)
    if (mapped === null) continue

    if (mapped.case === 'collapsible' || mapped.case === 'toggleSection') {
      result.push({ ...mapped, children: mapNodes(mapped.children, fn) })
    } else if (mapped.case === 'oneOf') {
      result.push({ ...mapped, tabs: mapped.tabs.map((tab) => ({ ...tab, children: mapNodes(tab.children, fn) })) })
    } else {
      result.push(mapped)
    }
  }
  return result
}

export function moveWithinList(tree: BuilderNode[], listId: string, oldIndex: number, newIndex: number): BuilderNode[] {
  return mapList(tree, listId, (list) => arrayMove(list, oldIndex, newIndex))
}

export function insertIntoList(tree: BuilderNode[], listId: string, node: BuilderNode, index?: number): BuilderNode[] {
  return mapList(tree, listId, (list) => {
    const next = [...list]
    next.splice(index ?? next.length, 0, node)
    return next
  })
}

// Whether `listId` (a container/tab node's own id, or ROOT_LIST_ID) still
// identifies a list somewhere in `tree`. Used to reject a cross-container
// move that would drop a container into its own descendant: the caller
// removes the dragged node first, then checks whether the destination list
// survived that removal.
function listExists(tree: BuilderNode[], listId: string): boolean {
  if (listId === ROOT_LIST_ID) return true
  let found = false
  mapList(tree, listId, (list) => {
    found = true
    return list
  })
  return found
}

// Relocates the node identified by `nodeId` to `toListId` at `toIndex`,
// wherever in the tree it currently lives (same list or a different one).
// A no-op if the move would be a no-op source (node not found) or would
// nest a container inside its own descendant list.
export function moveNode(tree: BuilderNode[], nodeId: string, toListId: string, toIndex: number): BuilderNode[] {
  const node = findNode(tree, nodeId)
  if (!node) return tree

  const withoutNode = removeNode(tree, nodeId)
  if (!listExists(withoutNode, toListId)) return tree

  return insertIntoList(withoutNode, toListId, node, toIndex)
}

export function updateNode(tree: BuilderNode[], id: string, updater: (node: BuilderNode) => BuilderNode): BuilderNode[] {
  return mapNodes(tree, (node) => (node.id === id ? updater(node) : node))
}

export function removeNode(tree: BuilderNode[], id: string): BuilderNode[] {
  return mapNodes(tree, (node) => (node.id === id ? null : node))
}

export function findNode(tree: BuilderNode[], id: string): BuilderNode | undefined {
  for (const node of tree) {
    if (node.id === id) return node
    if (node.case === 'collapsible' || node.case === 'toggleSection') {
      const found = findNode(node.children, id)
      if (found) return found
    } else if (node.case === 'oneOf') {
      for (const tab of node.tabs) {
        const found = findNode(tab.children, id)
        if (found) return found
      }
    }
  }
  return undefined
}

export function addOneOfTab(tree: BuilderNode[], oneOfId: string, tab: BuilderTab): BuilderNode[] {
  return updateNode(tree, oneOfId, (node) => (node.case === 'oneOf' ? { ...node, tabs: [...node.tabs, tab] } : node))
}

export function removeOneOfTab(tree: BuilderNode[], oneOfId: string, tabId: string): BuilderNode[] {
  return updateNode(tree, oneOfId, (node) => (node.case === 'oneOf' ? { ...node, tabs: node.tabs.filter((t) => t.id !== tabId) } : node))
}
