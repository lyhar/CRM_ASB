import { useState, useEffect } from 'react'
import { X, FileSpreadsheet, Loader2, Check, AlertTriangle } from 'lucide-react'

interface Props {
  filePath: string
  fileName: string
  onClose: () => void
  onDone: (result: { imported: number; skipped: number }) => void
}

type Mapping = Record<string, number>

const FIELDS: { key: string; label: string; section: string; required?: boolean }[] = [
  { key: 'nom',               label: 'Nom',                         section: 'Client', required: true },
  { key: 'prenom',            label: 'Prénom',                      section: 'Client' },
  { key: 'typeClient',        label: 'Pro / Particulier',           section: 'Client' },
  { key: 'avisGoogle',        label: 'Avis Google (O/N)',           section: 'Client' },
  { key: 'dateDemande',       label: 'Date de demande',             section: 'Dossier' },
  { key: 'typeFinancement',   label: 'Financement (LOA/LLD/CASH)',  section: 'Dossier' },
  { key: 'neufOuOccasion',    label: 'Neuf ou VO',                  section: 'Dossier' },
  { key: 'marqueNom',         label: 'Marque',                      section: 'Dossier' },
  { key: 'modeleNom',         label: 'Modèle',                      section: 'Dossier' },
  { key: 'caracteristiques',  label: 'Caractéristiques',            section: 'Dossier' },
  { key: 'prixOuLoyer',       label: 'Prix ou loyer mensuel',       section: 'Dossier' },
  { key: 'apport',            label: 'Apport',                      section: 'Dossier' },
  { key: 'repriseOuiNon',     label: 'Reprise (O/N)',               section: 'Dossier' },
  { key: 'repriseModele',     label: 'Modèle de reprise / Prix',    section: 'Dossier' },
  { key: 'valeurVehicule',    label: 'Prix véhicule',               section: 'Dossier' },
  { key: 'kilometrageContrat',label: 'Km / Couple',                 section: 'Dossier' },
  { key: 'estChaud',          label: 'Client chaud (O/N)',          section: 'Dossier' },
  { key: 'concession',        label: 'Concession',                  section: 'Dossier' },
  { key: 'commandeEffectuee', label: 'Commande (O/N)',              section: 'Dossier' },
  { key: 'dateLivraison',     label: 'Date de livraison',           section: 'Dossier' },
  { key: 'facture',           label: 'Facturé (O/N)',               section: 'Dossier' },
  { key: 'paye',              label: 'Payé (O/N)',                  section: 'Dossier' },
  { key: 'dateRelance',       label: 'Date relance facture',        section: 'Dossier' },
  { key: 'montantCommission', label: 'Montant TTC (commission)',    section: 'Dossier' },
]

function autoDetect(headers: string[]): Mapping {
  const h = headers.map(x => String(x ?? '').toUpperCase().trim())
  const find = (...kws: string[]): number => {
    for (const kw of kws) {
      const i = h.findIndex(x => x.includes(kw))
      if (i !== -1) return i
    }
    return -1
  }
  // "PRIX" seul (pas "PRIX OU LOYER" ni "MODELE SI REPRISE / PRIX")
  const prixSeul = h.findIndex(x => x === 'PRIX' || (x.includes('PRIX') && !x.includes('LOYER') && !x.includes('MODELE') && !x.includes('REPRISE')))
  return {
    nom:                find('NOM'),
    prenom:             find('PRENOM', 'PRÉNOM'),
    typeClient:         find('PRO / PART', 'PRO/PART', 'PRO '),
    avisGoogle:         find('AVIS GOOGLE'),
    dateDemande:        find('DATE DEMANDE'),
    typeFinancement:    find('LOA / CASH', 'LOA/CASH', 'LOA'),
    neufOuOccasion:     find('NEUF'),
    marqueNom:          find('MARQUE'),
    modeleNom:          h.findIndex(x => x === 'MODELE' || x === 'MODÈLE'),
    caracteristiques:   find('CARACT'),
    prixOuLoyer:        find('PRIX OU LOYER'),
    apport:             find('APPORT'),
    repriseOuiNon:      h.findIndex(x => x.startsWith('REPRISE') && x.includes('O/N')),
    repriseModele:      find('MODELE SI REPRISE'),
    valeurVehicule:     prixSeul,
    kilometrageContrat: find('COUPLE', 'KILOMETRE'),
    estChaud:           find('CHAUD'),
    concession:         find('CONCESSION'),
    commandeEffectuee:  find('COMMANDE'),
    dateLivraison:      find('DATE LIV'),
    facture:            find('FACTURE'),
    paye:               find('PAYE', 'PAYÉ'),
    dateRelance:        find('DATE RELANCE', 'RELANCE'),
    montantCommission:  find('MONTANT'),
  }
}

export default function ExcelImportModal({ filePath, fileName, onClose, onDone }: Props) {
  const [loading, setLoading] = useState(true)
  const [headers, setHeaders] = useState<string[]>([])
  const [sampleRows, setSampleRows] = useState<string[][]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [mapping, setMapping] = useState<Mapping>({})
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    window.api.importExcelPreview(filePath).then(res => {
      setLoading(false)
      if (res.success) {
        setHeaders(res.data.headers)
        setSampleRows(res.data.sampleRows)
        setTotalRows(res.data.totalRows)
        setMapping(autoDetect(res.data.headers))
      } else {
        setError(res.error || 'Erreur lecture fichier')
      }
    })
  }, [filePath])

  const setField = (key: string, val: number) => setMapping(m => ({ ...m, [key]: val }))

  const handleImport = async () => {
    if (!mapping.nom || mapping.nom < 0) { setError('Le champ "Nom" est obligatoire'); return }
    setImporting(true)
    setError('')
    const res = await window.api.importExcel(filePath, mapping)
    setImporting(false)
    if (res.success) {
      onDone(res.data)
    } else {
      setError(res.error || 'Erreur import')
    }
  }

  const sections = ['Client', 'Dossier']
  const colOptions = [{ label: '— Ignorer —', value: -1 }, ...headers.map((h, i) => ({ label: `col.${i + 1} — ${h || '(vide)'}`, value: i }))]

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border rounded-lg flex flex-col" style={{ width: 860, maxHeight: '92vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-accent-blue" />
            <div>
              <h2 className="font-semibold text-text-primary text-sm">Import Excel — Correspondance des colonnes</h2>
              <p className="text-xs text-text-muted">{fileName}{totalRows > 0 ? ` · ${totalRows} lignes détectées` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <Loader2 size={24} className="animate-spin text-accent-blue" />
            <span className="ml-3 text-text-muted">Lecture du fichier...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Body: mapping + preview */}
            <div className="flex-1 overflow-hidden flex gap-0">
              {/* Mapping (left) */}
              <div className="w-[380px] flex-shrink-0 overflow-y-auto border-r border-border">
                {sections.map(section => (
                  <div key={section}>
                    <div className="sticky top-0 bg-bg-secondary px-4 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wide border-b border-border">
                      {section}
                    </div>
                    {FIELDS.filter(f => f.section === section).map(f => (
                      <div key={f.key} className="flex items-center gap-2 px-4 py-1.5 border-b border-border/50">
                        <span className="text-xs text-text-secondary w-36 flex-shrink-0">
                          {f.label}{f.required && <span className="text-accent-red ml-0.5">*</span>}
                        </span>
                        <select
                          className="form-input text-xs py-0.5 flex-1"
                          value={mapping[f.key] ?? -1}
                          onChange={e => setField(f.key, parseInt(e.target.value))}
                        >
                          {colOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Preview (right) */}
              <div className="flex-1 overflow-auto p-3">
                <p className="text-xs text-text-muted mb-2 font-medium">Aperçu des 5 premières lignes (colonnes mappées)</p>
                {sampleRows.length > 0 ? (
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-bg-secondary">
                        {FIELDS.filter(f => mapping[f.key] >= 0).map(f => (
                          <th key={f.key} className="text-left px-2 py-1 border border-border text-text-muted font-medium whitespace-nowrap">
                            {f.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sampleRows.map((row, ri) => (
                        <tr key={ri} className={ri % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-secondary'}>
                          {FIELDS.filter(f => mapping[f.key] >= 0).map(f => (
                            <td key={f.key} className="px-2 py-1 border border-border/40 text-text-secondary whitespace-nowrap max-w-24 truncate" title={row[mapping[f.key]]}>
                              {row[mapping[f.key]] || <span className="text-text-muted italic">–</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-text-muted italic">Aucune donnée à prévisualiser</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex-1">
                {error && (
                  <div className="flex items-center gap-2 text-sm text-accent-red">
                    <AlertTriangle size={14} /> {error}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
                <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
                  {importing
                    ? <><Loader2 size={14} className="animate-spin" /> Import en cours...</>
                    : <><Check size={14} /> Importer {totalRows} lignes</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
