import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EyeIcon, GripVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { FormRenderer } from '@/components/FormRenderer'
import { ElementFields } from '@/components/builder/ElementFields'
import { FormTree, type FormTreeCallbacks } from '@/components/builder/FormTree'
import { ELEMENT_TYPES, builderNodeToFormElement, type BuilderNode } from '@/lib/builderTree'

function summaryFor(node: BuilderNode): string {
  switch (node.case) {
    case 'info':
    case 'warning':
    case 'danger':
    case 'success':
      return node.value.content.slice(0, 60) || '(empty)'
    case 'heading':
      return node.value.title || '(untitled)'
    case 'markdown':
      return node.value.content.slice(0, 60) || '(empty)'
    case 'collapsible':
      return node.value.title || '(untitled)'
    case 'oneOf':
      return node.value.keyname ? `$${node.value.keyname} (${node.tabs.length} tabs)` : `${node.tabs.length} tabs`
    case 'toggleSection':
      return node.value.label || node.value.keyname || '(untitled)'
    default:
      return node.value.label || node.value.keyname || '(untitled)'
  }
}

interface ElementCardProps extends FormTreeCallbacks {
  node: BuilderNode
}

export function ElementCard({ node, onAdd, onChange, onDelete }: ElementCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const meta = ELEMENT_TYPES.find((t) => t.case === node.case)
  const [panel, setPanel] = useState<'none' | 'edit' | 'preview'>('none')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-base-300 bg-base-100 ${isDragging ? 'z-10 opacity-50 shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          className="btn btn-ghost btn-square btn-sm cursor-grab touch-none active:cursor-grabbing"
          aria-label="Reorder element"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          <span className="badge badge-outline badge-sm">{meta?.label ?? node.case}</span>
          <span className="ml-2 truncate text-sm text-base-content/80">{summaryFor(node)}</span>
        </div>

        <div className="join">
          <button
            type="button"
            className={`btn btn-square btn-sm join-item ${panel === 'edit' ? 'btn-active' : 'btn-ghost'}`}
            onClick={() => setPanel((p) => (p === 'edit' ? 'none' : 'edit'))}
            aria-label="Edit element"
            aria-pressed={panel === 'edit'}
          >
            <PencilIcon className="size-4" />
          </button>
          <button
            type="button"
            className={`btn btn-square btn-sm join-item ${panel === 'preview' ? 'btn-active' : 'btn-ghost'}`}
            onClick={() => setPanel((p) => (p === 'preview' ? 'none' : 'preview'))}
            aria-label="Preview element"
            aria-pressed={panel === 'preview'}
          >
            <EyeIcon className="size-4" />
          </button>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-square btn-sm text-error"
          onClick={() => onDelete(node.id)}
          aria-label="Delete element"
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>

      {panel === 'edit' && (
        <div className="flex flex-col gap-3 border-t border-base-300 bg-base-200/40 p-3">
          <ElementFields node={node} onChange={(next) => onChange(node.id, next)} />
        </div>
      )}

      {panel === 'preview' && (
        <div className="border-t border-base-300 bg-base-200/40 p-3">
          <FormRenderer elements={[builderNodeToFormElement(node)]} onUpdate={()=>{}} />
        </div>
      )}

      {(node.case === 'collapsible' || node.case === 'toggleSection') && (
        <div className="border-t border-base-300 p-3 pl-8">
          <FormTree listId={node.id} nodes={node.children} onAdd={onAdd} onChange={onChange} onDelete={onDelete} />
        </div>
      )}

      {node.case === 'oneOf' && (
        <div className="flex flex-col gap-3 border-t border-base-300 p-3 pl-8">
          {node.tabs.length === 0 && <p className="text-xs italic text-base-content/50">No tabs yet — add one via the pencil icon.</p>}
          {node.tabs.map((tab) => (
            <div key={tab.id} className="rounded-md border border-base-300 p-2">
              <div className="mb-2 text-xs font-medium text-base-content/60">Tab: {tab.title || tab.value || '(untitled)'}</div>
              <FormTree listId={tab.id} nodes={tab.children} onAdd={onAdd} onChange={onChange} onDelete={onDelete} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
