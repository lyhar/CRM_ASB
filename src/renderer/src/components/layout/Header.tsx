import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User } from 'lucide-react'

export default function Header() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const navigate = useNavigate()

  const handleSearch = async (q: string) => {
    setSearch(q)
    if (q.length < 2) { setResults([]); return }
    const res = await window.api.searchClients(q)
    if (res.success) setResults(res.data || [])
  }

  return (
    <header
      className="flex items-center justify-between px-6 border-b border-border bg-bg-secondary flex-shrink-0"
      style={{ height: 52, paddingTop: 0 }}
    >
      {/* Search */}
      <div className="relative w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          onBlur={() => setTimeout(() => setResults([]), 200)}
          className="w-full bg-bg-card border border-border rounded px-3 py-1.5 pl-9 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
        />
        {results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 w-full bg-bg-card border border-border rounded shadow-lg z-50">
            {results.map((c: any) => (
              <button
                key={c.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-bg-hover text-text-primary flex items-center justify-between"
                onMouseDown={() => { navigate(`/clients/${c.id}`); setSearch(''); setResults([]) }}
              >
                <span>{c.prenom} {c.nom}</span>
                <span className="text-text-muted text-xs">{c.telephone || c.email || ''}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <div className="w-7 h-7 rounded-full bg-accent-blue/20 flex items-center justify-center">
          <User size={14} className="text-accent-blue" />
        </div>
        <span>Antoine M.</span>
      </div>
    </header>
  )
}
