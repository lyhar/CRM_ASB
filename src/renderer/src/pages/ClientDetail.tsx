import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, FileText, FolderOpen, Upload, Star, Plus, Mail, X } from 'lucide-react'
import { formatDate, STATUT_LABELS, STATUT_COLORS, FINANCEMENT_LABELS, DOCUMENT_LABELS, formatCurrency } from '../lib/utils'
import ClientForm from '../components/ClientForm'
import DossierForm from '../components/DossierForm'
import EmailComposer from '../components/EmailComposer'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<any>(null)
  const [tab, setTab] = useState<'infos' | 'dossiers' | 'documents'>('infos')
  const [showEdit, setShowEdit] = useState(false)
  const [showNewDossier, setShowNewDossier] = useState(false)
  const [emailData, setEmailData] = useState<{ to: string; subject: string; html: string } | null>(null)
  const [docModal, setDocModal] = useState<{ path: string; name: string } | null>(null)
  const [docType, setDocType] = useState('AUTRE')
  const [uploadError, setUploadError] = useState('')

  const load = async () => {
    const res = await window.api.getClient(Number(id))
    if (res.success) setClient(res.data)
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async () => {
    const res = await window.api.confirm('Supprimer ce client ?')
    if (!res.data) return
    await window.api.deleteClient(Number(id))
    navigate('/clients')
  }

  const handleDeleteDoc = async (docId: number, fileName: string) => {
    const res = await window.api.confirm(`Supprimer le document "${fileName}" ?`)
    if (!res.data) return
    await window.api.deleteDocument(docId)
    load()
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
    setUploadError('')
    const res = await window.api.uploadDocument({ clientId: Number(id), typeDocument: docType, nomFichier: docModal.name, sourcePath: docModal.path })
    if (!res.success) { setUploadError(res.error || 'Erreur lors de l\'import'); return }
    setDocModal(null)
    load()
  }

  if (!client) return <div className="text-text-muted p-8">Chargement...</div>

  const isBirthday = (() => {
    if (!client.dateNaissance) return false
    const dob = new Date(client.dateNaissance)
    const today = new Date()
    return dob.getUTCMonth() === today.getMonth() && dob.getUTCDate() === today.getDate()
  })()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/clients')} className="btn btn-ghost p-1.5">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              {client.prenom} {client.nom}
              {client.estPremierAppelant === 1 && <Star size={14} className="text-color-warning fill-color-warning" />}
            </h1>
            <div className="text-sm text-text-muted">{client.type}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            className={`btn btn-ghost ${!client.email ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={!client.email ? 'Aucune adresse email renseignée' : undefined}
            onClick={() => { if (client.email) setEmailData({ to: client.email, subject: '', html: '' }) }}
          >
            <Mail size={14} /> Envoyer un email
          </button>
          <button className="btn btn-ghost" onClick={() => setShowEdit(true)}>
            <Edit2 size={14} /> Modifier
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>

      {/* Bannière anniversaire */}
      {isBirthday && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-color-warning/40 bg-color-warning/10 text-color-warning text-sm font-medium">
          🎂 Aujourd'hui, c'est l'anniversaire de {client.prenom} !
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([['infos', 'Informations'], ['dossiers', `Dossiers (${client.dossiers?.length || 0})`], ['documents', `Documents (${client.documents?.length || 0})`]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors -mb-px ${tab === key ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'infos' && (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="card space-y-3">
            <h3 className="font-medium text-text-primary text-sm">Informations personnelles</h3>
            {[
              ['Type', client.type === 'PROFESSIONNEL' ? 'Professionnel' : 'Particulier'],
              ...(client.type === 'PROFESSIONNEL' && client.entreprise ? [['Entreprise', client.entreprise]] : []),
              ['Date de naissance', formatDate(client.dateNaissance)],
              ['Adresse', [client.adresse, client.codePostal, client.ville].filter(Boolean).join(', ') || '-'],
              ['Téléphone', client.telephone || '-'],
              ['Email', client.email || '-'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-text-muted">{l}</span>
                <span className="text-text-primary text-right">{v}</span>
              </div>
            ))}
          </div>
          <div className="card space-y-3">
            <h3 className="font-medium text-text-primary text-sm">Suivi commercial</h3>
            {[
              ['Premier appelant', client.estPremierAppelant ? 'Oui' : 'Non'],
              ['Référé par', client.referentNom ? `${client.referentPrenom} ${client.referentNom}` : '-'],
              ['Contacts amenés', String(client.nombreContactsAmenes || 0)],
              ['Avis Google', client.avisGoogle ? 'Oui ✓' : 'Non'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-text-muted">{l}</span>
                <span className="text-text-primary">{v}</span>
              </div>
            ))}
            {client.notes && (
              <div className="pt-2 border-t border-border">
                <div className="text-xs text-text-muted mb-1">Notes</div>
                <p className="text-sm text-text-secondary">{client.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'dossiers' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => setShowNewDossier(true)}>
              <Plus size={14} /> Nouveau dossier
            </button>
          </div>
        <div className="card p-0 overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-border">
                {['N° Dossier', 'Date', 'Véhicule', 'Type', 'Statut', 'Commission', 'Livraison'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-text-muted px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(client.dossiers || []).length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-text-muted text-sm">Aucun dossier</td></tr>
              ) : (client.dossiers || []).map((d: any) => (
                <tr key={d.id} className="table-row" onClick={() => navigate(`/dossiers/${d.id}`)}>
                  <td className="px-4 py-2.5 text-sm font-mono text-accent">{d.numeroDossier}</td>
                  <td className="px-4 py-2.5 text-sm text-text-muted">{formatDate(d.dateDemande)}</td>
                  <td className="px-4 py-2.5 text-sm text-text-secondary">{[d.marqueNom, d.modeleNom].filter(Boolean).join(' ') || '-'}</td>
                  <td className="px-4 py-2.5"><span className="badge bg-blue-500/20 text-blue-400 text-xs">{FINANCEMENT_LABELS[d.typeFinancement] || d.typeFinancement}</span></td>
                  <td className="px-4 py-2.5"><span className={`badge ${STATUT_COLORS[d.statut] || ''}`}>{STATUT_LABELS[d.statut] || d.statut}</span></td>
                  <td className="px-4 py-2.5 text-sm text-text-secondary">{d.montantCommission ? formatCurrency(d.montantCommission) : '-'}</td>
                  <td className="px-4 py-2.5">
                    {d.dateLivraisonPrevue ? (
                      <span className={`text-xs flex items-center gap-1 ${d.statutLivraison === 'EN_RETARD' ? 'text-color-danger' : 'text-color-success'}`}>
                        <span className={`w-2 h-2 rounded-full ${d.statutLivraison === 'EN_RETARD' ? 'bg-color-danger' : 'bg-color-success'}`} />
                        {formatDate(d.dateLivraisonPrevue)}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {tab === 'documents' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={handleUploadDoc}>
              <Upload size={14} /> Importer un document
            </button>
          </div>
          {(client.documents || []).length === 0 ? (
            <div className="card text-center py-10 text-text-muted">
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <div className="text-sm">Aucun document</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(client.documents || []).map((doc: any) => (
                <div key={doc.id} className="card flex items-center gap-3 hover:border-accent/50 transition-colors group">
                  <FileText size={20} className="text-accent flex-shrink-0 cursor-pointer" onClick={() => window.api.openDocument(doc.cheminFichier)} />
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => window.api.openDocument(doc.cheminFichier)}>
                    <div className="text-sm font-medium text-text-primary truncate">{doc.nomFichier}</div>
                    <div className="text-xs text-text-muted">{DOCUMENT_LABELS[doc.typeDocument] || doc.typeDocument}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteDoc(doc.id, doc.nomFichier)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-color-danger transition-all flex-shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {emailData && <EmailComposer {...emailData} onClose={() => setEmailData(null)} />}
      {showEdit && <ClientForm client={client} onClose={() => { setShowEdit(false); load() }} />}

      {docModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-bg-secondary border border-border rounded-lg p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-text-primary">Importer un document</h3>
              <button onClick={() => setDocModal(null)} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="form-label">Fichier sélectionné</label>
                <div className="text-sm text-text-secondary bg-bg-primary rounded px-3 py-2 truncate">{docModal.name}</div>
              </div>
              <div>
                <label className="form-label">Type de document</label>
                <select value={docType} onChange={e => setDocType(e.target.value)} className="form-input w-full">
                  {Object.entries(DOCUMENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            {uploadError && <p className="text-sm text-color-danger">{uploadError}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={confirmUploadDoc} className="btn btn-primary flex-1"><Upload size={14} /> Importer</button>
              <button onClick={() => { setDocModal(null); setUploadError('') }} className="btn flex-1">Annuler</button>
            </div>
          </div>
        </div>
      )}
      {showNewDossier && (
        <DossierForm
          prefilledClient={{ id: client.id, prenom: client.prenom, nom: client.nom }}
          onClose={() => { setShowNewDossier(false); load() }}
        />
      )}
    </div>
  )
}
