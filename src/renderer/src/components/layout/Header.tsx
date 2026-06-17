import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Sun, Moon, Search, FolderOpen } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface SearchResult {
  type: 'CLIENT' | 'DOSSIER'
  id: number
  nom: string
  prenom: string
  numeroDossier: string | null
  marqueNom: string | null
  statut: string | null
  telephone: string | null
  email: string | null
}

export default function Header() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [userName, setUserName] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  useEffect(() => {
    window.api.getUsers().then(res => {
      if (res.success && res.data?.length) {
        const u = res.data[0]
        setUserName(`${u.prenom} ${u.nom.charAt(0)}.`)
      }
    })
  }, [])

  const handleSearch = async (q: string) => {
    setSearch(q)
    if (q.length < 2) { setResults([]); return }
    const res = await window.api.searchGlobal(q)
    if (res.success) setResults(res.data || [])
  }

  const handleSelect = (r: SearchResult) => {
    setSearch('')
    setResults([])
    inputRef.current?.blur()
    if (r.type === 'DOSSIER') navigate(`/dossiers/${r.id}`)
    else navigate(`/clients/${r.id}`)
  }

  const showDropdown = focused && results.length > 0

  return (
    <header
      className="flex items-center justify-between px-6 border-b border-border bg-bg-secondary flex-shrink-0"
      style={{ height: 52 }}
    >
      {/* Global search */}
      <div className="relative flex-1 max-w-sm min-w-[220px]">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher client, dossier, véhicule..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            className="w-full bg-bg-card border border-border rounded pl-8 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
          />
        </div>
        {showDropdown && (
          <div className="absolute top-full mt-1 left-0 w-full bg-bg-card border border-border rounded shadow-lg z-50 overflow-hidden">
            {results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}-${i}`}
                className="w-full text-left px-3 py-2 text-sm hover:bg-bg-hover text-text-primary flex items-center gap-2 transition-colors"
                onMouseDown={() => handleSelect(r)}
              >
                {r.type === 'DOSSIER'
                  ? <FolderOpen size={12} className="text-accent-blue flex-shrink-0" />
                  : <User size={12} className="text-text-muted flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{r.prenom} {r.nom}</span>
                  {r.type === 'DOSSIER' && r.numeroDossier && (
                    <span className="text-text-muted ml-2 font-mono text-xs">{r.numeroDossier}</span>
                  )}
                  {r.marqueNom && <span className="text-text-muted ml-2 text-xs">{r.marqueNom}</span>}
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${r.type === 'DOSSIER' ? 'bg-accent-blue/10 text-accent-blue' : 'bg-bg-hover text-text-muted'}`}>
                  {r.type === 'DOSSIER' ? 'Dossier' : 'Client'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: theme toggle + user */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <div className="w-7 h-7 rounded-full bg-accent-blue/20 flex items-center justify-center">
            <User size={14} className="text-accent-blue" />
          </div>
          <span>{userName}</span>
        </div>
      </div>
    </header>
  )
}
