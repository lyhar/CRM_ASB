import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Flame, FolderOpen, ChevronUp, ChevronDown } from 'lucide-react'
import { formatDate, formatCurrency, STATUT_LABELS, STATUT_COLORS, FINANCEMENT_LABELS, FINANCEMENT_COLORS, COMMISSION_LABELS, COMMISSION_COLORS } from '../lib/utils'
import DossierForm from '../components/DossierForm'

type SortDir = 'asc' | 'desc'

export default function Dossiers() {
  const [dossiers, setDossiers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [financementFilter, setFinancementFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [sortField, setSortField] = useState('dateDemande')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const navigate = useNavigate()

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sorted = [...dossiers].sort((a, b) => {
    const va = a[sortField] ?? ''
    const vb = b[sortField] ?? ''
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

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
          <input
            type="text"
            placeholder="N° dossier, client, marque..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input py-1.5 text-sm w-full"
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
              <th className="w-8 pl-3 pr-1 py-3" />
              {([
                ['numeroDossier', 'N° Dossier'],
                ['clientNom', 'Client'],
                ['marqueNom', 'Véhicule'],
                ['typeFinancement', 'Type'],
                ['statut', 'Statut'],
                ['concessionnaire', 'Concessionnaire'],
                ['montantCommission', 'Commission'],
                ['statutCommission', 'Statut comm.'],
                ['dateLivraisonPrevue', 'Livraison'],
                ['dateDemande', 'Date'],
              ] as [string, string][]).map(([field, label]) => (
                <th key={field}
                  className="text-left text-xs font-medium text-text-muted px-3 py-3 cursor-pointer select-none hover:text-text-primary transition-colors whitespace-nowrap"
                  onClick={() => toggleSort(field)}>
                  <span className="flex items-center gap-1">
                    {label}
                    {sortField === field
                      ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
                      : <ChevronDown size={11} className="opacity-20" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-text-muted">
                  <FolderOpen size={32} className="mx-auto mb-2 opacity-30" />
                  <div className="text-sm">Aucun dossier trouvé</div>
                </td>
              </tr>
            ) : sorted.map(d => {
              const livrColor = getLivraisonColor(d)
              return (
                <tr key={d.id} className="table-row" onClick={() => navigate(`/dossiers/${d.id}`)}>
                  <td className="pl-3 pr-1 py-2.5 w-8">
                    {d.estChaud === 1 && <Flame size={14} className="text-accent-orange" title="Chaud" />}
                  </td>
                  <td className="px-3 py-2.5 text-sm font-mono text-accent-blue whitespace-nowrap">{d.numeroDossier}</td>
                  <td className="px-3 py-2.5 text-sm text-text-primary whitespace-nowrap">
                    <span
                      className="hover:text-accent-blue hover:underline cursor-pointer"
                      onClick={e => { e.stopPropagation(); navigate(`/clients/${d.clientId}`) }}
                    >
                      {d.clientPrenom} {d.clientNom}
                    </span>
                  </td>
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
