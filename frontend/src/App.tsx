import { useEffect, useState } from 'react'
import { Route, Routes, useParams } from 'react-router-dom'
import { NavBar } from '@/components/NavBar'
import { EditorPage } from '@/pages/EditorPage'
import { CatalogPage } from '@/pages/CatalogPage'
import { loadCatalog } from '@/lib/catalog'
import { type Catalog } from '@/gen/composeeditor/v1/spec_pb'

function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCatalog()
      .then(setCatalog)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
  }, [])

  return (
    <div className="flex h-screen min-h-0 flex-col">
      <NavBar />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {error ? (
          <p className="p-6 text-error">Couldn't load the application catalog: {error}</p>
        ) : !catalog ? (
          <p className="p-6 text-base-content/60">Loading the application catalog...</p>
        ) : (
          <Routes>
            <Route path="/" element={<CatalogPage catalog={catalog} />} />
            <Route path="/edit/:slug" element={<EditorRoute catalog={catalog} />} />
          </Routes>
        )}
      </div>
    </div>
  )
}

function EditorRoute({ catalog }: { catalog: Catalog }) {
  const { slug } = useParams<{ slug: string }>()
  const app = catalog.applications.find((a) => a.slug === slug)

  if (!app) {
    return <p>Unknown application "{slug}".</p>
  }

  return <EditorPage app={app} />
}

export default App
