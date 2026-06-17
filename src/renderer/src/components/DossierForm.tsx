import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  dossier?: any
  prefilledClient?: { id: number; prenom: string; nom: string }
  onClose: () => void
}

export default function DossierForm({ dossier, prefilledClient, onClose }: Props) {
  const [form, setForm] = useState<any>({
    clientId: '',
    dateDemande: new Date().toISOString().split('T')[0],
    typeFinancement: 'LLD',
    statut: 'OUVERT',
    typeVehicule: 'VOITURE',
    marqueNom: '',
    modeleNom: '',
    energie: '',
    neufOuOccasion: 'NEUF',
    caracteristiques: '',
    valeurVehicule: '',
    loyerMensuel: '',
    premierLoyerMajore: '',
    dureeContrat: '',
    kilometrageContrat: '',
    apport: '',
    repriseOuiNon: false,
    repriseMarque: '',
    repriseModele: '',
    repriseValeur: '',
    repriseEtat: '',
    contactProId: '',
    nomVendeur: '',
    lieuPriseCommande: '',
    dateCommande: '',
    commandeEffectuee: false,
    dateLivraisonPrevue: '',
    dateLivraisonReelle: '',
    statutLivraison: '',
    montantCommission: '',
    statutCommission: '',
    dateFacturation: '',
    datePaiement: '',
    dateRelance: '',
    estChaud: false,
    notes: ''
  })
  const [clients, setClients] = useState<any[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [marques, setMarques] = useState<any[]>([])
  const [modeles, setModeles] = useState<any[]>([])
  const [contactsPro, setContactsPro] = useState<any[]>([])
  const [concessionSearch, setConcessionSearch] = useState('')
  const [showConcessionList, setShowConcessionList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [section, setSection] = useState(0)

  useEffect(() => {
    if (dossier) {
      const f: any = { ...dossier }
      const dateFields = ['dateDemande', 'dateCommande', 'dateLivraisonPrevue', 'dateLivraisonReelle', 'dateFacturation', 'datePaiement', 'dateRelance']
      dateFields.forEach(k => { if (f[k]) f[k] = f[k].split('T')[0] })
      setForm(f)
      setClientSearch(`${dossier.clientPrenom || ''} ${dossier.clientNom || ''}`.trim())
    } else if (prefilledClient) {
      setForm((f: any) => ({ ...f, clientId: prefilledClient.id }))
      setClientSearch(`${prefilledClient.prenom} ${prefilledClient.nom}`)
    }
    window.api.getMarques().then(res => { if (res.success) setMarques(res.data || []) })
    window.api.getContactsPro({}).then(res => {
      if (res.success) {
        setContactsPro(res.data || [])
        if (dossier?.concessionnaire) setConcessionSearch(dossier.concessionnaire)
      }
    })
  }, [dossier])

  useEffect(() => {
    if (form.marqueNom) {
      const marque = marques.find((m: any) => m.nom === form.marqueNom)
      if (marque) {
        window.api.getModeles(marque.id).then(res => { if (res.success) setModeles(res.data || []) })
      } else {
        setModeles([])
      }
    }
  }, [form.marqueNom, marques])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const searchClient = async (q: string) => {
    setClientSearch(q)
    if (q.length < 2) { setClients([]); return }
    const res = await window.api.searchClients(q)
    if (res.success) setClients(res.data || [])
  }

  const selectClient = (c: any) => {
    set('clientId', c.id)
    setClientSearch(`${c.prenom} ${c.nom}`)
    setClients([])
  }

  const filteredMarques = marques.filter((m: any) => !form.typeVehicule || m.type === form.typeVehicule)

  const submit = async () => {
    if (!form.clientId) { setError('Client requis'); return }
    if (!form.typeFinancement) { setError('Type de financement requis'); return }
    setSaving(true)
    setError('')
    const data = {
      ...form,
      clientId: Number(form.clientId),
      contactProId: form.contactProId ? Number(form.contactProId) : null,
      valeurVehicule: form.valeurVehicule ? Number(form.valeurVehicule) : null,
      loyerMensuel: form.loyerMensuel ? Number(form.loyerMensuel) : null,
      premierLoyerMajore: form.premierLoyerMajore ? Number(form.premierLoyerMajore) : null,
      dureeContrat: form.dureeContrat ? Number(form.dureeContrat) : null,
      kilometrageContrat: form.kilometrageContrat ? Number(form.kilometrageContrat) : null,
      apport: form.apport ? Number(form.apport) : null,
      repriseValeur: form.repriseValeur ? Number(form.repriseValeur) : null,
      montantCommission: form.montantCommission ? Number(form.montantCommission) : null,
    }
    const res = dossier
      ? await window.api.updateDossier(dossier.id, data)
      : await window.api.createDossier(data)
    setSaving(false)
    if (!res.success) { setError(res.error || 'Erreur'); return }
    onClose()
  }

  const sections = ['Client & Véhicule', 'Financement', 'Commande', 'Commission']

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border rounded-lg w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-text-primary">{dossier ? `Modifier ${dossier.numeroDossier}` : 'Nouveau dossier'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 px-5 pt-4 border-b border-border flex-shrink-0">
          {sections.map((s, i) => (
            <button key={i} onClick={() => setSection(i)}
              className={`px-3 py-1.5 text-sm rounded-t transition-colors -mb-px border-b-2 ${section === i ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && <div className="px-3 py-2 bg-accent-red/10 border border-accent-red/20 rounded text-accent-red text-sm">{error}</div>}

          {/* Section 0: Client & Véhicule */}
          {section === 0 && <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Client *</label>
                <div className="relative">
                  <input className="form-input" value={clientSearch}
                    onChange={e => searchClient(e.target.value)} placeholder="Rechercher un client..." />
                  {clients.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-bg-card border border-border rounded shadow-lg z-10">
                      {clients.map((c: any) => (
                        <button key={c.id} className="w-full text-left px-3 py-2 text-sm hover:bg-bg-hover text-text-primary"
                          onClick={() => selectClient(c)}>
                          {c.prenom} {c.nom} — {c.telephone || c.email || ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="form-label">Date de demande</label>
                <input type="date" className="form-input" value={form.dateDemande} onChange={e => set('dateDemande', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Statut</label>
                <select className="form-input" value={form.statut} onChange={e => set('statut', e.target.value)}>
                  <option value="OUVERT">Ouvert</option>
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="GAGNE">Gagné</option>
                  <option value="PERDU">Perdu</option>
                </select>
              </div>
              <div>
                <label className="form-label">Type financement *</label>
                <select className="form-input" value={form.typeFinancement} onChange={e => set('typeFinancement', e.target.value)}>
                  <option value="LLD">LLD</option>
                  <option value="LOA">LOA</option>
                  <option value="CASH">Achat comptant</option>
                </select>
              </div>
              <div className="flex items-end pb-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.estChaud} onChange={e => set('estChaud', e.target.checked)} className="accent-accent-orange" />
                  <span className="text-sm text-text-secondary">🔥 Chaud</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Type de véhicule</label>
                <select className="form-input" value={form.typeVehicule} onChange={e => set('typeVehicule', e.target.value)}>
                  <option value="VOITURE">Voiture</option>
                  <option value="MOTO">Moto</option>
                </select>
              </div>
              <div>
                <label className="form-label">Marque</label>
                <select className="form-input" value={form.marqueNom} onChange={e => { set('marqueNom', e.target.value); set('modeleNom', '') }}>
                  <option value="">— Sélectionner —</option>
                  {filteredMarques.map((m: any) => <option key={m.id} value={m.nom}>{m.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Modèle</label>
                {modeles.length > 0 ? (
                  <select className="form-input" value={form.modeleNom} onChange={e => set('modeleNom', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {modeles.map((m: any) => <option key={m.id} value={m.nom}>{m.nom}</option>)}
                  </select>
                ) : (
                  <input className="form-input" value={form.modeleNom} onChange={e => set('modeleNom', e.target.value)} placeholder="Modèle" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Neuf ou occasion</label>
                <select className="form-input" value={form.neufOuOccasion} onChange={e => set('neufOuOccasion', e.target.value)}>
                  <option value="NEUF">Neuf</option>
                  <option value="OCCASION">Occasion</option>
                </select>
              </div>
              <div>
                <label className="form-label">Énergie</label>
                <select className="form-input" value={form.energie} onChange={e => set('energie', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="ESSENCE">Essence</option>
                  <option value="ELECTRIQUE">Électrique</option>
                  <option value="HYBRIDE">Hybride</option>
                  <option value="HYBRIDE_RECHARGEABLE">Hybride rechargeable</option>
                  <option value="HYDROGENE">Hydrogène</option>
                </select>
              </div>
              <div>
                <label className="form-label">Valeur du véhicule (€)</label>
                <input type="number" className="form-input" value={form.valeurVehicule} onChange={e => set('valeurVehicule', e.target.value)} placeholder="0" />
              </div>
            </div>

            <div>
              <label className="form-label">Caractéristiques / Couple / Kilométrage</label>
              <textarea className="form-input min-h-16 resize-none" value={form.caracteristiques}
                onChange={e => set('caracteristiques', e.target.value)} placeholder="Pack, options, km au compteur..." />
            </div>

            {/* Reprise */}
            <div className="border border-border rounded p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="reprise" checked={form.repriseOuiNon} onChange={e => set('repriseOuiNon', e.target.checked)} className="accent-accent-blue" />
                <label htmlFor="reprise" className="text-sm font-medium text-text-primary cursor-pointer">Reprise de véhicule</label>
              </div>
              {form.repriseOuiNon && (
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="form-label">Marque reprise</label>
                    <input className="form-input" value={form.repriseMarque} onChange={e => set('repriseMarque', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Modèle reprise</label>
                    <input className="form-input" value={form.repriseModele} onChange={e => set('repriseModele', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Valeur reprise (€)</label>
                    <input type="number" className="form-input" value={form.repriseValeur} onChange={e => set('repriseValeur', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">État</label>
                    <select className="form-input" value={form.repriseEtat} onChange={e => set('repriseEtat', e.target.value)}>
                      <option value="">—</option>
                      <option value="TRES_BON">Très bon</option>
                      <option value="BON">Bon</option>
                      <option value="MOYEN">Moyen</option>
                      <option value="MAUVAIS">Mauvais</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </>}

          {/* Section 1: Financement */}
          {section === 1 && <>
            {(form.typeFinancement === 'LLD' || form.typeFinancement === 'LOA') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Loyer mensuel (€)</label>
                  <input type="number" className="form-input" value={form.loyerMensuel} onChange={e => set('loyerMensuel', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className="form-label">1er loyer majoré (€)</label>
                  <input type="number" className="form-input" value={form.premierLoyerMajore} onChange={e => set('premierLoyerMajore', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className="form-label">Durée contrat (mois)</label>
                  <input type="number" className="form-input" value={form.dureeContrat} onChange={e => set('dureeContrat', e.target.value)} placeholder="36" />
                </div>
                <div>
                  <label className="form-label">Kilométrage contrat</label>
                  <input type="number" className="form-input" value={form.kilometrageContrat} onChange={e => set('kilometrageContrat', e.target.value)} placeholder="10000" />
                </div>
              </div>
            )}
            <div>
              <label className="form-label">Apport (€)</label>
              <input type="number" className="form-input" value={form.apport} onChange={e => set('apport', e.target.value)} placeholder="0" />
            </div>
          </>}

          {/* Section 2: Commande */}
          {section === 2 && <>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="form-label">Concessionnaire</label>
                <input
                  className="form-input"
                  value={concessionSearch}
                  placeholder="Rechercher un concessionnaire..."
                  onChange={e => { setConcessionSearch(e.target.value); setShowConcessionList(true) }}
                  onFocus={() => setShowConcessionList(true)}
                  onBlur={() => setTimeout(() => setShowConcessionList(false), 150)}
                />
                {showConcessionList && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-bg-card border border-border rounded shadow-lg max-h-52 overflow-y-auto">
                    {contactsPro
                      .filter((c: any) => !concessionSearch || c.entreprise?.toLowerCase().includes(concessionSearch.toLowerCase()) || c.ville?.toLowerCase().includes(concessionSearch.toLowerCase()))
                      .slice(0, 20)
                      .map((c: any) => (
                        <button key={c.id} type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-bg-hover text-text-primary flex items-center justify-between"
                          onMouseDown={() => { set('contactProId', String(c.id)); setConcessionSearch(c.entreprise); setShowConcessionList(false) }}>
                          <span>{c.entreprise}</span>
                          <span className="text-xs text-text-muted">{c.ville || ''}</span>
                        </button>
                      ))}
                    {concessionSearch && (
                      <button type="button"
                        className="w-full text-left px-3 py-2 text-xs text-text-muted hover:bg-bg-hover border-t border-border"
                        onMouseDown={() => { set('contactProId', ''); setConcessionSearch(''); setShowConcessionList(false) }}>
                        Effacer la sélection
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="form-label">Nom du vendeur</label>
                <input className="form-input" value={form.nomVendeur} onChange={e => set('nomVendeur', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Lieu de prise de commande</label>
                <input className="form-input" value={form.lieuPriseCommande} onChange={e => set('lieuPriseCommande', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Date de commande</label>
                <input type="date" className="form-input" value={form.dateCommande} onChange={e => set('dateCommande', e.target.value)} />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.commandeEffectuee} onChange={e => set('commandeEffectuee', e.target.checked)} className="accent-accent-blue" />
              <span className="text-sm text-text-secondary">Commande effectuée</span>
            </label>

            <div className="border-t border-border pt-4 space-y-3">
              <h3 className="text-sm font-medium text-text-primary">Livraison</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Date prévue</label>
                  <input type="date" className="form-input" value={form.dateLivraisonPrevue} onChange={e => set('dateLivraisonPrevue', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Date réelle</label>
                  <input type="date" className="form-input" value={form.dateLivraisonReelle} onChange={e => set('dateLivraisonReelle', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Statut livraison</label>
                  <select className="form-input" value={form.statutLivraison} onChange={e => set('statutLivraison', e.target.value)}>
                    <option value="">—</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="EN_AVANCE">En avance</option>
                    <option value="A_L_HEURE">À l'heure</option>
                    <option value="EN_RETARD">En retard</option>
                    <option value="LIVREE">Livrée</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">Notes</label>
              <textarea className="form-input min-h-20 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </>}

          {/* Section 3: Commission */}
          {section === 3 && <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Montant commission (€ TTC)</label>
                <input type="number" className="form-input" value={form.montantCommission} onChange={e => set('montantCommission', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="form-label">Statut commission</label>
                <select className="form-input" value={form.statutCommission} onChange={e => set('statutCommission', e.target.value)}>
                  <option value="">—</option>
                  <option value="A_FACTURER">À facturer</option>
                  <option value="FACTUREE">Facturée</option>
                  <option value="PAYEE">Payée</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Date facturation</label>
                <input type="date" className="form-input" value={form.dateFacturation} onChange={e => set('dateFacturation', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Date paiement</label>
                <input type="date" className="form-input" value={form.datePaiement} onChange={e => set('datePaiement', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="form-label">Date de relance</label>
              <input type="date" className="form-input" value={form.dateRelance} onChange={e => set('dateRelance', e.target.value)} />
            </div>
          </>}
        </div>

        <div className="flex justify-between items-center p-5 border-t border-border flex-shrink-0">
          <div className="flex gap-2">
            {section > 0 && <button className="btn btn-ghost" onClick={() => setSection(s => s - 1)}>← Précédent</button>}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            {section < sections.length - 1
              ? <button className="btn btn-primary" onClick={() => setSection(s => s + 1)}>Suivant →</button>
              : <button className="btn btn-primary" onClick={submit} disabled={saving}>
                  {saving ? 'Enregistrement...' : (dossier ? 'Enregistrer' : 'Créer le dossier')}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
