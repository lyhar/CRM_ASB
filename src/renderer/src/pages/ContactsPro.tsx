import { useEffect, useState } from 'react'
import { Plus, Building2, Phone, Mail, Edit2, X, MapPin, Trash2 } from 'lucide-react'
import { formatCurrency } from '../lib/utils'

export default function ContactsPro() {
  const [contacts, setContacts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({ nom: '', prenom: '', entreprise: '', adresse: '', codePostal: '', ville: '', telephone: '', email: '', siret: '', notes: '' })
  const [dossiers, setDossiers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await window.api.getContactsPro({ search: search || undefined })
    if (res.success) setContacts(res.data || [])
  }

  useEffect(() => { load() }, [search])

  const selectContact = async (c: any) => {
    setSelected(c)
    const res = await window.api.getContactPro(c.id)
    if (res.success) setDossiers(res.data.dossiers || [])
  }

  const openEdit = (c?: any) => {
    if (c) setForm({ ...c, prenom: c.prenom || '', siret: c.siret || '', notes: c.notes || '' })
    else setForm({ nom: '', prenom: '', entreprise: '', adresse: '', codePostal: '', ville: '', telephone: '', email: '', siret: '', notes: '' })
    setShowForm(true)
  }

  const submit = async () => {
    setSaving(true)
    const res = selected && form.id
      ? await window.api.updateContactPro(selected.id, form)
      : await window.api.createContactPro(form)
    setSaving(false)
    if (res.success) { setShowForm(false); load() }
  }

  const handleDelete = async (c: any) => {
    const res = await window.api.confirm(`Supprimer "${c.entreprise}" ? Les dossiers liés ne seront pas supprimés.`)
    if (!res.data) return
    await window.api.deleteContactPro(c.id)
    setSelected(null)
    load()
  }

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Concessionnaires</h1>
        <button className="btn btn-primary" onClick={() => { setSelected(null); openEdit() }}>
          <Plus size={16} /> Nouveau concessionnaire
        </button>
      </div>

      <div className="flex flex-col gap-3 xl:h-[calc(100vh-180px)] xl:flex-row">
        {/* List */}
        <div className="flex max-h-72 flex-shrink-0 flex-col gap-3 xl:max-h-none xl:w-80">
          <div>
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="form-input py-1.5 text-sm w-full" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {contacts.map(c => (
              <div key={c.id}
                onClick={() => selectContact(c)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${selected?.id === c.id ? 'border-accent bg-accent/5' : 'border-border bg-bg-card hover:bg-bg-hover'}`}>
                <div className="font-medium text-text-primary text-sm">{c.entreprise}</div>
                <div className="text-xs text-text-muted">{c.nom}{c.prenom ? ` ${c.prenom}` : ''}</div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-text-secondary">{c.nbDossiers || 0} dossiers</span>
                  <span className="text-xs text-color-success">{formatCurrency(c.totalCommissions || 0)}</span>
                </div>
              </div>
            ))}
            {contacts.length === 0 && (
              <div className="text-center py-8 text-text-muted">
                <Building2 size={28} className="mx-auto mb-2 opacity-30" />
                <div className="text-sm">Aucun concessionnaire</div>
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="card h-full flex items-center justify-center text-text-muted">
              <div className="text-center">
                <Building2 size={40} className="mx-auto mb-3 opacity-20" />
                <div className="text-sm">Sélectionner un concessionnaire</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">{selected.entreprise}</h2>
                    <div className="text-sm text-text-muted">{selected.nom}{selected.prenom ? ` ${selected.prenom}` : ''}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn btn-ghost" onClick={() => openEdit(selected)}><Edit2 size={14} /> Modifier</button>
                    <button className="btn btn-ghost text-color-danger hover:bg-color-danger/10" onClick={() => handleDelete(selected)}><Trash2 size={14} /> Supprimer</button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {selected.telephone && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Phone size={13} className="text-text-muted" /> {selected.telephone}
                    </div>
                  )}
                  {selected.email && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Mail size={13} className="text-text-muted" /> {selected.email}
                    </div>
                  )}
                  {(selected.adresse || selected.ville) && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary md:col-span-2">
                      <span>{[selected.adresse, selected.codePostal, selected.ville].filter(Boolean).join(', ')}</span>
                      <button
                        onClick={() => {
                          const q = encodeURIComponent([selected.entreprise, selected.adresse, selected.codePostal, selected.ville].filter(Boolean).join(' '))
                          window.api.openExternal(`https://maps.google.com/?q=${q}`)
                        }}
                        className="flex items-center gap-1 text-xs text-accent hover:underline flex-shrink-0"
                        title="Ouvrir dans Google Maps"
                      >
                        <MapPin size={12} /> Maps
                      </button>
                    </div>
                  )}
                  {selected.siret && <div className="text-xs text-text-muted">SIRET: {selected.siret}</div>}
                </div>
                {selected.notes && <p className="mt-3 text-sm text-text-secondary border-t border-border pt-3">{selected.notes}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="stat-card text-center">
                  <div className="text-2xl font-bold text-text-primary">{selected.nbDossiers || 0}</div>
                  <div className="text-xs text-text-muted mt-1">Dossiers</div>
                </div>
                <div className="stat-card text-center">
                  <div className="text-2xl font-bold text-color-success">{formatCurrency(selected.totalCommissions || 0)}</div>
                  <div className="text-xs text-text-muted mt-1">Commissions totales</div>
                </div>
              </div>

              {dossiers.length > 0 && (
                <div className="card p-0 overflow-x-auto">
                  <h3 className="text-sm font-medium text-text-primary p-4 border-b border-border">Dossiers liés</h3>
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b border-border">
                        {['N°', 'Client', 'Véhicule', 'Statut', 'Commission'].map(h => (
                          <th key={h} className="text-left text-xs font-medium text-text-muted px-4 py-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dossiers.map((d: any) => (
                        <tr key={d.id} className="border-b border-border hover:bg-bg-hover transition-colors">
                          <td className="px-4 py-2 text-sm font-mono text-accent">{d.numeroDossier}</td>
                          <td className="px-4 py-2 text-sm text-text-primary">{d.clientPrenom} {d.clientNom}</td>
                          <td className="px-4 py-2 text-sm text-text-secondary">{[d.marqueNom, d.modeleNom].filter(Boolean).join(' ') || '-'}</td>
                          <td className="px-4 py-2 text-sm text-text-secondary">{d.statut}</td>
                          <td className="px-4 py-2 text-sm text-text-secondary">{d.montantCommission ? formatCurrency(d.montantCommission) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-border rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-text-primary">{selected && form.id ? 'Modifier' : 'Nouveau concessionnaire'}</h2>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="form-label">Entreprise *</label>
                <input className="form-input" value={form.entreprise} onChange={e => set('entreprise', e.target.value)} placeholder="Nom de la concession" />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="form-label">Nom du contact</label>
                  <input className="form-input" value={form.nom} onChange={e => set('nom', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Prénom</label>
                  <input className="form-input" value={form.prenom} onChange={e => set('prenom', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="form-label">Adresse</label>
                <input className="form-input" value={form.adresse} onChange={e => set('adresse', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div><label className="form-label">Code postal</label><input className="form-input" value={form.codePostal} onChange={e => set('codePostal', e.target.value)} /></div>
                <div><label className="form-label">Ville</label><input className="form-input" value={form.ville} onChange={e => set('ville', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div><label className="form-label">Téléphone</label><input className="form-input" value={form.telephone} onChange={e => set('telephone', e.target.value)} /></div>
                <div><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
              </div>
              <div><label className="form-label">SIRET</label><input className="form-input" value={form.siret} onChange={e => set('siret', e.target.value)} /></div>
              <div><label className="form-label">Notes</label><textarea className="form-input min-h-16 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
