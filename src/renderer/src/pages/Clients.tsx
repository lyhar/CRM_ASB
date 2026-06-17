import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Star, Users, Building2 } from 'lucide-react'
import { formatDate } from '../lib/utils'
import ClientForm from '../components/ClientForm'

type Tab = 'all' | 'particulier' | 'pro'

export default function Clients() {
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    const type = tab === 'particulier' ? 'PARTICULIER' : tab === 'pro' ? 'PROFESSIONNEL' : undefined
    const res = await window.api.getClients({ search, type })
    if (res.success) setClients(res.data || [])
  }

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Clients</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      {/* Tabs + search */}
      <div className="flex items-center gap-3">
        <div className="flex rounded border border-border overflow-hidden">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-sm transition-colors ${tab === t.id ? 'bg-accent-blue text-white' : 'text-text-secondary hover:bg-bg-hover'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Nom, téléphone, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input py-1.5 text-sm w-60"
        />
        <span className="text-text-muted text-sm">{clients.length} client{clients.length > 1 ? 's' : ''}</span>
      </div>

      {/* Vue Pro groupée par entreprise */}
      {tab === 'pro' ? (
        <div className="space-y-4">
          {Object.keys(prosByEntreprise).sort().map(entreprise => (
            <div key={entreprise} className="card p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-bg-secondary border-b border-border">
                <Building2 size={13} className="text-accent-blue" />
                <span className="text-sm font-medium text-text-primary">{entreprise}</span>
                <span className="text-xs text-text-muted ml-1">{prosByEntreprise[entreprise].length} contact{prosByEntreprise[entreprise].length > 1 ? 's' : ''}</span>
              </div>
              <table className="w-full">
                <tbody>
                  {prosByEntreprise[entreprise].map(c => (
                    <tr key={c.id} className="table-row border-b border-border last:border-0" onClick={() => navigate(`/clients/${c.id}`)}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {c.estPremierAppelant === 1 && <Star size={11} className="text-accent-yellow fill-accent-yellow flex-shrink-0" />}
                          <span className="text-sm font-medium text-text-primary">{c.prenom} {c.nom}</span>
                          {c.avisGoogle === 1 && <span className="text-xs text-accent-green">★</span>}
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
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Client', 'Type', 'Contact', 'Ville', 'Référent', 'Contacts amenés', 'Dossiers', 'Créé le'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-text-muted px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-text-muted">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    <div className="text-sm">Aucun client trouvé</div>
                  </td>
                </tr>
              ) : clients.map(c => (
                <tr key={c.id} className="table-row" onClick={() => navigate(`/clients/${c.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c.estPremierAppelant === 1 && (
                        <Star size={12} className="text-accent-yellow fill-accent-yellow flex-shrink-0" title="Premier appelant" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-text-primary">{c.prenom} {c.nom}</div>
                        {c.entreprise && <div className="text-xs text-text-muted">{c.entreprise}</div>}
                        {c.avisGoogle === 1 && <div className="text-xs text-accent-green">★ Avis Google</div>}
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
                      <span className="badge bg-accent-blue/20 text-accent-blue">{c.nombreContactsAmenes}</span>
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
