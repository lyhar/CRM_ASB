import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Star, Users } from 'lucide-react'
import { formatDate } from '../lib/utils'
import ClientForm from '../components/ClientForm'

export default function Clients() {
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    const res = await window.api.getClients({ search, type: typeFilter || undefined })
    if (res.success) setClients(res.data || [])
  }

  useEffect(() => { load() }, [search, typeFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Clients</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Nom, téléphone, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9 py-1.5 text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="form-input w-44 py-1.5 text-sm"
        >
          <option value="">Tous les types</option>
          <option value="PARTICULIER">Particulier</option>
          <option value="PROFESSIONNEL">Professionnel</option>
        </select>
        <span className="text-text-muted text-sm">{clients.length} client{clients.length > 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
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

      {showForm && <ClientForm onClose={() => { setShowForm(false); load() }} />}
    </div>
  )
}
