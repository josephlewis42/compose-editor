import { PlusIcon } from 'lucide-react'
import { createNode, ELEMENT_TYPES, type BuilderNode } from '@/lib/builderTree'

export function AddElementMenu({ onAdd }: { onAdd: (node: BuilderNode) => void }) {
  const layout = ELEMENT_TYPES.filter((t) => t.group === 'layout')
  const inputs = ELEMENT_TYPES.filter((t) => t.group === 'input')

  const add = (caseName: BuilderNode['case']) => {
    onAdd(createNode(caseName))
    // The daisyUI dropdown stays open via :focus-within on its trigger, not
    // the clicked item (a plain <a> with no href never takes focus), so
    // closing it means blurring whatever's actually focused.
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  return (
    <div className="dropdown">
      <div tabIndex={0} role="button" className="btn btn-outline btn-sm gap-1.5">
        <PlusIcon className="size-4" /> Add element
      </div>
      <ul tabIndex={0} className="dropdown-content menu z-10 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
        <li className="menu-title">Layout</li>
        {layout.map((t) => (
          <li key={t.case}>
            <a onClick={() => add(t.case)}>{t.label}</a>
          </li>
        ))}
        <li className="menu-title">Inputs</li>
        {inputs.map((t) => (
          <li key={t.case}>
            <a onClick={() => add(t.case)}>{t.label}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
