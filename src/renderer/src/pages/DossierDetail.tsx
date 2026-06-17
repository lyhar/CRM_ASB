import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Flame, FileText, Upload, Plus, Check, Mail, Printer } from 'lucide-react'
import {
  formatDate, formatCurrency, formatNumber,
  STATUT_LABELS, STATUT_COLORS, FINANCEMENT_LABELS,
  COMMISSION_LABELS, COMMISSION_COLORS, ENERGIE_LABELS, DOCUMENT_LABELS
} from '../lib/utils'
import DossierForm from '../components/DossierForm'
import EmailComposer from '../components/EmailComposer'
import { templateSuiviAnnuel, templateRelance6Mois, templateRelance3Mois } from '../lib/emailTemplates'

export default function DossierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dossier, setDossier] = useState<any>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [emailData, setEmailData] = useState<{ to: string; subject: string; html: string } | null>(null)
  const [customTpl, setCustomTpl] = useState<Record<string, string>>({})
  const [docModal, setDocModal] = useState<{ path: string; name: string } | null>(null)
  const [docType, setDocType] = useState('AUTRE')

  useEffect(() => {
    window.api.getSettings().then(res => {
      if (res.success && res.data) setCustomTpl(res.data)
    })
  }, [])

  const load = async () => {
    const res = await window.api.getDossier(Number(id))
    if (res.success) setDossier(res.data)
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async () => {
    const res = await window.api.confirm('Supprimer ce dossier ?')
    if (!res.data) return
    await window.api.deleteDossier(Number(id))
    navigate('/dossiers')
  }

  const handleUploadDoc = async () => {
    const res = await window.api.openDocumentDialog()
    if (res.data?.canceled || !res.data?.filePaths?.[0]) return
    const filePath = res.data.filePaths[0]
    const fileName = filePath.split('\\').pop() || filePath.split('/').pop() || 'document'
    setDocType('AUTRE')
    setDocModal({ path: filePath, name: fileName })
  }

  const confirmUploadDoc = async () => {
    if (!docModal) return
    await window.api.uploadDocument({ dossierId: Number(id), typeDocument: docType, nomFichier: docModal.name, sourcePath: docModal.path })
    setDocModal(null)
    load()
  }

  const handleDeleteDoc = async (docId: number, fileName: string) => {
    const res = await window.api.confirm(`Supprimer le document "${fileName}" ?`)
    if (!res.data) return
    await window.api.deleteDocument(docId)
    load()
  }

  const handleAddRelance = async () => {
    const date = prompt('Date de relance (YYYY-MM-DD):', new Date().toISOString().split('T')[0])
    if (!date) return
    const notes = prompt('Notes (optionnel):') || ''
    await window.api.createRelance({ dossierId: Number(id), dateRelance: new Date(date).toISOString(), notes })
    load()
  }

  const toggleRelance = async (relance: any) => {
    await window.api.updateRelance(relance.id, { ...relance, effectuee: !relance.effectuee })
    load()
  }

  if (!dossier) return <div className="text-text-muted p-8">Chargement...</div>

  const isLivraison = dossier.dateLivraisonPrevue
  const livrRetard = dossier.statutLivraison === 'EN_RETARD'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dossiers')} className="btn btn-ghost p-1.5"><ArrowLeft size={18} /></button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-text-primary font-mono">{dossier.numeroDossier}</h1>
              {dossier.estChaud === 1 && <Flame size={16} className="text-accent-orange" />}
              <span className={`badge ${STATUT_COLORS[dossier.statut] || ''}`}>{STATUT_LABELS[dossier.statut] || dossier.statut}</span>
            </div>
            <div className="text-sm text-text-muted">
              {dossier.clientPrenom} {dossier.clientNom} · {formatDate(dossier.dateDemande)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dossier.clientEmail && (
            <button className="btn btn-ghost" onClick={() => setEmailData({ to: dossier.clientEmail, subject: '', html: '' })}>
              <Mail size={14} /> Envoyer un email
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={14} /> Imprimer</button>
          <button className="btn btn-ghost" onClick={() => setShowEdit(true)}><Edit2 size={14} /> Modifier</button>
          <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={14} /> Supprimer</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Véhicule */}
        <div className="card space-y-2 col-span-2">
          <h3 className="font-medium text-text-primary text-sm border-b border-border pb-2 mb-3">Véhicule demandé</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {[
              ['Marque / Modèle', [dossier.marqueNom, dossier.modeleNom].filter(Boolean).join(' ') || '-'],
              ['Type', dossier.typeVehicule || '-'],
              ['Neuf / Occasion', dossier.neufOuOccasion || '-'],
              ['Énergie', dossier.energie ? ENERGIE_LABELS[dossier.energie] || dossier.energie : '-'],
              ['Valeur', dossier.valeurVehicule ? formatCurrency(dossier.valeurVehicule) : '-'],
              ['Caractéristiques', dossier.caracteristiques || '-'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-text-muted">{l}</span>
                <span className="text-text-primary text-right max-w-48">{v}</span>
              </div>
            ))}
          </div>

          {dossier.typeFinancement !== 'CASH' && (
            <>
              <div className="border-t border-border mt-3 pt-3">
                <h4 className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">Financement {FINANCEMENT_LABELS[dossier.typeFinancement]}</h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {[
                    ['Loyer mensuel', dossier.loyerMensuel ? formatCurrency(dossier.loyerMensuel) : '-'],
                    ['1er loyer majoré', dossier.premierLoyerMajore ? formatCurrency(dossier.premierLoyerMajore) : '-'],
                    ['Durée', dossier.dureeContrat ? `${dossier.dureeContrat} mois` : '-'],
                    ['Kilométrage', dossier.kilometrageContrat ? `${formatNumber(dossier.kilometrageContrat)} km` : '-'],
                    ['Apport', dossier.apport ? formatCurrency(dossier.apport) : '-'],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-sm">
                      <span className="text-text-muted">{l}</span>
                      <span className="text-text-primary">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {dossier.repriseOuiNon === 1 && (
            <div className="border-t border-border mt-3 pt-3">
              <h4 className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">Reprise</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {[
                  ['Véhicule', [dossier.repriseMarque, dossier.repriseModele].filter(Boolean).join(' ') || '-'],
                  ['Valeur', dossier.repriseValeur ? formatCurrency(dossier.repriseValeur) : '-'],
                  ['État', dossier.repriseEtat || '-'],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-text-muted">{l}</span>
                    <span className="text-text-primary">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Commission */}
          <div className="card space-y-2">
            <h3 className="font-medium text-text-primary text-sm border-b border-border pb-2 mb-3">Commission</h3>
            <div className="text-2xl font-bold text-text-primary">{dossier.montantCommission ? formatCurrency(dossier.montantCommission) : '-'}</div>
            {dossier.statutCommission && (
              <span className={`badge ${COMMISSION_COLORS[dossier.statutCommission] || ''}`}>{COMMISSION_LABELS[dossier.statutCommission]}</span>
            )}
            {[
              ['Facturation', formatDate(dossier.dateFacturation)],
              ['Paiement', formatDate(dossier.datePaiement)],
              ['Relance comm.', formatDate(dossier.dateRelance)],
            ].map(([l, v]) => v !== '-' && (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-text-muted">{l}</span>
                <span className="text-text-primary">{v}</span>
              </div>
            ))}
          </div>

          {/* Commande & Livraison */}
          <div className="card space-y-2">
            <h3 className="font-medium text-text-primary text-sm border-b border-border pb-2 mb-3">Commande & Livraison</h3>
            {[
              ['Concessionnaire', dossier.concessionnaire || '-'],
              ['Vendeur', dossier.nomVendeur || '-'],
              ['Lieu commande', dossier.lieuPriseCommande || '-'],
              ['Date commande', formatDate(dossier.dateCommande)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-text-muted">{l}</span>
                <span className="text-text-primary text-right">{v}</span>
              </div>
            ))}
            {isLivraison && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-text-muted text-sm">Livraison</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${livrRetard ? 'bg-accent-red' : 'bg-accent-green'}`} />
                  <span className={`text-sm font-medium ${livrRetard ? 'text-accent-red' : 'text-accent-green'}`}>
                    {formatDate(dossier.dateLivraisonPrevue)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documents & Relances */}
      <div className="grid grid-cols-2 gap-4">
        {/* Documents */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-text-primary text-sm">Documents ({(dossier.documents || []).length})</h3>
            <button className="btn btn-ghost text-xs" onClick={handleUploadDoc}><Upload size={12} /> Importer</button>
          </div>
          {(dossier.documents || []).length === 0 ? (
            <div className="text-center py-4 text-text-muted text-sm">Aucun document</div>
          ) : (
            <div className="space-y-1">
              {(dossier.documents || []).map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-2 p-2 rounded hover:bg-bg-hover transition-colors group">
                  <FileText size={14} className="text-accent-blue flex-shrink-0 cursor-pointer" onClick={() => window.api.openDocument(doc.cheminFichier)} />
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => window.api.openDocument(doc.cheminFichier)}>
                    <div className="text-sm text-text-primary truncate">{doc.nomFichier}</div>
                    <div className="text-xs text-text-muted">{DOCUMENT_LABELS[doc.typeDocument] || doc.typeDocument}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteDoc(doc.id, doc.nomFichier)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-accent-red transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Relances */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-text-primary text-sm">Relances ({(dossier.relances || []).length})</h3>
            <button className="btn btn-ghost text-xs" onClick={handleAddRelance}><Plus size={12} /> Ajouter</button>
          </div>
          {(dossier.relances || []).length === 0 ? (
            <div className="text-center py-4 text-text-muted text-sm">Aucune relance</div>
          ) : (
            <div className="space-y-2">
              {(dossier.relances || []).map((r: any) => (
                <div key={r.id} className={`flex items-center gap-3 p-2 rounded ${r.effectuee ? 'opacity-50' : ''}`}>
                  <button onClick={() => toggleRelance(r)}
                    className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${r.effectuee ? 'bg-accent-green border-accent-green' : 'border-border hover:border-accent-blue'}`}>
                    {r.effectuee && <Check size={10} className="text-white" />}
                  </button>
                  <div>
                    <div className="text-sm text-text-primary">{formatDate(r.dateRelance)}</div>
                    {r.notes && <div className="text-xs text-text-muted">{r.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {dossier.notes && (
        <div className="card">
          <h3 className="font-medium text-text-primary text-sm mb-2">Notes</h3>
          <p className="text-sm text-text-secondary">{dossier.notes}</p>
        </div>
      )}

      {/* Emails relance contrat */}
      {dossier.statut === 'GAGNE' && dossier.clientEmail && (dossier.dateLivraisonReelle || dossier.dateFinContrat) && (
        <div className="card">
          <h3 className="font-medium text-text-primary text-sm mb-3 flex items-center gap-2">
            <Mail size={14} className="text-accent-blue" /> Emails de relance contrat
          </h3>
          <div className="flex flex-wrap gap-2">
            {dossier.dateLivraisonReelle && (
              <button
                onClick={() => {
                  const t = templateSuiviAnnuel(dossier, customTpl.tpl_suivi_sujet, customTpl.tpl_suivi_html)
                  setEmailData({ to: dossier.clientEmail, subject: t.sujet, html: t.html })
                }}
                className="btn btn-ghost border border-border text-sm">
                <Mail size={13} /> Suivi 1 an après livraison
              </button>
            )}
            {(dossier.dateLivraisonReelle || dossier.dateFinContrat) && (
              <button
                onClick={() => {
                  const t = templateRelance6Mois(dossier, customTpl.tpl_6mois_sujet, customTpl.tpl_6mois_html)
                  setEmailData({ to: dossier.clientEmail, subject: t.sujet, html: t.html })
                }}
                className="btn btn-ghost border border-border text-sm">
                <Mail size={13} /> Relance 6 mois avant fin
              </button>
            )}
            {(dossier.dateLivraisonReelle || dossier.dateFinContrat) && (
              <button
                onClick={() => {
                  const t = templateRelance3Mois(dossier, customTpl.tpl_3mois_sujet, customTpl.tpl_3mois_html)
                  setEmailData({ to: dossier.clientEmail, subject: t.sujet, html: t.html })
                }}
                className="btn btn-ghost border border-border text-sm">
                <Mail size={13} /> Relance restitution 3 mois
              </button>
            )}
          </div>
          {!dossier.dureeContrat && (
            <p className="text-xs text-text-muted mt-2">
              Astuce : renseignez la durée du contrat pour que les rappels de fin de contrat apparaissent dans "Aujourd'hui".
            </p>
          )}
        </div>
      )}

      {showEdit && <DossierForm dossier={dossier} onClose={() => { setShowEdit(false); load() }} />}
      {emailData && <EmailComposer {...emailData} onClose={() => setEmailData(null)} />}

      {docModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-bg-secondary border border-border rounded-lg p-5 w-96 space-y-4">
            <h3 className="font-medium text-text-primary">Importer un document</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Fichier sélectionné</label>
                <div className="text-sm text-text-secondary bg-bg-primary rounded px-3 py-2 truncate">{docModal.name}</div>
              </div>
              <div>
                <label className="label">Type de document</label>
                <select value={docType} onChange={e => setDocType(e.target.value)} className="input w-full">
                  {Object.entries(DOCUMENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={confirmUploadDoc} className="btn btn-primary flex-1"><Upload size={14} /> Importer</button>
              <button onClick={() => setDocModal(null)} className="btn flex-1">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
