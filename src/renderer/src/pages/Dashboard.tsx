import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { FolderOpen, Banknote, Clock, TrendingUp, AlertTriangle, Cake, Flame, Calendar, Star, Mail, Bell } from 'lucide-react'
import { formatCurrency, formatDate, STATUT_LABELS, STATUT_COLORS, FINANCEMENT_LABELS, FINANCEMENT_COLORS } from '../lib/utils'
import EmailComposer from '../components/EmailComposer'
import { templateSuiviAnnuel, templateRelance6Mois, templateRelance3Mois } from '../lib/emailTemplates'
import { useTheme } from '../contexts/ThemeContext'

const DONUT_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#eab308']

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [taches, setTaches] = useState<any>(null)
  const [tab, setTab] = useState<'overview' | 'today'>('overview')
  const [emailData, setEmailData] = useState<{ to: string; subject: string; html: string } | null>(null)
  const [signature, setSignature] = useState('')
  const [imgUrl, setImgUrl] = useState('')
  const [customTpl, setCustomTpl] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const { theme } = useTheme()

  useEffect(() => {
    window.api.getDashboardStats().then(res => { if (res.success) setStats(res.data) })
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

  const barData = (stats.commissionsMois || []).map((m: any) => ({
    mois: m.mois,
    Commissions: m.montant || 0
  }))

  const todayCount = taches
    ? (taches.anniversaires?.length || 0) + (taches.dossiersChauds?.length || 0) +
      (taches.commissionsEnRetard?.length || 0) + (taches.finContratsProches?.length || 0) +
      (taches.suiviAnnuel?.length || 0) + (taches.relancesDepassees?.length || 0)
    : 0

  const tooltipStyle = theme === 'dark'
    ? { background: '#1a1a1a', border: '1px solid #262626', borderRadius: 6, color: '#e5e5e5', fontSize: 12 }
    : { background: '#ffffff', border: '1px solid #d4d4d4', borderRadius: 6, color: '#171717', fontSize: 12 }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Tableau de bord</h1>
        <div className="flex items-center gap-3">
          {stats?.livraisonsEnRetard > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-red/10 border border-accent-red/20 rounded text-accent-red text-sm">
              <AlertTriangle size={14} />
              {stats.livraisonsEnRetard} livraison{stats.livraisonsEnRetard > 1 ? 's' : ''} en retard
            </div>
          )}
          <div className="flex rounded border border-border overflow-hidden">
            <button onClick={() => setTab('overview')}
              className={`px-4 py-1.5 text-sm transition-colors ${tab === 'overview' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:bg-bg-hover'}`}>
              Vue d'ensemble
            </button>
            <button onClick={() => setTab('today')}
              className={`px-4 py-1.5 text-sm transition-colors flex items-center gap-1.5 ${tab === 'today' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:bg-bg-hover'}`}>
              Aujourd'hui
              {todayCount > 0 && (
                <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium ${tab === 'today' ? 'bg-white/20' : 'bg-accent-orange text-white'}`}>
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
                <Cake size={14} className="text-accent-yellow" />
                <h3 className="font-medium text-text-primary text-sm">Anniversaires du jour</h3>
              </div>
              <div className="space-y-2">
                {taches.anniversaires.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded bg-bg-secondary">
                    <div>
                      <span className="text-sm text-text-primary font-medium">{c.prenom} {c.nom}</span>
                      {c.telephone && <span className="text-xs text-text-muted ml-3">{c.telephone}</span>}
                    </div>
                    <button onClick={() => navigate(`/clients/${c.id}`)} className="text-xs text-accent-blue hover:underline">Voir fiche</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {taches.dossiersChauds?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Flame size={14} className="text-accent-orange" />
                <h3 className="font-medium text-text-primary text-sm">Affaires chaudes</h3>
              </div>
              <div className="space-y-2">
                {taches.dossiersChauds.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded bg-bg-secondary">
                    <div>
                      <span className="text-sm text-text-primary font-medium">{d.clientPrenom} {d.clientNom}</span>
                      <span className="text-xs text-text-muted ml-3">{d.numeroDossier}</span>
                    </div>
                    <button onClick={() => navigate(`/dossiers/${d.id}`)} className="text-xs text-accent-blue hover:underline">Ouvrir</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {taches.commissionsEnRetard?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-accent-red" />
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
                      <td className="py-2 pr-4 text-sm font-mono text-accent-blue">{d.numeroDossier}</td>
                      <td className="py-2 pr-4 text-sm text-accent-red">{formatDate(d.dateFacturation)}</td>
                      <td className="py-2 pr-4 text-sm text-text-primary">{d.montantCommission ? formatCurrency(d.montantCommission) : '-'}</td>
                      <td className="py-2"><button onClick={() => navigate(`/dossiers/${d.id}`)} className="text-xs text-accent-blue hover:underline">Ouvrir</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {taches.finContratsProches?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-accent-blue" />
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
                    const urgence = j <= 90 ? 'text-accent-red' : j <= 180 ? 'text-accent-orange' : 'text-text-primary'
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
                              className="flex items-center gap-1 text-xs text-accent-blue hover:underline">
                              <Mail size={11} /> Email
                            </button>
                          )}
                        </td>
                        <td className="py-2"><button onClick={() => navigate(`/dossiers/${d.id}`)} className="text-xs text-accent-blue hover:underline">Ouvrir</button></td>
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
                <Bell size={14} className="text-accent-red" />
                <h3 className="font-medium text-text-primary text-sm">Relances en retard</h3>
                <span className="text-xs bg-accent-red/10 text-accent-red px-1.5 py-0.5 rounded">{taches.relancesDepassees.length}</span>
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
                        <td className="py-2 pr-3 text-sm font-mono text-accent-blue">{r.numeroDossier}</td>
                        <td className="py-2 pr-3 text-sm text-accent-red">{formatDate(r.dateRelance)}</td>
                        <td className="py-2 pr-3 text-sm font-medium text-accent-red">+{jours}j</td>
                        <td className="py-2 pr-3 text-xs text-text-muted">{r.notes || '—'}</td>
                        <td className="py-2"><button onClick={() => navigate(`/dossiers/${r.dossierId}`)} className="text-xs text-accent-blue hover:underline">Ouvrir</button></td>
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
                <Star size={14} className="text-accent-green" />
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
                          className="flex items-center gap-1 text-xs text-accent-blue hover:underline">
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
                  contentStyle={tooltipStyle}
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
                  contentStyle={tooltipStyle}
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
      </>)}
    </div>
  )
}
