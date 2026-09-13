import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AddElementMenu } from '@/components/builder/AddElementMenu'
import { ElementCard } from '@/components/builder/ElementCard'
import type { BuilderNode } from '@/lib/builderTree'

// Prefix distinguishing an empty-list drop target's id from a real node id,
// since a SortableContext with zero items renders no drop surface of its
// own to catch a drag crossing into it.
export const EMPTY_LIST_DROP_PREFIX = 'empty:'

function EmptyListDropZone({ listId }: { listId: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${EMPTY_LIST_DROP_PREFIX}${listId}` })
  return (
    <div
      ref={setNodeRef}
      className={`rounded-md border border-dashed p-3 text-xs italic ${isOver ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 text-base-content/50'}`}
    >
      No elements yet — drag one here, or add one below.
    </div>
  )
}

export interface FormTreeCallbacks {
  onAdd: (listId: string, node: BuilderNode) => void
  onChange: (id: string, next: BuilderNode) => void
  onDelete: (id: string) => void
}

interface FormTreeProps extends FormTreeCallbacks {
  listId: string
  nodes: BuilderNode[]
}

// One drag-and-drop sortable list. Used for the top-level form, and
// recursively for each collapsible/toggleSection/oneOf-tab's own child
// list — `listId` is what dnd-kit's onDragEnd uses to tell lists apart.
export function FormTree({ listId, nodes, onAdd, onChange, onDelete }: FormTreeProps) {
  return (
    <SortableContext id={listId} items={nodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
      <div className="flex flex-col gap-2">
        {nodes.map((node) => (
          <ElementCard key={node.id} node={node} onAdd={onAdd} onChange={onChange} onDelete={onDelete} />
        ))}
        {nodes.length === 0 && <EmptyListDropZone listId={listId} />}
        <AddElementMenu onAdd={(node) => onAdd(listId, node)} />
      </div>
    </SortableContext>
  )
}
