import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  client?: any
  onClose: () => void
}

export default function ClientForm({ client, onClose }: Props) {
  const [form, setForm] = useState({
    type: 'PARTICULIER',
    nom: '',
    prenom: '',
    dateNaissance: '',
    adresse: '',
    codePostal: '',
    ville: '',
    telephone: '',
    email: '',
    estPremierAppelant: true,
    referentId: '',
    nombreContactsAmenes: 0,
    avisGoogle: false,
    notes: ''
  })
  const [clients, setClients] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (client) {
      setForm({
        type: client.type || 'PARTICULIER',
        nom: client.nom || '',
        prenom: client.prenom || '',
        dateNaissance: client.dateNaissance ? client.dateNaissance.split('T')[0] : '',
        adresse: client.adresse || '',
        codePostal: client.codePostal || '',
        ville: client.ville || '',
        telephone: client.telephone || '',
        email: client.email || '',
        estPremierAppelant: Boolean(client.estPremierAppelant),
        referentId: client.referentId ? String(client.referentId) : '',
        nombreContactsAmenes: client.nombreContactsAmenes || 0,
        avisGoogle: Boolean(client.avisGoogle),
        notes: client.notes || ''
      })
    }
    window.api.getClients({}).then(res => {
      if (res.success) setClients((res.data || []).filter((c: any) => c.id !== client?.id))
    })
  }, [client])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.nom.trim() || !form.prenom.trim()) { setError('Nom et prénom requis'); return }
    setSaving(true)
    setError('')
    const data = { ...form, referentId: form.referentId ? Number(form.referentId) : null }
    const res = client
      ? await window.api.updateClient(client.id, data)
      : await window.api.createClient(data)
    setSaving(false)
    if (!res.success) { setError(res.error || 'Erreur'); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-text-primary">{client ? 'Modifier le client' : 'Nouveau client'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="px-3 py-2 bg-accent-red/10 border border-accent-red/20 rounded text-accent-red text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="PARTICULIER">Particulier</option>
                <option value="PROFESSIONNEL">Professionnel</option>
              </select>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.estPremierAppelant} onChange={e => set('estPremierAppelant', e.target.checked)} className="accent-accent-blue" />
                <span className="text-sm text-text-secondary">Premier appelant</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.avisGoogle} onChange={e => set('avisGoogle', e.target.checked)} className="accent-accent-blue" />
                <span className="text-sm text-text-secondary">Avis Google</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Prénom *</label>
              <input className="form-input" value={form.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Prénom" />
            </div>
            <div>
              <label className="form-label">Nom *</label>
              <input className="form-input" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Nom" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Date de naissance</label>
              <input type="date" className="form-input" value={form.dateNaissance} onChange={e => set('dateNaissance', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Téléphone</label>
              <input className="form-input" value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="06 00 00 00 00" />
            </div>
          </div>

          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemple.fr" />
          </div>

          <div>
            <label className="form-label">Adresse</label>
            <input className="form-input" value={form.adresse} onChange={e => set('adresse', e.target.value)} placeholder="Adresse" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Code postal</label>
              <input className="form-input" value={form.codePostal} onChange={e => set('codePostal', e.target.value)} placeholder="75000" />
            </div>
            <div>
              <label className="form-label">Ville</label>
              <input className="form-input" value={form.ville} onChange={e => set('ville', e.target.value)} placeholder="Paris" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Référé par</label>
              <select className="form-input" value={form.referentId} onChange={e => set('referentId', e.target.value)}>
                <option value="">— Aucun —</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Contacts amenés</label>
              <input type="number" min={0} className="form-input" value={form.nombreContactsAmenes}
                onChange={e => set('nombreContactsAmenes', Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea className="form-input min-h-20 resize-none" value={form.notes}
              onChange={e => set('notes', e.target.value)} placeholder="Notes..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-border">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Enregistrement...' : (client ? 'Enregistrer' : 'Créer le client')}
          </button>
        </div>
      </div>
    </div>
  )
}
