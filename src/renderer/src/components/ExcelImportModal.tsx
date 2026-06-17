import { useState, useEffect } from 'react'
import { X, FileSpreadsheet, Loader2, Check, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react'

interface Props {
  filePath: string
  fileName: string
  onClose: () => void
  onDone: (result: { imported: number; skipped: number }) => void
}

type Mapping = Record<string, number>
type Step = 'mapping' | 'analyzing' | 'review' | 'importing'

// -2 = valeur spéciale : extraire prénom depuis la colonne Nom (split espace)
const SPLIT_FROM_NOM = -2

const FIELDS: { key: string; label: string; section: string; required?: boolean }[] = [
  { key: 'nom',               label: 'Nom (ou Nom + Prénom)',       section: 'Client', required: true },
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
  const prixSeul = h.findIndex(x =>
    x === 'PRIX' || (x.includes('PRIX') && !x.includes('LOYER') && !x.includes('MODELE') && !x.includes('REPRISE'))
  )
  // Détecter si une colonne contient nom+prénom combinés (ex: "NOM PRENOM", "CLIENT")
  const nomIdx = find('NOM')
  const prenomIdx = find('PRENOM', 'PRÉNOM')
  // Si pas de colonne prénom séparée mais une colonne nom existe → proposer split
  const prenomMapping = prenomIdx >= 0 ? prenomIdx : (nomIdx >= 0 ? SPLIT_FROM_NOM : -1)
  return {
    nom:                nomIdx,
    prenom:             prenomMapping,
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

function splitNomPrenom(raw: string): { nom: string; prenom: string } {
  const i = raw.indexOf(' ')
  return i > 0 ? { nom: raw.substring(0, i), prenom: raw.substring(i + 1) } : { nom: raw, prenom: '' }
}

function previewValue(row: string[], mapping: Mapping, fieldKey: string): string {
  if (fieldKey === 'prenom' && mapping.prenom === SPLIT_FROM_NOM) {
    const nomVal = row[mapping.nom] ?? ''
    return splitNomPrenom(nomVal).prenom || '—'
  }
  if (fieldKey === 'nom' && mapping.prenom === SPLIT_FROM_NOM) {
    const nomVal = row[mapping.nom] ?? ''
    return splitNomPrenom(nomVal).nom || '—'
  }
  const idx = mapping[fieldKey]
  return (idx >= 0 ? row[idx] : '') || ''
}

export default function ExcelImportModal({ filePath, fileName, onClose, onDone }: Props) {
  const [loading, setLoading] = useState(true)
  const [headers, setHeaders] = useState<string[]>([])
  const [sampleRows, setSampleRows] = useState<string[][]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [mapping, setMapping] = useState<Mapping>({})
  const [step, setStep] = useState<Step>('mapping')
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [toImport, setToImport] = useState(0)
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<number>>(new Set())
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

  const handleAnalyze = async () => {
    if (mapping.nom === undefined || mapping.nom < 0) { setError('Le champ "Nom" est obligatoire'); return }
    setError('')
    setStep('analyzing')
    const res = await window.api.importExcelAnalyze(filePath, mapping)
    if (!res.success) { setError(res.error || 'Erreur analyse'); setStep('mapping'); return }
    const { duplicates: dups, toImport: count } = res.data
    setDuplicates(dups)
    setToImport(count)
    // Pré-sélectionner tous les doublons (l'utilisateur peut décocher)
    setSelectedDuplicates(new Set(dups.map((d: any) => d.rowIndex)))
    if (dups.length > 0) {
      setStep('review')
    } else {
      // Pas de doublons → import direct
      await runImport([])
    }
  }

  const runImport = async (forceRows: number[]) => {
    setStep('importing')
    const res = await window.api.importExcel(filePath, mapping, forceRows)
    if (res.success) {
      onDone(res.data)
    } else {
      setError(res.error || 'Erreur import')
      setStep('mapping')
    }
  }

  const sections = ['Client', 'Dossier']
  const isSplit = mapping.prenom === SPLIT_FROM_NOM
  const colOptions = [
    { label: '— Ignorer —', value: -1 },
    ...headers.map((h, i) => ({ label: `col.${i + 1} — ${h || '(vide)'}`, value: i }))
  ]
  const prenomOptions = [
    { label: '— Ignorer —', value: -1 },
    { label: '← Extraire depuis "Nom" (split espace)', value: SPLIT_FROM_NOM },
    ...headers.map((h, i) => ({ label: `col.${i + 1} — ${h || '(vide)'}`, value: i }))
  ]
  const visibleFields = FIELDS.filter(f => f.key !== 'prenom' || !isSplit)

  // ── ÉTAPE REVIEW DOUBLONS ──
  if (step === 'review') {
    const allSelected = selectedDuplicates.size === duplicates.length
    const toggle = (idx: number) => setSelectedDuplicates(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
    return (
      <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
        <div className="bg-bg-card border border-border rounded-lg flex flex-col" style={{ width: 780, maxHeight: '88vh' }}>
          <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-accent-orange" />
              <div>
                <h2 className="font-semibold text-text-primary text-sm">Doublons détectés — {duplicates.length} ligne(s)</h2>
                <p className="text-xs text-text-muted">{toImport} nouvelles lignes à importer · {duplicates.length} déjà présentes</p>
              </div>
            </div>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-sm text-text-muted mb-3">
              Cochez les doublons à importer quand même (décochés = ignorés) :
            </p>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-bg-secondary">
                  <th className="px-3 py-2 border border-border text-left w-8">
                    <input type="checkbox" checked={allSelected}
                      onChange={() => setSelectedDuplicates(allSelected ? new Set() : new Set(duplicates.map((d: any) => d.rowIndex)))} />
                  </th>
                  <th className="px-3 py-2 border border-border text-left text-text-muted font-medium">Ligne</th>
                  <th className="px-3 py-2 border border-border text-left text-text-muted font-medium">Nom</th>
                  <th className="px-3 py-2 border border-border text-left text-text-muted font-medium">Prénom</th>
                  <th className="px-3 py-2 border border-border text-left text-text-muted font-medium">Date demande</th>
                  <th className="px-3 py-2 border border-border text-left text-text-muted font-medium">Véhicule</th>
                  <th className="px-3 py-2 border border-border text-left text-text-muted font-medium">Dossier existant</th>
                </tr>
              </thead>
              <tbody>
                {duplicates.map((d: any) => (
                  <tr key={d.rowIndex} className={selectedDuplicates.has(d.rowIndex) ? 'bg-accent-orange/5' : 'opacity-40'}>
                    <td className="px-3 py-2 border border-border/40">
                      <input type="checkbox" checked={selectedDuplicates.has(d.rowIndex)} onChange={() => toggle(d.rowIndex)} />
                    </td>
                    <td className="px-3 py-2 border border-border/40 text-text-muted">{d.rowIndex + 1}</td>
                    <td className="px-3 py-2 border border-border/40 text-text-secondary font-medium">{d.nom}</td>
                    <td className="px-3 py-2 border border-border/40 text-text-secondary">{d.prenom}</td>
                    <td className="px-3 py-2 border border-border/40 text-text-muted">{d.dateDemande || '—'}</td>
                    <td className="px-3 py-2 border border-border/40 text-text-muted">
                      {[d.marqueNom, d.modeleNom].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-3 py-2 border border-border/40 text-accent-blue font-mono text-xs">
                      {d.existingDossierNumero || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border p-4 flex items-center justify-between flex-shrink-0">
            <button className="btn btn-ghost flex items-center gap-1" onClick={() => setStep('mapping')}>
              <ChevronLeft size={14} /> Retour au mapping
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">
                {selectedDuplicates.size} doublon(s) sélectionné(s) · {toImport + selectedDuplicates.size} ligne(s) total
              </span>
              <button className="btn btn-primary" onClick={() => runImport([...selectedDuplicates])}>
                <Check size={14} /> Importer
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── ÉTAPE IMPORTING / ANALYZING ──
  if (step === 'importing' || step === 'analyzing') {
    return (
      <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
        <div className="bg-bg-card border border-border rounded-lg p-10 flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-accent-blue" />
          <p className="text-text-muted text-sm">
            {step === 'analyzing' ? 'Analyse des doublons en cours...' : 'Import en cours...'}
          </p>
        </div>
      </div>
    )
  }

  // ── ÉTAPE MAPPING ──
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border rounded-lg flex flex-col" style={{ width: 860, maxHeight: '92vh' }}>
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-accent-blue" />
            <div>
              <h2 className="font-semibold text-text-primary text-sm">Import Excel — Correspondance des colonnes</h2>
              <p className="text-xs text-text-muted">{fileName}{totalRows > 0 ? ` · ${totalRows} lignes` : ''}</p>
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
            <div className="flex-1 overflow-hidden flex">
              {/* Mapping */}
              <div className="w-[400px] flex-shrink-0 overflow-y-auto border-r border-border">
                {sections.map(section => (
                  <div key={section}>
                    <div className="sticky top-0 bg-bg-secondary px-4 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wide border-b border-border">
                      {section}
                    </div>
                    {FIELDS.filter(f => f.section === section).map(f => {
                      const isPrenom = f.key === 'prenom'
                      return (
                        <div key={f.key} className="flex items-center gap-2 px-4 py-1.5 border-b border-border/50">
                          <span className="text-xs text-text-secondary w-40 flex-shrink-0">
                            {f.label}{f.required && <span className="text-accent-red ml-0.5">*</span>}
                          </span>
                          {isPrenom ? (
                            <select
                              className="form-input text-xs py-0.5 flex-1"
                              value={mapping.prenom ?? -1}
                              onChange={e => setField('prenom', parseInt(e.target.value))}
                            >
                              {prenomOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          ) : (
                            <select
                              className="form-input text-xs py-0.5 flex-1"
                              value={mapping[f.key] ?? -1}
                              onChange={e => setField(f.key, parseInt(e.target.value))}
                            >
                              {colOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
                {isSplit && (
                  <div className="px-4 py-2 bg-accent-blue/10 border-t border-accent-blue/20 text-xs text-accent-blue">
                    Split actif : "DUPONT Jean" → Nom="DUPONT" / Prénom="Jean"
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="flex-1 overflow-auto p-3">
                <p className="text-xs text-text-muted mb-2 font-medium">Aperçu — 5 premières lignes</p>
                {sampleRows.length > 0 ? (
                  <table className="text-xs border-collapse">
                    <thead>
                      <tr className="bg-bg-secondary">
                        {visibleFields.filter(f => {
                          const idx = mapping[f.key]
                          return idx !== undefined && (idx >= 0 || (f.key === 'prenom' && isSplit))
                        }).map(f => (
                          <th key={f.key} className="text-left px-2 py-1 border border-border text-text-muted font-medium whitespace-nowrap">
                            {f.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sampleRows.map((row, ri) => (
                        <tr key={ri} className={ri % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-secondary'}>
                          {visibleFields.filter(f => {
                            const idx = mapping[f.key]
                            return idx !== undefined && (idx >= 0 || (f.key === 'prenom' && isSplit))
                          }).map(f => {
                            const val = previewValue(row, mapping, f.key)
                            return (
                              <td key={f.key} className="px-2 py-1 border border-border/40 text-text-secondary whitespace-nowrap max-w-28 truncate" title={val}>
                                {val || <span className="text-text-muted italic">–</span>}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-text-muted italic">Aucune donnée à prévisualiser</p>
                )}
              </div>
            </div>

            <div className="border-t border-border p-4 flex items-center justify-between flex-shrink-0">
              <div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-accent-red">
                    <AlertTriangle size={14} /> {error}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
                <button className="btn btn-primary" onClick={handleAnalyze}>
                  <ChevronRight size={14} /> Analyser et importer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
