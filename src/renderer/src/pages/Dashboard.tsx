import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { FolderOpen, Banknote, Clock, TrendingUp, AlertTriangle, Cake, Flame, Calendar, Star, Mail, Bell, Building2 } from 'lucide-react'
import { formatCurrency, formatDate, STATUT_LABELS, STATUT_COLORS, FINANCEMENT_LABELS, FINANCEMENT_COLORS } from '../lib/utils'
import EmailComposer from '../components/EmailComposer'
import { templateSuiviAnnuel, templateRelance6Mois, templateRelance3Mois } from '../lib/emailTemplates'
import { useTheme } from '../contexts/ThemeContext'

const DONUT_COLORS = ['#c9843a', '#4ade80', '#f87171', '#fbbf24']
const MOIS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [taches, setTaches] = useState<any>(null)
  const [tab, setTab] = useState<'overview' | 'today'>('overview')
  const [year, setYear] = useState<number | null>(new Date().getFullYear())
  const [emailData, setEmailData] = useState<{ to: string; subject: string; html: string } | null>(null)
  const [signature, setSignature] = useState('')
  const [imgUrl, setImgUrl] = useState('')
  const [customTpl, setCustomTpl] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const { theme } = useTheme()

  useEffect(() => {
    window.api.getDashboardStats(year ?? undefined).then(res => { if (res.success) setStats(res.data) })
  }, [year])

  useEffect(() => {
    window.api.getTachesJour().then(res => { if (res.success) setTaches(res.data) })
    window.api.getSettings().then(res => {
      if (res.success && res.data) {
        setSignature(res.data.email_signature || '')
        setImgUrl(res.data.email_signature_img || '')
        setCustomTpl(res.data)
      }
    })
  }, [])

  const openEmail = (fn: (d: any, sig: string, img: string, cs?: string, ch?: string) => { sujet: string; html: string }, dossier: any, clientEmail: string, customSujet?: string, customHtml?: string) => {
    const t = fn(dossier, signature, imgUrl, customSujet, customHtml)
    setEmailData({ to: clientEmail || '', subject: t.sujet, html: t.html })
  }

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

  const availableYears: number[] = stats.availableYears || []

  const barData = year
    ? Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2, '0')
        const found = (stats.commissionsMois || []).find((x: any) => x.mois === m)
        return { mois: MOIS_FR[i], Commissions: found?.montant || 0 }
      })
    : (stats.commissionsMois || []).map((m: any) => ({ mois: m.mois, Commissions: m.montant || 0 }))

  const todayCount = taches
    ? (taches.anniversaires?.length || 0) + (taches.dossiersChauds?.length || 0) +
      (taches.commissionsEnRetard?.length || 0) + (taches.finContratsProches?.length || 0) +
      (taches.suiviAnnuel?.length || 0) + (taches.relancesDepassees?.length || 0)
    : 0

  const tooltipStyle = theme === 'dark'
    ? { backgroundColor: '#18181c', border: '1px solid #38363e', borderRadius: 6, color: '#ede9e4', fontSize: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.45)' }
    : { backgroundColor: '#faf8f6', border: '1px solid #b8b3ac', borderRadius: 6, color: '#1a1714', fontSize: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }
  const tooltipLabelStyle = { color: theme === 'dark' ? '#ede9e4' : '#1a1714', fontWeight: 600 }
  const tooltipItemStyle = { color: theme === 'dark' ? '#ede9e4' : '#1a1714' }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Tableau de bord</h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* Sélecteur d'année */}
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-text-muted" />
            <select
              value={year ?? ''}
              onChange={e => setYear(e.target.value === '' ? null : Number(e.target.value))}
              className="form-input py-1 text-sm pr-7"
              style={{ width: 110 }}
            >
              <option value="">Tout afficher</option>
              {(availableYears.length > 0 ? availableYears : [new Date().getFullYear()]).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {stats?.livraisonsEnRetard > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-color-danger/10 border border-color-danger/20 rounded text-color-danger text-sm">
              <AlertTriangle size={14} />
              {stats.livraisonsEnRetard} livraison{stats.livraisonsEnRetard > 1 ? 's' : ''} en retard
            </div>
          )}
          <div className="flex rounded border border-border overflow-hidden">
            <button onClick={() => setTab('overview')}
              className={`px-4 py-1.5 text-sm transition-colors ${tab === 'overview' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-bg-hover'}`}>
              Vue d'ensemble
            </button>
            <button onClick={() => setTab('today')}
              className={`px-4 py-1.5 text-sm transition-colors flex items-center gap-1.5 ${tab === 'today' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-bg-hover'}`}>
              Aujourd'hui
              {todayCount > 0 && (
                <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium ${tab === 'today' ? 'bg-white/20' : 'bg-color-warning text-white'}`}>
                  {todayCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {emailData && <EmailComposer {...emailData} onClose={() => setEmailData(null)} />}

      {tab === 'today' && taches && (
        <div className="space-y-4">
          {todayCount === 0 && (
            <div className="card text-center py-12 text-text-muted">
              <div className="text-4xl mb-3">✅</div>
              <div className="font-medium text-text-primary mb-1">Rien à traiter aujourd'hui</div>
              <div className="text-sm">Pas d'anniversaire, de relance ou d'échéance prévue.</div>
            </div>
          )}

          {taches.anniversaires?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Cake size={14} className="text-color-warning" />
                <h3 className="font-medium text-text-primary text-sm">Anniversaires du jour</h3>
              </div>
              <div className="space-y-2">
                {taches.anniversaires.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded bg-bg-secondary">
                    <div>
                      <span className="text-sm text-text-primary font-medium">{c.prenom} {c.nom}</span>
                      {c.telephone && <span className="text-xs text-text-muted ml-3">{c.telephone}</span>}
                    </div>
                    <button onClick={() => navigate(`/clients/${c.id}`)} className="text-xs text-accent hover:underline">Voir fiche</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {taches.dossiersChauds?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Flame size={14} className="text-color-warning" />
                <h3 className="font-medium text-text-primary text-sm">Affaires chaudes</h3>
              </div>
              <div className="space-y-2">
                {taches.dossiersChauds.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded bg-bg-secondary">
                    <div>
                      <span className="text-sm text-text-primary font-medium">{d.clientPrenom} {d.clientNom}</span>
                      <span className="text-xs text-text-muted ml-3">{d.numeroDossier}</span>
                    </div>
                    <button onClick={() => navigate(`/dossiers/${d.id}`)} className="text-xs text-accent hover:underline">Ouvrir</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {taches.commissionsEnRetard?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-color-danger" />
                <h3 className="font-medium text-text-primary text-sm">Factures en attente de paiement (+30 jours)</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Client', 'Dossier', 'Facturé le', 'Montant', ''].map(h => (
                      <th key={h} className="text-left text-xs text-text-muted pb-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {taches.commissionsEnRetard.map((d: any) => (
                    <tr key={d.id} className="table-row">
                      <td className="py-2 pr-4 text-sm text-text-primary">{d.clientPrenom} {d.clientNom}</td>
                      <td className="py-2 pr-4 text-sm font-mono text-accent">{d.numeroDossier}</td>
                      <td className="py-2 pr-4 text-sm text-color-danger">{formatDate(d.dateFacturation)}</td>
                      <td className="py-2 pr-4 text-sm text-text-primary">{d.montantCommission ? formatCurrency(d.montantCommission) : '-'}</td>
                      <td className="py-2"><button onClick={() => navigate(`/dossiers/${d.id}`)} className="text-xs text-accent hover:underline">Ouvrir</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {taches.finContratsProches?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-accent" />
                <h3 className="font-medium text-text-primary text-sm">Fins de contrat dans les 12 mois</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Client', 'Véhicule', 'Fin contrat', 'Jours restants', 'Email relance', ''].map(h => (
                      <th key={h} className="text-left text-xs text-text-muted pb-2 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {taches.finContratsProches.map((d: any) => {
                    const j = d.joursRestants
                    const urgence = j <= 90 ? 'text-color-danger' : j <= 180 ? 'text-color-warning' : 'text-text-primary'
                    const tmpl = j <= 90 ? templateRelance3Mois : j <= 180 ? templateRelance6Mois : null
                    const tplKeys = j <= 90 ? ['tpl_3mois_sujet', 'tpl_3mois_html'] : ['tpl_6mois_sujet', 'tpl_6mois_html']
                    return (
                      <tr key={d.id} className="table-row">
                        <td className="py-2 pr-3 text-sm text-text-primary">{d.clientPrenom} {d.clientNom}</td>
                        <td className="py-2 pr-3 text-sm text-text-secondary">{[d.marqueNom, d.modeleNom].filter(Boolean).join(' ') || '-'}</td>
                        <td className="py-2 pr-3 text-sm">{formatDate(d.dateFinContrat)}</td>
                        <td className={`py-2 pr-3 text-sm font-medium ${urgence}`}>{j}j</td>
                        <td className="py-2 pr-3">
                          {tmpl && d.clientEmail && (
                            <button onClick={() => openEmail(tmpl, d, d.clientEmail, customTpl[tplKeys[0]], customTpl[tplKeys[1]])}
                              className="flex items-center gap-1 text-xs text-accent hover:underline">
                              <Mail size={11} /> Email
                            </button>
                          )}
                        </td>
                        <td className="py-2"><button onClick={() => navigate(`/dossiers/${d.id}`)} className="text-xs text-accent hover:underline">Ouvrir</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {taches.relancesDepassees?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={14} className="text-color-danger" />
                <h3 className="font-medium text-text-primary text-sm">Relances en retard</h3>
                <span className="text-xs bg-color-danger/10 text-color-danger px-1.5 py-0.5 rounded">{taches.relancesDepassees.length}</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Client', 'Dossier', 'Date prévue', 'Retard', 'Notes', ''].map(h => (
                      <th key={h} className="text-left text-xs text-text-muted pb-2 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {taches.relancesDepassees.map((r: any) => {
                    const jours = Math.floor((Date.now() - new Date(r.dateRelance).getTime()) / 86400000)
                    return (
                      <tr key={r.id} className="table-row">
                        <td className="py-2 pr-3 text-sm text-text-primary">{r.clientPrenom} {r.clientNom}</td>
                        <td className="py-2 pr-3 text-sm font-mono text-accent">{r.numeroDossier}</td>
                        <td className="py-2 pr-3 text-sm text-color-danger">{formatDate(r.dateRelance)}</td>
                        <td className="py-2 pr-3 text-sm font-medium text-color-danger">+{jours}j</td>
                        <td className="py-2 pr-3 text-xs text-text-muted">{r.notes || '—'}</td>
                        <td className="py-2"><button onClick={() => navigate(`/dossiers/${r.dossierId}`)} className="text-xs text-accent hover:underline">Ouvrir</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {taches.suiviAnnuel?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Star size={14} className="text-color-success" />
                <h3 className="font-medium text-text-primary text-sm">Suivi 1 an — livraison il y a environ 1 an</h3>
              </div>
              <div className="space-y-2">
                {taches.suiviAnnuel.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded bg-bg-secondary">
                    <div>
                      <span className="text-sm text-text-primary font-medium">{d.clientPrenom} {d.clientNom}</span>
                      <span className="text-xs text-text-muted ml-3">{[d.marqueNom, d.modeleNom].filter(Boolean).join(' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.clientEmail && (
                        <button onClick={() => openEmail(templateSuiviAnnuel, d, d.clientEmail, customTpl.tpl_suivi_sujet, customTpl.tpl_suivi_html)}
                          className="flex items-center gap-1 text-xs text-accent hover:underline">
                          <Mail size={11} /> Email suivi
                        </button>
                      )}
                      <button onClick={() => navigate(`/dossiers/${d.id}`)} className="text-xs text-text-muted hover:underline">Ouvrir</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'overview' && !stats && (
        <div className="flex items-center justify-center h-full">
          <div className="text-text-muted">Chargement...</div>
        </div>
      )}

      {tab === 'overview' && stats && (<>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card border-t-2 border-t-accent">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-xs font-medium uppercase tracking-wide">Dossiers ouverts</span>
            <FolderOpen size={16} className="text-accent" />
          </div>
          <div className="text-3xl font-bold text-text-primary">{stats.dossiersOuverts || 0}</div>
          <div className="text-text-muted text-xs mt-1">{stats.dossiersEnAttente || 0} en attente</div>
        </div>

        <div className="stat-card border-t-2 border-t-color-success">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-xs font-medium uppercase tracking-wide">Commissions totales</span>
            <Banknote size={16} className="text-color-success" />
          </div>
          <div className="text-3xl font-bold text-text-primary">{formatCurrency(stats.commissionsTotal)}</div>
          <div className="text-text-muted text-xs mt-1">payées : {formatCurrency(stats.commissionsPayees)}</div>
        </div>

        <div className="stat-card border-t-2 border-t-color-warning">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-xs font-medium uppercase tracking-wide">En attente paiement</span>
            <Clock size={16} className="text-color-warning" />
          </div>
          <div className="text-3xl font-bold text-text-primary">{formatCurrency(stats.commissionsEnAttente)}</div>
          <div className="text-text-muted text-xs mt-1">à facturer : {formatCurrency(stats.commissionsAFacturer)}</div>
        </div>

        <div className="stat-card border-t-2 border-t-color-warning">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-xs font-medium uppercase tracking-wide">Taux de conversion</span>
            <TrendingUp size={16} className="text-color-warning" />
          </div>
          <div className="text-3xl font-bold text-text-primary">{stats.tauxConversion || 0}%</div>
          <div className="text-text-muted text-xs mt-1">{stats.dossiersGagnes || 0} gagnés / {(stats.dossiersGagnes || 0) + (stats.dossiersPerdus || 0)} clôturés</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
        {/* Donut */}
        <div className="card xl:col-span-2">
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
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(v: number, n: string) => [v, n]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#a3a3a3' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart commissions */}
        <div className="card xl:col-span-3">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{year ? `Commissions ${year}` : 'Commissions — 6 derniers mois'}</h2>
          {barData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-text-muted text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={28}>
                <XAxis dataKey="mois" tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(v: number) => [formatCurrency(v), 'Commission']}
                />
                <Bar dataKey="Commissions" fill="#c9843a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top concessions */}
      {(stats.topConcessions || []).length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-text-primary mb-3">{year ? `Top concessions ${year}` : 'Top concessions — tous temps'}</h2>
          <div className="space-y-2">
            {(stats.topConcessions || []).map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-text-muted w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm text-text-primary truncate flex items-center gap-1.5">
                      <Building2 size={11} className="text-accent flex-shrink-0" />
                      {c.entreprise}
                    </span>
                    <span className="text-xs text-text-muted ml-2 flex-shrink-0">{c.nb} dossier{c.nb > 1 ? 's' : ''} · {formatCurrency(c.total)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.round((c.nb / (stats.topConcessions[0]?.nb || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent dossiers */}
      <div className="card overflow-x-auto">
        <h2 className="text-sm font-semibold text-text-primary mb-4">{year ? `Derniers dossiers ${year}` : 'Derniers dossiers'}</h2>
        <table className="w-full min-w-[760px]">
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
                <td className="py-2.5 pr-4 text-sm font-mono text-accent">{d.numeroDossier}</td>
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
                    <span className={`flex items-center gap-1.5 text-xs ${d.statutLivraison === 'EN_RETARD' ? 'text-color-danger' : 'text-color-success'}`}>
                      <span className={`w-2 h-2 rounded-full ${d.statutLivraison === 'EN_RETARD' ? 'bg-color-danger' : 'bg-color-success'}`} />
                      {formatDate(d.dateLivraisonPrevue)}
                    </span>
                  ) : <span className="text-text-muted text-xs">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>)}
    </div>
  )
}
