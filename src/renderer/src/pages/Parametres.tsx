import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X, Shield, User, Upload } from 'lucide-react'

export default function Parametres() {
  const [users, setUsers] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', role: 'AGENT' })
  const [saving, setSaving] = useState(false)
  const [importStatus, setImportStatus] = useState('')

  const load = async () => {
    const res = await window.api.getUsers()
    if (res.success) setUsers(res.data || [])
  }

  useEffect(() => { load() }, [])

  const openEdit = (u?: any) => {
    if (u) { setEditingUser(u); setForm({ nom: u.nom, prenom: u.prenom, email: u.email, role: u.role }) }
    else { setEditingUser(null); setForm({ nom: '', prenom: '', email: '', role: 'AGENT' }) }
    setShowForm(true)
  }

  const save = async () => {
    setSaving(true)
    const res = editingUser
      ? await window.api.updateUser(editingUser.id, { ...form, actif: true })
      : await window.api.createUser(form)
    setSaving(false)
    if (res.success) { setShowForm(false); load() }
  }

  const deleteUser = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    await window.api.deleteUser(id)
    load()
  }

  const handleImport = async () => {
    const res = await window.api.openFileDialog({ properties: ['openFile'], filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }] })
    if (res.data?.canceled || !res.data?.filePaths?.[0]) return
    setImportStatus('Import en cours...')
    const importRes = await window.api.importExcel(res.data.filePaths[0])
    if (importRes.success) {
      setImportStatus(`✓ ${importRes.data.imported} dossiers importés`)
    } else {
      setImportStatus(`Erreur : ${importRes.error}`)
    }
    setTimeout(() => setImportStatus(''), 5000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-text-primary">Paramètres</h1>

      {/* Users */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-text-primary">Utilisateurs</h2>
          <button className="btn btn-primary" onClick={() => openEdit()}>
            <Plus size={14} /> Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 bg-bg-secondary rounded border border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center">
                  {u.role === 'ADMIN' ? <Shield size={14} className="text-accent-blue" /> : <User size={14} className="text-accent-blue" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">{u.prenom} {u.nom}</div>
                  <div className="text-xs text-text-muted">{u.email} · {u.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="btn btn-ghost p-1.5" onClick={() => openEdit(u)}><Edit2 size={13} /></button>
                <button className="btn btn-danger p-1.5" onClick={() => deleteUser(u.id)}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Import Excel */}
      <div className="card">
        <h2 className="font-medium text-text-primary mb-3">Import données Excel</h2>
        <p className="text-sm text-text-secondary mb-4">
          Importer le fichier Excel actuel pour migrer les données vers le CRM.
          Les clients et dossiers existants seront créés automatiquement.
        </p>
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost border border-border" onClick={handleImport}>
            <Upload size={14} /> Importer un fichier Excel
          </button>
          {importStatus && (
            <span className={`text-sm ${importStatus.startsWith('✓') ? 'text-accent-green' : 'text-accent-red'}`}>
              {importStatus}
            </span>
          )}
        </div>
      </div>

      {/* App info */}
      <div className="card">
        <h2 className="font-medium text-text-primary mb-3">À propos</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-text-muted">Version</span><span className="text-text-secondary">1.0.0</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Application</span><span className="text-text-secondary">ASB CRM</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Base de données</span><span className="text-text-secondary">SQLite (locale)</span></div>
        </div>
      </div>

      {/* User Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-bg-card border border-border rounded-lg w-80 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">{editingUser ? 'Modifier' : 'Nouvel utilisateur'}</h3>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="form-label">Prénom</label><input className="form-input" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} /></div>
                <div><label className="form-label">Nom</label><input className="form-input" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
              </div>
              <div><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div>
                <label className="form-label">Rôle</label>
                <select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="AGENT">Agent</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
