import { useEffect, useState } from 'react'
import { Download, RefreshCw, CheckCircle, X, Loader2 } from 'lucide-react'

type State =
  | { type: 'idle' }
  | { type: 'available'; version: string }
  | { type: 'downloading'; percent: number }
  | { type: 'downloaded' }
  | { type: 'installing'; backupDone: boolean }
  | { type: 'error'; message: string }

export default function UpdateNotification() {
  const [state, setState] = useState<State>({ type: 'idle' })
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    window.api.onUpdateAvailable((info) => {
      setState({ type: 'available', version: info.version })
      setDismissed(false)
    })
    window.api.onUpdateProgress((p) => {
      setState({ type: 'downloading', percent: p.percent })
    })
    window.api.onUpdateDownloaded(() => {
      setState({ type: 'downloaded' })
    })
    window.api.onUpdateBackupStarted(() => {
      setState({ type: 'installing', backupDone: false })
    })
    window.api.onUpdateBackupCreated(() => {
      setState({ type: 'installing', backupDone: true })
    })
    window.api.onUpdateError((msg) => {
      setState({ type: 'error', message: msg })
    })
    return () => { window.api.removeUpdateListeners() }
  }, [])

  if (dismissed || state.type === 'idle') return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-xs rounded-lg border border-border bg-bg-secondary shadow-xl">
      {state.type === 'available' && (
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 text-accent">
              <Download size={16} />
              <span className="font-semibold text-sm">Mise à jour disponible</span>
            </div>
            <button onClick={() => setDismissed(true)} className="text-text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          </div>
          <p className="text-text-secondary text-xs mb-3">
            Version <span className="font-mono text-text-primary">{state.version}</span> disponible.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => window.api.downloadUpdate()}
              className="btn btn-primary flex-1 text-xs py-1.5"
            >
              <Download size={12} /> Télécharger
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="btn text-xs py-1.5 px-3 bg-bg-hover text-text-secondary hover:text-text-primary"
            >
              Plus tard
            </button>
          </div>
        </div>
      )}

      {state.type === 'downloading' && (
        <div className="p-4">
          <div className="flex items-center gap-2 text-accent mb-2">
            <Loader2 size={16} className="animate-spin" />
            <span className="font-semibold text-sm">Téléchargement en cours...</span>
          </div>
          <div className="w-full bg-bg-primary rounded-full h-1.5 mb-1">
            <div
              className="bg-accent h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${state.percent}%` }}
            />
          </div>
          <p className="text-text-muted text-xs">{state.percent}%</p>
        </div>
      )}

      {state.type === 'downloaded' && (
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 text-color-success">
              <CheckCircle size={16} />
              <span className="font-semibold text-sm">Prête à installer</span>
            </div>
          </div>
          <p className="text-text-secondary text-xs mb-3">
            La mise à jour a été téléchargée. Redémarre l'application pour l'installer.
          </p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setState({ type: 'installing', backupDone: false })
                try {
                  await window.api.installUpdate()
                } catch {}
              }}
              className="btn btn-primary flex-1 text-xs py-1.5"
            >
              <RefreshCw size={12} /> Redémarrer et installer
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="btn text-xs py-1.5 px-3 bg-bg-hover text-text-secondary hover:text-text-primary"
            >
              Plus tard
            </button>
          </div>
        </div>
      )}

      {state.type === 'installing' && (
        <div className="p-4">
          <div className="flex items-center gap-2 text-accent mb-2">
            <Loader2 size={16} className="animate-spin" />
            <span className="font-semibold text-sm">
              {state.backupDone ? 'Installation...' : 'Sauvegarde des données...'}
            </span>
          </div>
          <p className="text-text-secondary text-xs">
            {state.backupDone
              ? "Sauvegarde créée. L'application va redémarrer."
              : "Création d'une sauvegarde complète avant la mise à jour."}
          </p>
        </div>
      )}

      {state.type === 'error' && (
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <span className="font-semibold text-sm text-color-danger">Erreur de mise à jour</span>
            <button onClick={() => setDismissed(true)} className="text-text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          </div>
          <p className="text-text-muted text-xs">{state.message}</p>
        </div>
      )}
    </div>
  )
}
