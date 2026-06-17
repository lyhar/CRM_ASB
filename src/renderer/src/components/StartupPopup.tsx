import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Cake, Flame, Clock, Calendar, Star, ChevronRight } from 'lucide-react'
import { formatDate } from '../lib/utils'

export default function StartupPopup() {
  const [visible, setVisible] = useState(false)
  const [taches, setTaches] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const today = new Date().toDateString()
    const lastShown = localStorage.getItem('popup_last_shown')
    if (lastShown === today) return

    window.api.getTachesJour().then(res => {
      if (!res.success) return
      const d = res.data
      const hasContent = d.anniversaires.length || d.dossiersChauds.length ||
        d.commissionsEnRetard.length || d.finContratsProches.length ||
        d.suiviAnnuel.length
      if (hasContent) {
        setTaches(d)
        setVisible(true)
        localStorage.setItem('popup_last_shown', today)
      }
    })
  }, [])

  if (!visible || !taches) return null

  const total = (taches.anniversaires?.length || 0) +
    (taches.dossiersChauds?.length || 0) +
    (taches.commissionsEnRetard?.length || 0) +
    (taches.finContratsProches?.length || 0) +
    (taches.suiviAnnuel?.length || 0)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-end z-50 p-4">
      <div className="bg-bg-card border border-border rounded-lg w-full max-w-sm shadow-xl" style={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <div className="font-semibold text-text-primary">Aujourd'hui</div>
            <div className="text-xs text-text-muted">{total} point{total > 1 ? 's' : ''} à traiter</div>
          </div>
          <button onClick={() => setVisible(false)} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">

          {/* Anniversaires */}
          {taches.anniversaires?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-color-warning mb-2 uppercase tracking-wide">
                <Cake size={12} /> Anniversaires du jour
              </div>
              <div className="space-y-1">
                {taches.anniversaires.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded bg-bg-secondary">
                    <span className="text-sm text-text-primary">{c.prenom} {c.nom}</span>
                    <button onClick={() => { navigate(`/clients/${c.id}`); setVisible(false) }}
                      className="text-xs text-accent hover:underline flex items-center gap-0.5">
                      Voir <ChevronRight size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dossiers chauds */}
          {taches.dossiersChauds?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-color-warning mb-2 uppercase tracking-wide">
                <Flame size={12} /> Affaires chaudes
              </div>
              <div className="space-y-1">
                {taches.dossiersChauds.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded bg-bg-secondary">
                    <div>
                      <div className="text-sm text-text-primary">{d.clientPrenom} {d.clientNom}</div>
                      <div className="text-xs text-text-muted">{d.numeroDossier}</div>
                    </div>
                    <button onClick={() => { navigate(`/dossiers/${d.id}`); setVisible(false) }}
                      className="text-xs text-accent hover:underline flex items-center gap-0.5">
                      Ouvrir <ChevronRight size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commissions en retard */}
          {taches.commissionsEnRetard?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-color-danger mb-2 uppercase tracking-wide">
                <Clock size={12} /> Factures en attente (+30j)
              </div>
              <div className="space-y-1">
                {taches.commissionsEnRetard.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded bg-bg-secondary">
                    <div>
                      <div className="text-sm text-text-primary">{d.clientPrenom} {d.clientNom}</div>
                      <div className="text-xs text-text-muted">Facturé le {formatDate(d.dateFacturation)}</div>
                    </div>
                    <button onClick={() => { navigate(`/dossiers/${d.id}`); setVisible(false) }}
                      className="text-xs text-accent hover:underline flex items-center gap-0.5">
                      Ouvrir <ChevronRight size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fins de contrat proches */}
          {taches.finContratsProches?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-accent mb-2 uppercase tracking-wide">
                <Calendar size={12} /> Fins de contrat (12 mois)
              </div>
              <div className="space-y-1">
                {taches.finContratsProches.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded bg-bg-secondary">
                    <div>
                      <div className="text-sm text-text-primary">{d.clientPrenom} {d.clientNom}</div>
                      <div className="text-xs text-text-muted">
                        {d.joursRestants}j — fin le {formatDate(d.dateFinContrat)}
                      </div>
                    </div>
                    <button onClick={() => { navigate(`/dossiers/${d.id}`); setVisible(false) }}
                      className="text-xs text-accent hover:underline flex items-center gap-0.5">
                      Ouvrir <ChevronRight size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suivi 1 an */}
          {taches.suiviAnnuel?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-color-success mb-2 uppercase tracking-wide">
                <Star size={12} /> Suivi 1 an (livraison il y a ~1 an)
              </div>
              <div className="space-y-1">
                {taches.suiviAnnuel.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded bg-bg-secondary">
                    <div>
                      <div className="text-sm text-text-primary">{d.clientPrenom} {d.clientNom}</div>
                      <div className="text-xs text-text-muted">{[d.marqueNom, d.modeleNom].filter(Boolean).join(' ')}</div>
                    </div>
                    <button onClick={() => { navigate(`/dossiers/${d.id}`); setVisible(false) }}
                      className="text-xs text-accent hover:underline flex items-center gap-0.5">
                      Ouvrir <ChevronRight size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border flex-shrink-0">
          <button
            onClick={() => { navigate('/dashboard'); setVisible(false) }}
            className="w-full btn btn-ghost text-sm"
          >
            Voir toutes les tâches dans le Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
