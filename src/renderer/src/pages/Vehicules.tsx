import { useEffect, useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, X, Car, Bike } from 'lucide-react'

export default function Vehicules() {
  const [marques, setMarques] = useState<any[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [modeles, setModeles] = useState<Record<number, any[]>>({})
  const [typeFilter, setTypeFilter] = useState('VOITURE')
  const [showMarqueForm, setShowMarqueForm] = useState(false)
  const [showModeleForm, setShowModeleForm] = useState<number | null>(null)
  const [editingMarque, setEditingMarque] = useState<any>(null)
  const [editingModele, setEditingModele] = useState<any>(null)
  const [marqueForm, setMarqueForm] = useState({ nom: '', type: 'VOITURE' })
  const [modeleForm, setModeleForm] = useState({ nom: '' })
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await window.api.getMarques(typeFilter)
    if (res.success) setMarques(res.data || [])
  }

  useEffect(() => { load() }, [typeFilter])

  const toggleExpand = async (marqueId: number) => {
    if (expanded === marqueId) { setExpanded(null); return }
    setExpanded(marqueId)
    if (!modeles[marqueId]) {
      const res = await window.api.getModeles(marqueId)
      if (res.success) setModeles(prev => ({ ...prev, [marqueId]: res.data || [] }))
    }
  }

  const reloadModeles = async (marqueId: number) => {
    const res = await window.api.getModeles(marqueId)
    if (res.success) setModeles(prev => ({ ...prev, [marqueId]: res.data || [] }))
  }

  const saveMarque = async () => {
    setSaving(true)
    if (editingMarque) {
      await window.api.updateMarque(editingMarque.id, { ...marqueForm, actif: true })
    } else {
      await window.api.createMarque(marqueForm)
    }
    setSaving(false)
    setShowMarqueForm(false)
    setEditingMarque(null)
    setMarqueForm({ nom: '', type: 'VOITURE' })
    load()
  }

  const deleteMarque = async (id: number) => {
    const res = await window.api.confirm('Supprimer cette marque et tous ses modèles ?')
    if (!res.data) return
    await window.api.deleteMarque(id)
    load()
  }

  const saveModele = async (marqueId: number) => {
    setSaving(true)
    if (editingModele) {
      await window.api.updateModele(editingModele.id, { ...modeleForm, actif: true })
    } else {
      await window.api.createModele({ nom: modeleForm.nom, marqueId })
    }
    setSaving(false)
    setShowModeleForm(null)
    setEditingModele(null)
    setModeleForm({ nom: '' })
    reloadModeles(marqueId)
  }

  const deleteModele = async (id: number, marqueId: number) => {
    const res = await window.api.confirm('Supprimer ce modèle ?')
    if (!res.data) return
    await window.api.deleteModele(id)
    reloadModeles(marqueId)
  }

  const filtered = marques.filter(m => !search || m.nom.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Marques & Modèles</h1>
        <button className="btn btn-primary" onClick={() => { setEditingMarque(null); setMarqueForm({ nom: '', type: typeFilter }); setShowMarqueForm(true) }}>
          <Plus size={16} /> Nouvelle marque
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded border border-border overflow-hidden flex-shrink-0">
          {['VOITURE', 'MOTO'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-4 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${typeFilter === t ? 'bg-accent text-white' : 'text-text-secondary hover:bg-bg-hover'}`}>
              {t === 'VOITURE' ? <Car size={14} /> : <Bike size={14} />}
              {t === 'VOITURE' ? 'Voitures' : 'Motos'}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Rechercher une marque..." value={search} onChange={e => setSearch(e.target.value)} className="form-input py-1.5 text-sm w-full sm:w-60" />
        <span className="text-text-muted text-sm">{filtered.length} marque{filtered.length > 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-1">
        {filtered.map(marque => (
          <div key={marque.id} className="border border-border rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 bg-bg-card hover:bg-bg-hover cursor-pointer transition-colors"
              onClick={() => toggleExpand(marque.id)}
            >
              <div className="flex items-center gap-3">
                {expanded === marque.id ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
                <span className="font-medium text-text-primary">{marque.nom}</span>
                <span className="text-xs text-text-muted">{marque.nbModeles || 0} modèles</span>
                {!marque.actif && <span className="badge bg-zinc-500/20 text-zinc-400 text-xs">Inactif</span>}
              </div>
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost p-1.5" onClick={() => { setEditingMarque(marque); setMarqueForm({ nom: marque.nom, type: marque.type }); setShowMarqueForm(true) }}>
                  <Edit2 size={13} />
                </button>
                <button className="btn btn-danger p-1.5" onClick={() => deleteMarque(marque.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {expanded === marque.id && (
              <div className="border-t border-border bg-bg-secondary">
                <div className="p-3 flex flex-wrap gap-2">
                  {(modeles[marque.id] || []).map(m => (
                    <div key={m.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm ${m.actif ? 'border-border text-text-secondary' : 'border-border/50 text-text-muted opacity-50'}`}>
                      <span>{m.nom}</span>
                      <button onClick={() => { setEditingModele(m); setModeleForm({ nom: m.nom }); setShowModeleForm(marque.id) }}
                        className="text-text-muted hover:text-text-primary transition-colors">
                        <Edit2 size={10} />
                      </button>
                      <button onClick={() => deleteModele(m.id, marque.id)} className="text-text-muted hover:text-color-danger transition-colors">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => { setEditingModele(null); setModeleForm({ nom: '' }); setShowModeleForm(marque.id) }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-border text-text-muted hover:border-accent hover:text-accent text-sm transition-colors">
                    <Plus size={11} /> Ajouter
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card text-center py-10 text-text-muted">
            <Car size={32} className="mx-auto mb-2 opacity-30" />
            <div className="text-sm">Aucune marque trouvée</div>
          </div>
        )}
      </div>

      {/* Marque form modal */}
      {showMarqueForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-bg-card border border-border rounded-lg w-full max-w-xs p-5">
            <h3 className="font-semibold text-text-primary mb-4">{editingMarque ? 'Modifier la marque' : 'Nouvelle marque'}</h3>
            <div className="space-y-3">
              <div>
                <label className="form-label">Nom *</label>
                <input className="form-input" value={marqueForm.nom} onChange={e => setMarqueForm(f => ({ ...f, nom: e.target.value }))} placeholder="Nom de la marque" autoFocus />
              </div>
              <div>
                <label className="form-label">Type</label>
                <select className="form-input" value={marqueForm.type} onChange={e => setMarqueForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="VOITURE">Voiture</option>
                  <option value="MOTO">Moto</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => { setShowMarqueForm(false); setEditingMarque(null) }}>Annuler</button>
              <button className="btn btn-primary" onClick={saveMarque} disabled={saving}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modele form modal */}
      {showModeleForm !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-bg-card border border-border rounded-lg w-full max-w-xs p-5">
            <h3 className="font-semibold text-text-primary mb-4">{editingModele ? 'Modifier le modèle' : 'Nouveau modèle'}</h3>
            <div>
              <label className="form-label">Nom *</label>
              <input className="form-input" value={modeleForm.nom} onChange={e => setModeleForm({ nom: e.target.value })} placeholder="Nom du modèle" autoFocus
                onKeyDown={e => e.key === 'Enter' && saveModele(showModeleForm)} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => { setShowModeleForm(null); setEditingModele(null) }}>Annuler</button>
              <button className="btn btn-primary" onClick={() => saveModele(showModeleForm)} disabled={saving}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
