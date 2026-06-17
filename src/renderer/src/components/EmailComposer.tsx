import { useState, useEffect } from 'react'
import { X, Send, Copy, Check, Mail } from 'lucide-react'

interface EmailComposerProps {
  to: string
  subject: string
  html: string
  onClose: () => void
}

export default function EmailComposer({ to, subject: initialSubject, html: initialHtml, onClose }: EmailComposerProps) {
  const [toAddr, setToAddr] = useState(to)
  const [subject, setSubject] = useState(initialSubject)
  const [html, setHtml] = useState(initialHtml)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [smtpOk, setSmtpOk] = useState(false)
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')

  useEffect(() => {
    window.api.getSettings().then(res => {
      if (res.success) setSmtpOk(!!(res.data?.smtp_host && res.data?.smtp_user && res.data?.smtp_password))
    })
  }, [])

  const handleSend = async () => {
    if (!toAddr) { setStatus({ type: 'error', msg: 'Adresse email manquante' }); return }
    setSending(true)
    setStatus(null)
    const res = await window.api.sendEmail({ to: toAddr, subject, html })
    setSending(false)
    if (res.success) {
      setStatus({ type: 'success', msg: 'Email envoyé avec succès !' })
      setTimeout(() => onClose(), 1500)
    } else {
      setStatus({ type: 'error', msg: res.error || 'Erreur envoi' })
    }
  }

  const handleMailto = () => {
    const body = html.replace(/<[^>]+>/g, '').replace(/\n\n+/g, '\n\n').trim()
    window.api.openExternal(`mailto:${encodeURIComponent(toAddr)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  const handleCopy = async () => {
    const body = html.replace(/<[^>]+>/g, '').replace(/\n\n+/g, '\n\n').trim()
    await navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border rounded-lg w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-accent-blue" />
            <h2 className="font-semibold text-text-primary">Composer un email</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>

        {/* Fields */}
        <div className="p-4 space-y-3 flex-shrink-0 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted w-14 text-right flex-shrink-0">À</span>
            <input className="form-input text-sm py-1.5 flex-1" value={toAddr} onChange={e => setToAddr(e.target.value)} placeholder="email@client.com" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted w-14 text-right flex-shrink-0">Objet</span>
            <input className="form-input text-sm py-1.5 flex-1" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {(['edit', 'preview'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm transition-colors ${tab === t ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-muted hover:text-text-primary'}`}>
              {t === 'edit' ? 'Éditer' : 'Aperçu'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {tab === 'edit' ? (
            <textarea
              className="w-full h-full bg-bg-secondary text-text-primary text-sm p-4 resize-none focus:outline-none font-mono"
              value={html}
              onChange={e => setHtml(e.target.value)}
              style={{ minHeight: 220 }}
            />
          ) : (
            <div
              className="p-4 overflow-y-auto text-sm"
              style={{ minHeight: 220 }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost text-sm" onClick={handleCopy}>
              {copied ? <Check size={14} className="text-accent-green" /> : <Copy size={14} />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
            <button className="btn btn-ghost text-sm" onClick={handleMailto}>
              <Mail size={14} /> Ouvrir dans messagerie
            </button>
          </div>
          <div className="flex items-center gap-3">
            {status && (
              <span className={`text-sm ${status.type === 'success' ? 'text-accent-green' : 'text-accent-red'}`}>
                {status.msg}
              </span>
            )}
            {smtpOk ? (
              <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
                <Send size={14} /> {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            ) : (
              <span className="text-xs text-text-muted">SMTP non configuré — utilisez "Ouvrir dans messagerie"</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
