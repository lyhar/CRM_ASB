import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Flame, FolderOpen } from 'lucide-react'
import { formatDate, formatCurrency, STATUT_LABELS, STATUT_COLORS, FINANCEMENT_LABELS, FINANCEMENT_COLORS, COMMISSION_LABELS, COMMISSION_COLORS } from '../lib/utils'
import DossierForm from '../components/DossierForm'

export default function Dossiers() {
  const [dossiers, setDossiers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [financementFilter, setFinancementFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    const res = await window.api.getDossiers({
      search: search || undefined,
      statut: statutFilter || undefined,
      typeFinancement: financementFilter || undefined
    })
    if (res.success) setDossiers(res.data || [])
  }

  useEffect(() => { load() }, [search, statutFilter, financementFilter])

  const getLivraisonColor = (d: any) => {
    if (!d.dateLivraisonPrevue) return null
    if (d.statutLivraison === 'LIVREE') return 'bg-zinc-500'
    if (d.statutLivraison === 'EN_RETARD') return 'bg-accent-red'
    return 'bg-accent-green'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Dossiers</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Nouveau dossier
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="N° dossier, client, marque..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9 py-1.5 text-sm w-full"
          />
        </div>
        <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)} className="form-input w-40 py-1.5 text-sm">
          <option value="">Tous les statuts</option>
          <option value="OUVERT">Ouvert</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="GAGNE">Gagné</option>
          <option value="PERDU">Perdu</option>
        </select>
        <select value={financementFilter} onChange={e => setFinancementFilter(e.target.value)} className="form-input w-36 py-1.5 text-sm">
          <option value="">Tous types</option>
          <option value="LLD">LLD</option>
          <option value="LOA">LOA</option>
          <option value="CASH">Cash</option>
        </select>
        <span className="text-text-muted text-sm">{dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['', 'N° Dossier', 'Client', 'Véhicule', 'Type', 'Statut', 'Concessionnaire', 'Commission', 'Statut comm.', 'Livraison', 'Date'].map(h => (
                <th key={h} className="text-left text-xs font-medium text-text-muted px-3 py-3 first:px-3 first:w-6">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dossiers.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-text-muted">
                  <FolderOpen size={32} className="mx-auto mb-2 opacity-30" />
                  <div className="text-sm">Aucun dossier trouvé</div>
                </td>
              </tr>
            ) : dossiers.map(d => {
              const livrColor = getLivraisonColor(d)
              return (
                <tr key={d.id} className="table-row" onClick={() => navigate(`/dossiers/${d.id}`)}>
                  <td className="px-3 py-2.5 w-6">
                    {d.estChaud === 1 && <Flame size={14} className="text-accent-orange" title="Chaud" />}
                  </td>
                  <td className="px-3 py-2.5 text-sm font-mono text-accent-blue whitespace-nowrap">{d.numeroDossier}</td>
                  <td className="px-3 py-2.5 text-sm text-text-primary whitespace-nowrap">{d.clientPrenom} {d.clientNom}</td>
                  <td className="px-3 py-2.5 text-sm text-text-secondary whitespace-nowrap">
                    {[d.marqueNom, d.modeleNom].filter(Boolean).join(' ') || '-'}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`badge ${FINANCEMENT_COLORS[d.typeFinancement] || ''}`}>{FINANCEMENT_LABELS[d.typeFinancement] || '-'}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`badge ${STATUT_COLORS[d.statut] || ''}`}>{STATUT_LABELS[d.statut] || d.statut}</span>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-text-secondary">{d.concessionnaire || '-'}</td>
                  <td className="px-3 py-2.5 text-sm text-text-secondary whitespace-nowrap">{d.montantCommission ? formatCurrency(d.montantCommission) : '-'}</td>
                  <td className="px-3 py-2.5">
                    {d.statutCommission ? (
                      <span className={`badge ${COMMISSION_COLORS[d.statutCommission] || ''}`}>{COMMISSION_LABELS[d.statutCommission]}</span>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2.5">
                    {livrColor ? (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${livrColor}`} />
                        <span className="text-xs text-text-muted">{formatDate(d.dateLivraisonPrevue)}</span>
                      </div>
                    ) : <span className="text-text-muted text-xs">-</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-text-muted">{formatDate(d.dateDemande)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showForm && <DossierForm onClose={() => { setShowForm(false); load() }} />}
    </div>
  )
}
