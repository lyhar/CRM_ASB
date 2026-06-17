import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Dossiers from './pages/Dossiers'
import DossierDetail from './pages/DossierDetail'
import ContactsPro from './pages/ContactsPro'
import Vehicules from './pages/Vehicules'
import Commissions from './pages/Commissions'
import Parametres from './pages/Parametres'
import UpdateNotification from './components/UpdateNotification'
import StartupPopup from './components/StartupPopup'
import { CheckCircle, X } from 'lucide-react'

function UpdatedBanner() {
  const [info, setInfo] = useState<{ from: string; to: string } | null>(null)

  useEffect(() => {
    window.api.onAppUpdated((i) => setInfo(i))
  }, [])

  if (!info) return null

  return (
    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-bg-secondary border border-accent-blue/40 rounded-lg px-4 py-2.5 shadow-xl">
      <CheckCircle size={15} className="text-accent-blue flex-shrink-0" />
      <span className="text-sm text-text-primary">
        AutoLead CRM mis à jour <span className="font-mono text-text-muted">v{info.from}</span> → <span className="font-mono text-accent-blue">v{info.to}</span>
      </span>
      <button onClick={() => setInfo(null)} className="text-text-muted hover:text-text-primary ml-1">
        <X size={14} />
      </button>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="dossiers" element={<Dossiers />} />
          <Route path="dossiers/:id" element={<DossierDetail />} />
          <Route path="contacts-pro" element={<ContactsPro />} />
          <Route path="vehicules" element={<Vehicules />} />
          <Route path="commissions" element={<Commissions />} />
          <Route path="parametres" element={<Parametres />} />
        </Route>
      </Routes>
      <UpdateNotification />
      <StartupPopup />
      <UpdatedBanner />
    </HashRouter>
  )
}
