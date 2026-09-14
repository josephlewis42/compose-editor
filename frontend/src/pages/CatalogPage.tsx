import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { type Catalog, type Application } from '@/gen/composeeditor/v1/spec_pb'
import { ExternalLink } from '@/components/ExternalLink'

const MIN_APPS_FOR_TAG_CHIP = 3

interface CatalogPageProps {
  catalog: Catalog
}

export function CatalogPage({ catalog }: CatalogPageProps) {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const applications = useMemo(
    () => [...catalog.applications].sort((a, b) => a.name.localeCompare(b.name)),
    [catalog.applications],
  )

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const app of applications) {
      for (const tag of app.tags ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }
    }
    return counts
  }, [applications])

  const visibleTags = useMemo(
    () =>
      [...tagCounts.entries()]
        .filter(([, count]) => count > MIN_APPS_FOR_TAG_CHIP)
        .sort((a, b) => a[0].localeCompare(b[0])),
    [tagCounts],
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return applications.filter((app) => {
      if (activeTag && !app.tags?.includes(activeTag)) return false
      if (!query) return true
      return (
        app.name.toLowerCase().includes(query) || app.tagline.toLowerCase().includes(query)
      )
    })
  }, [applications, search, activeTag])

  return (
    <div>
      <div className="w-full bg-primary/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h1 className="text-3xl font-semibold tracking-tight text-base-content">Catalog</h1>

          <div className="mt-2 max-w-2xl text-base-content/90">
            <p>
              Browse self-hostable applications and generate a ready-to-run Docker Compose file
              through a guided form, no YAML required.
            </p>

            <p className="pt-4">Select an application below to get started.</p>
          </div>
        </div>
      </div>

      <main role="main" className="mx-auto max-w-6xl px-6 py-10">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search applications..."
          className="input w-full max-w-md"
          aria-label="Search applications"
        />

        {visibleTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={`badge cursor-pointer select-none ${activeTag === null ? 'badge-primary' : 'badge-outline'}`}
              onClick={() => setActiveTag(null)}
            >
              All
            </button>
            {visibleTags.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                className={`badge cursor-pointer select-none ${activeTag === tag ? 'badge-primary' : 'badge-outline'}`}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                {tag} ({count})
              </button>
            ))}
          </div>
        )}

        <p className="mt-6 text-sm text-base-content/60">
          {filtered.length} application{filtered.length === 1 ? '' : 's'}
        </p>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((app) => (
            <ApplicationCard key={app.slug} app={app} />
          ))}

          <RequestCard />
        </div>
      </main>
    </div>
  )
}

function ApplicationCard({ app }: { app: Application }) {
  return (
    <Link to={`/edit/${app.slug}`}>
      <div className="card h-full border border-base-300 bg-base-100 transition-colors hover:border-primary">
        <div className="card-body">
          <h2 className="card-title">{app.name}</h2>
          <p className="text-base-content/60">{app.tagline}</p>
        </div>
      </div>
    </Link>
  )
}

function RequestCard() {
  return (
    <a >
      <div className="card h-full card-border card-dash border-neutral transition-colors hover:border-neutral/80">
        <div className="card-body">
          <h2 className="card-title">Missing an application?</h2>
          <p className="text-base-content/60">
            <ExternalLink href="https://github.com/josephlewis42/compose-editor/issues/new?template=new-app-request.md" text="Request one on GitHub " />
            or <Link className="link" to="/build">build your own</Link>.
          </p>
        </div>
      </div>
    </a>
  )
}

