import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { FolderOpen, Banknote, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate, STATUT_LABELS, STATUT_COLORS, FINANCEMENT_LABELS, FINANCEMENT_COLORS } from '../lib/utils'

const DONUT_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#eab308']

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    window.api.getDashboardStats().then(res => {
      if (res.success) setStats(res.data)
    })
  }, [])

  if (!stats) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-text-muted">Chargement...</div>
    </div>
  )

  const donutData = [
    { name: 'Ouverts', value: stats.dossiersOuverts || 0 },
    { name: 'Gagnés', value: stats.dossiersGagnes || 0 },
    { name: 'Perdus', value: stats.dossiersPerdus || 0 },
    { name: 'En attente', value: stats.dossiersEnAttente || 0 }
  ].filter(d => d.value > 0)

  const barData = (stats.commissionsMois || []).map((m: any) => ({
    mois: m.mois,
    Commissions: m.montant || 0
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Tableau de bord</h1>
        {stats.livraisonsEnRetard > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-red/10 border border-accent-red/20 rounded text-accent-red text-sm">
            <AlertTriangle size={14} />
            {stats.livraisonsEnRetard} livraison{stats.livraisonsEnRetard > 1 ? 's' : ''} en retard
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-xs font-medium uppercase tracking-wide">Dossiers ouverts</span>
            <FolderOpen size={16} className="text-accent-blue" />
          </div>
          <div className="text-3xl font-bold text-text-primary">{stats.dossiersOuverts || 0}</div>
          <div className="text-text-muted text-xs mt-1">{stats.dossiersEnAttente || 0} en attente</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-xs font-medium uppercase tracking-wide">Commissions totales</span>
            <Banknote size={16} className="text-accent-green" />
          </div>
          <div className="text-3xl font-bold text-text-primary">{formatCurrency(stats.commissionsTotal)}</div>
          <div className="text-text-muted text-xs mt-1">payées : {formatCurrency(stats.commissionsPayees)}</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-xs font-medium uppercase tracking-wide">En attente paiement</span>
            <Clock size={16} className="text-accent-orange" />
          </div>
          <div className="text-3xl font-bold text-text-primary">{formatCurrency(stats.commissionsEnAttente)}</div>
          <div className="text-text-muted text-xs mt-1">à facturer : {formatCurrency(stats.commissionsAFacturer)}</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-xs font-medium uppercase tracking-wide">Taux de conversion</span>
            <TrendingUp size={16} className="text-accent-yellow" />
          </div>
          <div className="text-3xl font-bold text-text-primary">{stats.tauxConversion || 0}%</div>
          <div className="text-text-muted text-xs mt-1">{stats.dossiersGagnes || 0} gagnés / {(stats.dossiersGagnes || 0) + (stats.dossiersPerdus || 0)} clôturés</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-5 gap-4">
        {/* Donut */}
        <div className="card col-span-2">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Répartition des dossiers</h2>
          {donutData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-text-muted text-sm">Aucun dossier</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((_, index) => (
                    <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 6, color: '#e5e5e5', fontSize: 12 }}
                  formatter={(v: number, n: string) => [v, n]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#a3a3a3' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart commissions */}
        <div className="card col-span-3">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Commissions — 6 derniers mois</h2>
          {barData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-text-muted text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={28}>
                <XAxis dataKey="mois" tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #262626', borderRadius: 6, color: '#e5e5e5', fontSize: 12 }}
                  formatter={(v: number) => [formatCurrency(v), 'Commission']}
                />
                <Bar dataKey="Commissions" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent dossiers */}
      <div className="card">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Derniers dossiers</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['N° Dossier', 'Client', 'Véhicule', 'Type', 'Statut', 'Commission', 'Livraison'].map(h => (
                <th key={h} className="text-left text-xs font-medium text-text-muted pb-2 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(stats.dernierssDossiers || []).length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-text-muted py-8 text-sm">Aucun dossier pour le moment</td>
              </tr>
            ) : (stats.dernierssDossiers || []).map((d: any) => (
              <tr key={d.id} className="table-row" onClick={() => navigate(`/dossiers/${d.id}`)}>
                <td className="py-2.5 pr-4 text-sm font-mono text-accent-blue">{d.numeroDossier}</td>
                <td className="py-2.5 pr-4 text-sm text-text-primary">{d.clientPrenom} {d.clientNom}</td>
                <td className="py-2.5 pr-4 text-sm text-text-secondary">{[d.marqueNom, d.modeleNom].filter(Boolean).join(' ') || '-'}</td>
                <td className="py-2.5 pr-4">
                  <span className={`badge ${FINANCEMENT_COLORS[d.typeFinancement] || ''}`}>{FINANCEMENT_LABELS[d.typeFinancement] || d.typeFinancement}</span>
                </td>
                <td className="py-2.5 pr-4">
                  <span className={`badge ${STATUT_COLORS[d.statut] || ''}`}>{STATUT_LABELS[d.statut] || d.statut}</span>
                </td>
                <td className="py-2.5 pr-4 text-sm text-text-secondary">{d.montantCommission ? formatCurrency(d.montantCommission) : '-'}</td>
                <td className="py-2.5">
                  {d.dateLivraisonPrevue ? (
                    <span className={`flex items-center gap-1.5 text-xs ${d.statutLivraison === 'EN_RETARD' ? 'text-accent-red' : 'text-accent-green'}`}>
                      <span className={`w-2 h-2 rounded-full ${d.statutLivraison === 'EN_RETARD' ? 'bg-accent-red' : 'bg-accent-green'}`} />
                      {formatDate(d.dateLivraisonPrevue)}
                    </span>
                  ) : <span className="text-text-muted text-xs">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
