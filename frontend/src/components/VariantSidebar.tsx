import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { Variant } from '@/lib/catalog'

interface VariantSidebarProps {
  appSlug: string
  variants: Variant[]
}

export function VariantSidebar({ appSlug, variants }: VariantSidebarProps) {
  return (
    <div className="h-full overflow-y-auto bg-base-200">
      <nav className="flex flex-col gap-0.5 p-2">
        <h3 className="font-semibold">Variants</h3>
        {variants.map((variant) => (
          <NavLink
            key={variant.slug}
            to={`/edit/${appSlug}/${variant.slug}`}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-base-100 font-medium shadow-sm' : 'text-base-content/60 hover:bg-base-100/60',
              )
            }
          >
            {variant.name}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
