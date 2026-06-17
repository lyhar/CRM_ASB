import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banknote } from 'lucide-react'
import { formatCurrency, formatDate, COMMISSION_LABELS, COMMISSION_COLORS, FINANCEMENT_LABELS } from '../lib/utils'

const TABS = [
  { key: 'A_FACTURER', label: 'À facturer' },
  { key: 'FACTUREE', label: 'Facturées' },
  { key: 'PAYEE', label: 'Payées' },
  { key: '', label: 'Toutes' }
]

export default function Commissions() {
  const [dossiers, setDossiers] = useState<any[]>([])
  const [tab, setTab] = useState('A_FACTURER')
  const [totals, setTotals] = useState<Record<string, number>>({})
  const navigate = useNavigate()

  const load = async () => {
    const res = await window.api.getDossiers({ statutCommission: tab || undefined })
    if (res.success) setDossiers(res.data || [])

    // Fetch totals for all statuses
    const allRes = await window.api.getDossiers({})
    if (allRes.success) {
      const t: Record<string, number> = {}
      for (const d of allRes.data || []) {
        if (d.statutCommission && d.montantCommission) {
          t[d.statutCommission] = (t[d.statutCommission] || 0) + d.montantCommission
        }
      }
      setTotals(t)
    }
  }

  useEffect(() => { load() }, [tab])

  const total = dossiers.reduce((s, d) => s + (d.montantCommission || 0), 0)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-text-primary">Commissions</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="text-xs text-text-muted mb-1 uppercase tracking-wide">À facturer</div>
          <div className="text-2xl font-bold text-accent-orange">{formatCurrency(totals['A_FACTURER'] || 0)}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-text-muted mb-1 uppercase tracking-wide">Facturées (en attente)</div>
          <div className="text-2xl font-bold text-accent-blue">{formatCurrency(totals['FACTUREE'] || 0)}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-text-muted mb-1 uppercase tracking-wide">Payées</div>
          <div className="text-2xl font-bold text-accent-green">{formatCurrency(totals['PAYEE'] || 0)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors -mb-px ${tab === t.key ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm text-text-secondary">{dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}</span>
          <span className="text-sm font-semibold text-text-primary">Total : {formatCurrency(total)}</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['N° Dossier', 'Client', 'Véhicule', 'Type', 'Montant', 'Statut', 'Date facture', 'Date paiement', 'Relance'].map(h => (
                <th key={h} className="text-left text-xs font-medium text-text-muted px-4 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dossiers.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-text-muted">
                  <Banknote size={28} className="mx-auto mb-2 opacity-30" />
                  <div className="text-sm">Aucune commission</div>
                </td>
              </tr>
            ) : dossiers.map(d => (
              <tr key={d.id} className="table-row" onClick={() => navigate(`/dossiers/${d.id}`)}>
                <td className="px-4 py-2.5 text-sm font-mono text-accent-blue">{d.numeroDossier}</td>
                <td className="px-4 py-2.5 text-sm text-text-primary">{d.clientPrenom} {d.clientNom}</td>
                <td className="px-4 py-2.5 text-sm text-text-secondary">{[d.marqueNom, d.modeleNom].filter(Boolean).join(' ') || '-'}</td>
                <td className="px-4 py-2.5 text-sm text-text-secondary">{FINANCEMENT_LABELS[d.typeFinancement] || d.typeFinancement}</td>
                <td className="px-4 py-2.5 text-sm font-semibold text-text-primary">{d.montantCommission ? formatCurrency(d.montantCommission) : '-'}</td>
                <td className="px-4 py-2.5">
                  {d.statutCommission ? (
                    <span className={`badge ${COMMISSION_COLORS[d.statutCommission] || ''}`}>{COMMISSION_LABELS[d.statutCommission]}</span>
                  ) : '-'}
                </td>
                <td className="px-4 py-2.5 text-sm text-text-secondary">{formatDate(d.dateFacturation)}</td>
                <td className="px-4 py-2.5 text-sm text-text-secondary">{formatDate(d.datePaiement)}</td>
                <td className="px-4 py-2.5 text-sm text-text-secondary">{formatDate(d.dateRelance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
