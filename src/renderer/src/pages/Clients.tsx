import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Star, Users, Building2, ChevronUp, ChevronDown } from 'lucide-react'
import { formatDate } from '../lib/utils'
import ClientForm from '../components/ClientForm'

type Tab = 'all' | 'particulier' | 'pro'
type SortDir = 'asc' | 'desc'

export default function Clients() {
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [sortField, setSortField] = useState('nom')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    const type = tab === 'particulier' ? 'PARTICULIER' : tab === 'pro' ? 'PROFESSIONNEL' : undefined
    const res = await window.api.getClients({ search, type })
    if (res.success) setClients(res.data || [])
  }

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sorted = [...clients].sort((a, b) => {
    const va = a[sortField] ?? ''
    const vb = b[sortField] ?? ''
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  useEffect(() => { load() }, [search, tab])

  // Grouper les pros par entreprise
  const prosByEntreprise: Record<string, any[]> = {}
  if (tab === 'pro') {
    for (const c of clients) {
      const key = c.entreprise || '(sans entreprise)'
      if (!prosByEntreprise[key]) prosByEntreprise[key] = []
      prosByEntreprise[key].push(c)
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'all', label: `Tous (${tab === 'all' ? clients.length : '…'})` },
    { id: 'particulier', label: 'Particuliers' },
    { id: 'pro', label: 'Professionnels' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Clients</h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <input
            type="text"
            placeholder="Nom, téléphone, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input py-1.5 text-sm"
            style={{ width: 'min(220px, 100%)' }}
          />
          <span className="text-text-muted text-sm whitespace-nowrap">{clients.length} client{clients.length > 1 ? 's' : ''}</span>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Nouveau client
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors -mb-px ${tab === t.id ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Vue Pro groupée par entreprise */}
      {tab === 'pro' ? (
        <div className="space-y-4">
          {Object.keys(prosByEntreprise).sort().map(entreprise => (
            <div key={entreprise} className="card p-0 overflow-x-auto">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-bg-secondary border-b border-border">
                <Building2 size={13} className="text-accent" />
                <span className="text-sm font-medium text-text-primary">{entreprise}</span>
                <span className="text-xs text-text-muted ml-1">{prosByEntreprise[entreprise].length} contact{prosByEntreprise[entreprise].length > 1 ? 's' : ''}</span>
              </div>
              <table className="w-full min-w-max">
                <tbody>
                  {prosByEntreprise[entreprise].map(c => (
                    <tr key={c.id} className="table-row border-b border-border last:border-0" onClick={() => navigate(`/clients/${c.id}`)}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {c.estPremierAppelant === 1 && <Star size={11} className="text-color-warning fill-color-warning flex-shrink-0" />}
                          <span className="text-sm font-medium text-text-primary">{c.prenom} {c.nom}</span>
                          {c.avisGoogle === 1 && <span className="text-xs text-color-success">★</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-text-secondary">
                        <div>{c.telephone || '-'}</div>
                        <div className="text-xs text-text-muted">{c.email || ''}</div>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-text-secondary">{c.ville || '-'}</td>
                      <td className="px-4 py-2.5 text-sm text-center text-text-secondary">{c.nbDossiers || 0} doss.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {clients.length === 0 && (
            <div className="card text-center py-12 text-text-muted">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <div className="text-sm">Aucun client professionnel</div>
            </div>
          )}
        </div>
      ) : (
        /* Vue liste standard */
        <div className="card p-0 overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-border">
                {([
                  ['nom', 'Client'],
                  ['type', 'Type'],
                  [null, 'Contact'],
                  ['ville', 'Ville'],
                  [null, 'Référent'],
                  ['nombreContactsAmenes', 'Contacts amenés'],
                  ['nbDossiers', 'Dossiers'],
                  ['createdAt', 'Créé le'],
                ] as [string | null, string][]).map(([field, label]) => (
                  <th key={label}
                    className={`text-left text-xs font-medium text-text-muted px-4 py-3 whitespace-nowrap ${field ? 'cursor-pointer select-none hover:text-text-primary transition-colors' : ''}`}
                    onClick={field ? () => toggleSort(field) : undefined}>
                    <span className="flex items-center gap-1">
                      {label}
                      {field && (sortField === field
                        ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
                        : <ChevronDown size={11} className="opacity-20" />)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-text-muted">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    <div className="text-sm">Aucun client trouvé</div>
                  </td>
                </tr>
              ) : sorted.map(c => (
                <tr key={c.id} className="table-row" onClick={() => navigate(`/clients/${c.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c.estPremierAppelant === 1 && (
                        <Star size={12} className="text-color-warning fill-color-warning flex-shrink-0" title="Premier appelant" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-text-primary">{c.prenom} {c.nom}</div>
                        {c.entreprise && <div className="text-xs text-text-muted">{c.entreprise}</div>}
                        {c.avisGoogle === 1 && <div className="text-xs text-color-success">★ Avis Google</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${c.type === 'PROFESSIONNEL' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                      {c.type === 'PROFESSIONNEL' ? 'Pro' : 'Part.'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    <div>{c.telephone || '-'}</div>
                    <div className="text-xs text-text-muted">{c.email || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{c.ville || '-'}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {c.referentNom ? `${c.referentPrenom} ${c.referentNom}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {c.nombreContactsAmenes > 0 ? (
                      <span className="badge bg-accent/20 text-accent">{c.nombreContactsAmenes}</span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-text-secondary">{c.nbDossiers || 0}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <ClientForm onClose={() => { setShowForm(false); load() }} />}
    </div>
  )
}
