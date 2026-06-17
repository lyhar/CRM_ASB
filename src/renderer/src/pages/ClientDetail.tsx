import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, FileText, FolderOpen, Upload, Star } from 'lucide-react'
import { formatDate, STATUT_LABELS, STATUT_COLORS, FINANCEMENT_LABELS, DOCUMENT_LABELS, formatCurrency } from '../lib/utils'
import ClientForm from '../components/ClientForm'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<any>(null)
  const [tab, setTab] = useState<'infos' | 'dossiers' | 'documents'>('infos')
  const [showEdit, setShowEdit] = useState(false)

  const load = async () => {
    const res = await window.api.getClient(Number(id))
    if (res.success) setClient(res.data)
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async () => {
    if (!confirm('Supprimer ce client ?')) return
    await window.api.deleteClient(Number(id))
    navigate('/clients')
  }

  const handleUploadDoc = async () => {
    const res = await window.api.openDocumentDialog()
    if (res.data?.canceled || !res.data?.filePaths?.[0]) return
    const filePath = res.data.filePaths[0]
    const fileName = filePath.split('\\').pop() || filePath.split('/').pop() || 'document'
    const type = prompt('Type de document (PERMIS, RIB, CNI, PASSEPORT, JUSTIFICATIF_DOMICILE, BILAN_COMPTABLE, KBIS, AUTRE):', 'AUTRE')
    if (!type) return
    await window.api.uploadDocument({ clientId: Number(id), typeDocument: type, nomFichier: fileName, sourcePath: filePath })
    load()
  }

  if (!client) return <div className="text-text-muted p-8">Chargement...</div>

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/clients')} className="btn btn-ghost p-1.5">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              {client.prenom} {client.nom}
              {client.estPremierAppelant === 1 && <Star size={14} className="text-accent-yellow fill-accent-yellow" />}
            </h1>
            <div className="text-sm text-text-muted">{client.type}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={() => setShowEdit(true)}>
            <Edit2 size={14} /> Modifier
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([['infos', 'Informations'], ['dossiers', `Dossiers (${client.dossiers?.length || 0})`], ['documents', `Documents (${client.documents?.length || 0})`]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors -mb-px ${tab === key ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'infos' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card space-y-3">
            <h3 className="font-medium text-text-primary text-sm">Informations personnelles</h3>
            {[
              ['Type', client.type === 'PROFESSIONNEL' ? 'Professionnel' : 'Particulier'],
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
        <div className="card p-0">
          <table className="w-full">
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
                  <td className="px-4 py-2.5 text-sm font-mono text-accent-blue">{d.numeroDossier}</td>
                  <td className="px-4 py-2.5 text-sm text-text-muted">{formatDate(d.dateDemande)}</td>
                  <td className="px-4 py-2.5 text-sm text-text-secondary">{[d.marqueNom, d.modeleNom].filter(Boolean).join(' ') || '-'}</td>
                  <td className="px-4 py-2.5"><span className="badge bg-blue-500/20 text-blue-400 text-xs">{FINANCEMENT_LABELS[d.typeFinancement] || d.typeFinancement}</span></td>
                  <td className="px-4 py-2.5"><span className={`badge ${STATUT_COLORS[d.statut] || ''}`}>{STATUT_LABELS[d.statut] || d.statut}</span></td>
                  <td className="px-4 py-2.5 text-sm text-text-secondary">{d.montantCommission ? formatCurrency(d.montantCommission) : '-'}</td>
                  <td className="px-4 py-2.5">
                    {d.dateLivraisonPrevue ? (
                      <span className={`text-xs flex items-center gap-1 ${d.statutLivraison === 'EN_RETARD' ? 'text-accent-red' : 'text-accent-green'}`}>
                        <span className={`w-2 h-2 rounded-full ${d.statutLivraison === 'EN_RETARD' ? 'bg-accent-red' : 'bg-accent-green'}`} />
                        {formatDate(d.dateLivraisonPrevue)}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <div className="grid grid-cols-3 gap-3">
              {(client.documents || []).map((doc: any) => (
                <div key={doc.id} className="card flex items-center gap-3 cursor-pointer hover:border-accent-blue/50 transition-colors"
                  onClick={() => window.api.openDocument(doc.cheminFichier)}>
                  <FileText size={20} className="text-accent-blue flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{doc.nomFichier}</div>
                    <div className="text-xs text-text-muted">{DOCUMENT_LABELS[doc.typeDocument] || doc.typeDocument}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showEdit && <ClientForm client={client} onClose={() => { setShowEdit(false); load() }} />}
    </div>
  )
}
