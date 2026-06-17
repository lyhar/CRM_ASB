import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banknote, BarChart2, Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts'
import { formatCurrency, formatDate, COMMISSION_LABELS, COMMISSION_COLORS, FINANCEMENT_LABELS } from '../lib/utils'
import { useTheme } from '../contexts/ThemeContext'

const TABS = [
  { key: 'A_FACTURER', label: 'À facturer' },
  { key: 'FACTUREE', label: 'Facturées' },
  { key: 'PAYEE', label: 'Payées' },
  { key: '', label: 'Toutes' }
]

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export default function Commissions() {
  const [dossiers, setDossiers] = useState<any[]>([])
  const [allDossiers, setAllDossiers] = useState<any[]>([])
  const [tab, setTab] = useState('A_FACTURER')
  const [totals, setTotals] = useState<Record<string, number>>({})
  const [view, setView] = useState<'list' | 'chart'>('list')
  const [year, setYear] = useState(new Date().getFullYear())
  const navigate = useNavigate()
  const { theme } = useTheme()

  const tooltipStyle = theme === 'dark'
    ? { backgroundColor: '#18181c', border: '1px solid #38363e', borderRadius: 6, color: '#ede9e4', fontSize: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.45)' }
    : { backgroundColor: '#faf8f6', border: '1px solid #b8b3ac', borderRadius: 6, color: '#1a1714', fontSize: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }
  const tooltipLabelStyle = { color: theme === 'dark' ? '#ede9e4' : '#1a1714', fontWeight: 600 }
  const tooltipItemStyle = { color: theme === 'dark' ? '#ede9e4' : '#1a1714' }

  const load = async () => {
    const res = await window.api.getDossiers({ statutCommission: tab || undefined })
    if (res.success) setDossiers(res.data || [])

    const allRes = await window.api.getDossiers({})
    if (allRes.success) {
      const data = allRes.data || []
      setAllDossiers(data)
      const t: Record<string, number> = {}
      for (const d of data) {
        if (d.statutCommission && d.montantCommission) {
          t[d.statutCommission] = (t[d.statutCommission] || 0) + d.montantCommission
        }
      }
      setTotals(t)
    }
  }

  useEffect(() => { load() }, [tab])

  // Données graphique mensuel par année
  const chartData = useMemo(() => {
    return MONTHS.map((mois, mi) => {
      const m = String(mi + 1).padStart(2, '0')
      const prefix = `${year}-${m}`
      const forMonth = allDossiers.filter(d => d.dateDemande?.startsWith(prefix))
      return {
        mois,
        'À facturer': forMonth.filter(d => d.statutCommission === 'A_FACTURER').reduce((s, d) => s + (d.montantCommission || 0), 0),
        'Facturées': forMonth.filter(d => d.statutCommission === 'FACTUREE').reduce((s, d) => s + (d.montantCommission || 0), 0),
        'Payées': forMonth.filter(d => d.statutCommission === 'PAYEE').reduce((s, d) => s + (d.montantCommission || 0), 0),
      }
    })
  }, [allDossiers, year])

  const years = useMemo(() => {
    const set = new Set(allDossiers.map(d => d.dateDemande?.slice(0, 4)).filter(Boolean))
    const arr = Array.from(set).map(Number).sort().reverse()
    if (!arr.includes(new Date().getFullYear())) arr.unshift(new Date().getFullYear())
    return arr
  }, [allDossiers])

  const total = dossiers.reduce((s, d) => s + (d.montantCommission || 0), 0)

  const handleExport = async () => {
    await window.api.exportExcel({ statutCommission: tab || undefined })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Commissions</h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button onClick={handleExport} className="btn btn-ghost border border-border text-xs">
            <Download size={13} /> Exporter Excel
          </button>
          <div className="flex rounded border border-border overflow-hidden">
            <button onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm transition-colors flex items-center gap-1 ${view === 'list' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-bg-hover'}`}>
              <Banknote size={13} /> Liste
            </button>
            <button onClick={() => setView('chart')}
              className={`px-3 py-1.5 text-sm transition-colors flex items-center gap-1 ${view === 'chart' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-bg-hover'}`}>
              <BarChart2 size={13} /> Rapport
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="stat-card border-t-2 border-t-color-warning">
          <div className="text-xs text-text-muted mb-1 uppercase tracking-wide">À facturer</div>
          <div className="text-2xl font-bold text-color-warning">{formatCurrency(totals['A_FACTURER'] || 0)}</div>
        </div>
        <div className="stat-card border-t-2 border-t-accent">
          <div className="text-xs text-text-muted mb-1 uppercase tracking-wide">Facturées (en attente)</div>
          <div className="text-2xl font-bold text-accent">{formatCurrency(totals['FACTUREE'] || 0)}</div>
        </div>
        <div className="stat-card border-t-2 border-t-color-success">
          <div className="text-xs text-text-muted mb-1 uppercase tracking-wide">Payées</div>
          <div className="text-2xl font-bold text-color-success">{formatCurrency(totals['PAYEE'] || 0)}</div>
        </div>
      </div>

      {view === 'chart' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Commissions par mois</h2>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="form-input text-sm py-1 w-24"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barSize={16} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mois" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v ? `${Math.round(v / 1000)}k€` : '0'} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                formatter={(v: number, n: string) => [formatCurrency(v), n]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              <Bar dataKey="À facturer" fill="#fbbf24" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Facturées" fill="#c9843a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Payées" fill="#4ade80" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {view === 'list' && (<>
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm border-b-2 transition-colors -mb-px ${tab === t.key ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card p-0 overflow-x-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm text-text-secondary">{dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}</span>
            <span className="text-sm font-semibold text-text-primary">Total : {formatCurrency(total)}</span>
          </div>
          <table className="w-full min-w-[860px]">
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
                  <td className="px-4 py-2.5 text-sm font-mono text-accent">{d.numeroDossier}</td>
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
      </>)}
    </div>
  )
}
