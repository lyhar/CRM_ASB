import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X, Shield, User, Upload, Mail, Check, Image, FileText, RotateCcw, Loader2, Database, FolderOpen, AlertTriangle } from 'lucide-react'
import { DEFAULT_TEMPLATES } from '../lib/emailTemplates'
import RichTextEditor from '../components/RichTextEditor'
import ExcelImportModal from '../components/ExcelImportModal'

type SmtpState = {
  smtp_host: string; smtp_port: string; smtp_secure: string
  smtp_user: string; smtp_password: string; smtp_from: string
  email_signature: string; email_signature_img: string
}

type TplState = {
  tpl_suivi_sujet: string; tpl_suivi_html: string
  tpl_6mois_sujet: string; tpl_6mois_html: string
  tpl_3mois_sujet: string; tpl_3mois_html: string
}

const TPL_DEFAULTS: TplState = {
  tpl_suivi_sujet: DEFAULT_TEMPLATES.suivi.sujet,
  tpl_suivi_html: DEFAULT_TEMPLATES.suivi.html,
  tpl_6mois_sujet: DEFAULT_TEMPLATES.relance6mois.sujet,
  tpl_6mois_html: DEFAULT_TEMPLATES.relance6mois.html,
  tpl_3mois_sujet: DEFAULT_TEMPLATES.relance3mois.sujet,
  tpl_3mois_html: DEFAULT_TEMPLATES.relance3mois.html,
}

function UpdateChecker() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'uptodate'>('idle')

  const handleCheck = () => {
    if (status === 'checking') return
    setStatus('checking')
    window.api.onUpdateNotAvailable(() => {
      setStatus('uptodate')
      setTimeout(() => setStatus('idle'), 3500)
    })
    window.api.checkUpdate()
    // Fallback si aucun événement ne répond (erreur réseau, etc.)
    setTimeout(() => setStatus(s => s === 'checking' ? 'idle' : s), 15000)
  }

  return (
    <button
      onClick={handleCheck}
      disabled={status === 'checking'}
      className="btn w-full flex items-center justify-center gap-2 text-sm py-2"
    >
      {status === 'checking' ? (
        <><Loader2 size={14} className="animate-spin" /> Vérification en cours...</>
      ) : status === 'uptodate' ? (
        <><Check size={14} className="text-green-400" /> Déjà à jour !</>
      ) : (
        <><RotateCcw size={14} /> Rechercher une mise à jour</>
      )}
    </button>
  )
}

export default function Parametres() {
  const [tab, setTab] = useState<'users' | 'email' | 'templates' | 'sauvegarde'>('users')
  const [users, setUsers] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', role: 'AGENT' })
  const [saving, setSaving] = useState(false)
  const [importStatus, setImportStatus] = useState('')
  const [importModal, setImportModal] = useState<{ filePath: string; fileName: string } | null>(null)

  const [smtp, setSmtp] = useState<SmtpState>({
    smtp_host: '', smtp_port: '587', smtp_secure: 'false',
    smtp_user: '', smtp_password: '', smtp_from: '',
    email_signature: '', email_signature_img: ''
  })
  const [smtpSaving, setSmtpSaving] = useState(false)
  const [smtpStatus, setSmtpStatus] = useState('')
  const [testSending, setTestSending] = useState(false)

  const [tpl, setTpl] = useState<TplState>({ ...TPL_DEFAULTS })
  const [tplSaving, setTplSaving] = useState(false)
  const [tplStatus, setTplStatus] = useState('')

  const [backups, setBackups] = useState<any[]>([])
  const [backupStatus, setBackupStatus] = useState('')
  const [restoreConfirm, setRestoreConfirm] = useState(false)
  const [appInfo, setAppInfo] = useState<any>(null)

  const load = async () => {
    const res = await window.api.getUsers()
    if (res.success) setUsers(res.data || [])
  }

  useEffect(() => {
    load()
    window.api.getSettings().then(res => {
      if (res.success && res.data) {
        setSmtp(prev => ({ ...prev, ...res.data }))
        setTpl(prev => ({
          tpl_suivi_sujet: res.data.tpl_suivi_sujet || prev.tpl_suivi_sujet,
          tpl_suivi_html: res.data.tpl_suivi_html || prev.tpl_suivi_html,
          tpl_6mois_sujet: res.data.tpl_6mois_sujet || prev.tpl_6mois_sujet,
          tpl_6mois_html: res.data.tpl_6mois_html || prev.tpl_6mois_html,
          tpl_3mois_sujet: res.data.tpl_3mois_sujet || prev.tpl_3mois_sujet,
          tpl_3mois_html: res.data.tpl_3mois_html || prev.tpl_3mois_html,
        }))
      }
    })
  }, [])

  useEffect(() => { if (tab === 'sauvegarde') loadBackups() }, [tab])
  useEffect(() => { window.api.getAppInfo().then(setAppInfo) }, [])

  const saveSmtp = async () => {
    setSmtpSaving(true)
    setSmtpStatus('')
    for (const [k, v] of Object.entries(smtp)) await window.api.setSetting(k, v)
    setSmtpSaving(false)
    setSmtpStatus('Paramètres sauvegardés !')
    setTimeout(() => setSmtpStatus(''), 3000)
  }

  const testSmtp = async () => {
    if (!smtp.smtp_user) { setSmtpStatus('Renseignez l\'email SMTP d\'abord'); return }
    setTestSending(true)
    setSmtpStatus('')
    const res = await window.api.sendEmail({
      to: smtp.smtp_user,
      subject: 'Test SMTP — Trajectoire',
      html: '<p>Email de test envoyé depuis Trajectoire. Configuration SMTP fonctionnelle ✅</p>'
    })
    setTestSending(false)
    setSmtpStatus(res.success ? 'Email de test envoyé avec succès !' : `Erreur : ${res.error}`)
  }

  const saveTpl = async () => {
    setTplSaving(true)
    setTplStatus('')
    for (const [k, v] of Object.entries(tpl)) await window.api.setSetting(k, v)
    setTplSaving(false)
    setTplStatus('Templates sauvegardés !')
    setTimeout(() => setTplStatus(''), 3000)
  }

  const resetTpl = (key: 'suivi' | '6mois' | '3mois') => {
    const map = { suivi: DEFAULT_TEMPLATES.suivi, '6mois': DEFAULT_TEMPLATES.relance6mois, '3mois': DEFAULT_TEMPLATES.relance3mois }
    const defaults = map[key]
    setTpl(p => ({
      ...p,
      [`tpl_${key}_sujet`]: defaults.sujet,
      [`tpl_${key}_html`]: defaults.html,
    }))
  }

  const ss = (k: keyof SmtpState, v: string) => setSmtp(p => ({ ...p, [k]: v }))
  const st = (k: keyof TplState, v: string) => setTpl(p => ({ ...p, [k]: v }))

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
    const res = await window.api.confirm('Supprimer cet utilisateur ?')
    if (!res.data) return
    await window.api.deleteUser(id)
    load()
  }

  const handleImport = async () => {
    const res = await window.api.openFileDialog({ properties: ['openFile'], filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }] })
    if (res.data?.canceled || !res.data?.filePaths?.[0]) return
    const filePath = res.data.filePaths[0]
    const fileName = filePath.split(/[\\/]/).pop() || filePath
    setImportModal({ filePath, fileName })
  }

  const handlePurge = async () => {
    const res = await window.api.purgeData()
    if (res.success && res.data) {
      setImportStatus('✓ Données purgées avec succès. Une sauvegarde a été créée automatiquement.')
      setTimeout(() => setImportStatus(''), 6000)
    }
  }

  const loadBackups = async () => {
    const res = await window.api.listBackups()
    if (res.success) setBackups(res.data || [])
  }

  const handleCreateBackup = async () => {
    setBackupStatus('')
    const res = await window.api.createBackup()
    if (res.success && res.data) setBackupStatus(`✓ Sauvegarde créée : ${res.data.split('\\').pop()}`)
    else if (res.success) setBackupStatus('')
    else setBackupStatus(`Erreur : ${res.error}`)
    setTimeout(() => setBackupStatus(''), 5000)
  }

  const handleRestore = async () => {
    setRestoreConfirm(false)
    setBackupStatus('')
    const res = await window.api.restoreBackup()
    if (res.success && res.data) {
      setBackupStatus('✓ Restauration effectuée. Relancez l\'application pour valider.')
    } else if (!res.success) {
      setBackupStatus(`Erreur : ${res.error}`)
    }
    loadBackups()
  }

  const TABS = [
    { id: 'users', label: 'Utilisateurs', icon: <User size={13} /> },
    { id: 'email', label: 'Email / SMTP', icon: <Mail size={13} /> },
    { id: 'templates', label: 'Templates email', icon: <FileText size={13} /> },
    { id: 'sauvegarde', label: 'Sauvegardes', icon: <Database size={13} /> },
  ] as const

  const TEMPLATE_SECTIONS = [
    { key: 'suivi' as const, label: DEFAULT_TEMPLATES.suivi.label, sujetKey: 'tpl_suivi_sujet' as const, htmlKey: 'tpl_suivi_html' as const },
    { key: '6mois' as const, label: DEFAULT_TEMPLATES.relance6mois.label, sujetKey: 'tpl_6mois_sujet' as const, htmlKey: 'tpl_6mois_html' as const },
    { key: '3mois' as const, label: DEFAULT_TEMPLATES.relance3mois.label, sujetKey: 'tpl_3mois_sujet' as const, htmlKey: 'tpl_3mois_html' as const },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Paramètres</h1>
        <div className="flex rounded border border-border overflow-hidden">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${tab === t.id ? 'bg-accent-blue text-white' : 'text-text-secondary hover:bg-bg-hover'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SMTP ── */}
      {tab === 'email' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-medium text-text-primary flex items-center gap-2"><Mail size={14} /> Configuration SMTP</h2>
            <p className="text-xs text-text-muted">Permet d'envoyer des emails directement depuis l'application (templates de relance, suivi contrat…)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="form-label">Serveur SMTP (host)</label>
                <input className="form-input" value={smtp.smtp_host} onChange={e => ss('smtp_host', e.target.value)} placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label className="form-label">Port</label>
                <input className="form-input" value={smtp.smtp_port} onChange={e => ss('smtp_port', e.target.value)} placeholder="587" />
              </div>
              <div>
                <label className="form-label">Sécurité</label>
                <select className="form-input" value={smtp.smtp_secure} onChange={e => ss('smtp_secure', e.target.value)}>
                  <option value="false">STARTTLS (port 587)</option>
                  <option value="true">SSL/TLS (port 465)</option>
                </select>
              </div>
              <div>
                <label className="form-label">Email (identifiant)</label>
                <input className="form-input" value={smtp.smtp_user} onChange={e => ss('smtp_user', e.target.value)} placeholder="votre@email.com" />
              </div>
              <div>
                <label className="form-label">Mot de passe / App Password</label>
                <input type="password" className="form-input" value={smtp.smtp_password} onChange={e => ss('smtp_password', e.target.value)} placeholder="••••••••" />
              </div>
              <div className="col-span-2">
                <label className="form-label">Nom expéditeur (From)</label>
                <input className="form-input" value={smtp.smtp_from} onChange={e => ss('smtp_from', e.target.value)} placeholder="Antoine Moreau <votre@email.com>" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button className="btn btn-primary" onClick={saveSmtp} disabled={smtpSaving}>
                <Check size={14} /> {smtpSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button className="btn btn-ghost border border-border" onClick={testSmtp} disabled={testSending}>
                <Mail size={14} /> {testSending ? 'Envoi...' : 'Tester la connexion'}
              </button>
              {smtpStatus && (
                <span className={`text-sm ${smtpStatus.includes('succès') || smtpStatus.includes('sauvegardés') ? 'text-accent-green' : 'text-accent-red'}`}>
                  {smtpStatus}
                </span>
              )}
            </div>
          </div>

          <div className="card space-y-3">
            <h2 className="font-medium text-text-primary flex items-center gap-2"><Image size={14} /> Signature email</h2>
            <p className="text-xs text-text-muted">L'image et le texte sont ajoutés automatiquement à la fin de chaque email.</p>
            <div>
              <label className="form-label">Logo / image de signature</label>
              <div className="flex items-center gap-3">
                <button
                  className="btn btn-ghost border border-border"
                  onClick={async () => {
                    const res = await window.api.readImageAsBase64()
                    if (res.success && res.data) ss('email_signature_img', res.data)
                  }}
                >
                  <Upload size={13} /> Choisir une image
                </button>
                {smtp.email_signature_img && (
                  <button className="text-xs text-accent-red hover:underline" onClick={() => ss('email_signature_img', '')}>
                    Supprimer
                  </button>
                )}
              </div>
            </div>
            {smtp.email_signature_img && (
              <div className="p-3 bg-bg-secondary rounded border border-border">
                <img src={smtp.email_signature_img} alt="Aperçu" className="max-h-20 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
            <div>
              <label className="form-label">Texte de signature</label>
              <textarea
                className="form-input min-h-24 resize-none font-mono text-xs"
                value={smtp.email_signature}
                onChange={e => ss('email_signature', e.target.value)}
                placeholder="Jean Dupont&#10;Apporteur d'affaires automobile & moto&#10;📞 06 XX XX XX XX | ✉ contact@exemple.fr"
              />
              <p className="text-xs text-text-muted mt-1">Supporte le HTML basique (&lt;b&gt;, &lt;br&gt;, &lt;a&gt;…)</p>
            </div>
            <button className="btn btn-primary" onClick={saveSmtp} disabled={smtpSaving}>
              <Check size={14} /> Sauvegarder la signature
            </button>
          </div>

          <div className="card">
            <h2 className="font-medium text-text-primary mb-3 text-sm">Aide — Gmail</h2>
            <div className="text-xs text-text-muted space-y-1">
              <p>• Host : <code className="text-text-secondary">smtp.gmail.com</code> | Port : <code className="text-text-secondary">587</code> | Mode : STARTTLS</p>
              <p>• Le mot de passe doit être un <strong className="text-text-secondary">App Password</strong> Google (pas votre mot de passe Gmail habituel)</p>
              <p>• <button onClick={() => window.api.openExternal('https://support.google.com/mail/answer/185833?hl=fr')} className="text-accent-blue hover:underline">Créer un App Password Google →</button></p>
            </div>
          </div>
        </div>
      )}

      {/* ── TEMPLATES ── */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="card">
            <p className="text-sm text-text-muted">
              Personnalisez les 3 templates d'email de relance. Utilisez les variables entre doubles accolades pour insérer les données du dossier.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {['{{prenom}}', '{{vehicule}}', '{{financement}}', '{{dateFinContrat}}', '{{concessionnaire}}'].map(v => (
                <code key={v} className="text-xs bg-bg-secondary border border-border rounded px-2 py-0.5 text-accent-blue">{v}</code>
              ))}
            </div>
          </div>

          {TEMPLATE_SECTIONS.map(section => (
            <div key={section.key} className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-text-primary flex items-center gap-2">
                  <Mail size={13} className="text-accent-blue" /> {section.label}
                </h3>
                <button
                  onClick={() => resetTpl(section.key)}
                  className="btn btn-ghost text-xs text-text-muted">
                  <RotateCcw size={11} /> Restaurer défaut
                </button>
              </div>
              <div>
                <label className="form-label">Objet</label>
                <input
                  className="form-input font-mono text-sm"
                  value={tpl[section.sujetKey]}
                  onChange={e => st(section.sujetKey, e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Corps du message</label>
                <RichTextEditor
                  value={tpl[section.htmlKey]}
                  onChange={v => st(section.htmlKey, v)}
                  minHeight={180}
                  showVariableHint
                />
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <button className="btn btn-primary" onClick={saveTpl} disabled={tplSaving}>
              <Check size={14} /> {tplSaving ? 'Sauvegarde...' : 'Sauvegarder les templates'}
            </button>
            {tplStatus && (
              <span className={`text-sm ${tplStatus.includes('sauvegardés') ? 'text-accent-green' : 'text-accent-red'}`}>
                {tplStatus}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── UTILISATEURS ── */}
      {tab === 'users' && (<>
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

      <div className="card">
        <h2 className="font-medium text-text-primary mb-3">Import données Excel</h2>
        <p className="text-sm text-text-secondary mb-4">
          Importer le fichier Excel actuel pour migrer les données vers le CRM.
          Les clients et dossiers existants seront créés automatiquement.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="btn btn-ghost border border-border" onClick={handleImport}>
            <Upload size={14} /> Importer un fichier Excel
          </button>
          <button className="btn btn-ghost border border-red-800 text-accent-red hover:bg-red-900/20" onClick={handlePurge}>
            <Trash2 size={14} /> Purger toutes les données
          </button>
          {importStatus && (
            <span className={`text-sm ${importStatus.startsWith('✓') ? 'text-accent-green' : 'text-accent-red'}`}>
              {importStatus}
            </span>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="font-medium text-text-primary mb-4">À propos</h2>
        {appInfo ? (
          <div className="space-y-4 text-sm mb-4">
            {/* Identité app */}
            <div className="space-y-2">
              {[
                ['Application', 'Trajectoire'],
                ['Version', appInfo.version],
                ['Mode', appInfo.packaged ? 'Production (installé)' : 'Développement'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-text-muted">{l}</span>
                  <span className="text-text-secondary font-mono text-xs">{v}</span>
                </div>
              ))}
            </div>
            {/* Chemins */}
            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Emplacements</p>
              {[
                ["Dossier d'installation", appInfo.appPath],
                ['Données (db, docs, backups)', appInfo.dataDir],
                ['Base de données', appInfo.dbPath],
                ['Documents importés', appInfo.documentsDir],
                ['Sauvegardes auto', appInfo.backupsDir],
              ].map(([l, v]) => (
                <div key={l} className="space-y-0.5">
                  <div className="text-xs text-text-muted">{l}</div>
                  <div
                    className="text-xs text-text-secondary font-mono bg-bg-primary rounded px-2 py-1 break-all cursor-pointer hover:text-accent-blue transition-colors"
                    title="Cliquer pour ouvrir dans l'Explorateur"
                    onClick={() => window.api.openExternal('file:///' + v.replace(/\\/g, '/'))}>
                    {v}
                  </div>
                </div>
              ))}
            </div>
            {/* Environnement technique */}
            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Environnement</p>
              {[
                ['Electron', appInfo.electron],
                ['Node.js', appInfo.node],
                ['Plateforme', `${appInfo.platform} ${appInfo.arch}`],
                ['Base de données', 'SQLite via sql.js (locale, chiffrée en mémoire)'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between gap-4">
                  <span className="text-text-muted flex-shrink-0">{l}</span>
                  <span className="text-text-secondary font-mono text-xs text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between"><span className="text-text-muted">Application</span><span className="text-text-secondary">Trajectoire</span></div>
          </div>
        )}
        <UpdateChecker />
      </div>
      </>)}

      {/* ── SAUVEGARDES ── */}
      {tab === 'sauvegarde' && (
        <div className="space-y-4">
          {/* Backup manuel */}
          <div className="card space-y-3">
            <h2 className="font-medium text-text-primary flex items-center gap-2"><Database size={15} /> Sauvegarde manuelle</h2>
            <p className="text-sm text-text-muted">Exporte l'intégralité de la base de données (clients, dossiers, paramètres) dans un fichier de votre choix.</p>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={handleCreateBackup}><Upload size={14} /> Créer une sauvegarde maintenant</button>
              <button className="btn btn-ghost" onClick={() => window.api.openBackupFolder()}><FolderOpen size={14} /> Ouvrir le dossier de sauvegardes</button>
            </div>
            {backupStatus && (
              <p className={`text-sm ${backupStatus.startsWith('✓') ? 'text-green-400' : 'text-accent-red'}`}>{backupStatus}</p>
            )}
          </div>

          {/* Sauvegardes automatiques */}
          <div className="card space-y-3">
            <h2 className="font-medium text-text-primary flex items-center gap-2"><Shield size={15} /> Sauvegardes automatiques</h2>
            <p className="text-sm text-text-muted">
              Une sauvegarde est créée automatiquement à chaque démarrage de l'application, avant toute opération.
              Les 10 dernières sont conservées.
            </p>
            {backups.length === 0 ? (
              <p className="text-sm text-text-muted italic">Aucune sauvegarde automatique trouvée.</p>
            ) : (
              <div className="space-y-1">
                {backups.map((b, i) => (
                  <div key={b.name} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-xs bg-accent-blue/20 text-accent-blue px-1.5 py-0.5 rounded">Dernière</span>}
                      <span className="text-text-secondary font-mono text-xs">{b.name.replace('crm_', '').replace('.db', '')}</span>
                    </div>
                    <span className="text-text-muted text-xs">{(b.size / 1024).toFixed(0)} Ko</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Restauration */}
          <div className="card space-y-3 border border-accent-orange/30">
            <h2 className="font-medium text-text-primary flex items-center gap-2"><AlertTriangle size={15} className="text-accent-orange" /> Restaurer une sauvegarde</h2>
            <p className="text-sm text-text-muted">
              Remplace la base de données actuelle par un fichier de sauvegarde. Une copie de sécurité est créée automatiquement avant la restauration.
              <strong className="text-accent-orange"> Cette action est irréversible.</strong>
            </p>
            {!restoreConfirm ? (
              <button className="btn border border-accent-orange/50 text-accent-orange hover:bg-accent-orange/10 text-sm" onClick={() => setRestoreConfirm(true)}>
                Restaurer depuis un fichier...
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-accent-orange">Confirmer la restauration ?</span>
                <button className="btn btn-danger text-sm" onClick={handleRestore}>Oui, restaurer</button>
                <button className="btn text-sm" onClick={() => setRestoreConfirm(false)}>Annuler</button>
              </div>
            )}
          </div>
        </div>
      )}

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

      {importModal && (
        <ExcelImportModal
          filePath={importModal.filePath}
          fileName={importModal.fileName}
          onClose={() => setImportModal(null)}
          onDone={({ imported, skipped }) => {
            setImportModal(null)
            setImportStatus(`✓ ${imported} dossiers importés${skipped ? ` (${skipped} doublons ignorés)` : ''}`)
            setTimeout(() => setImportStatus(''), 6000)
          }}
        />
      )}
    </div>
  )
}
