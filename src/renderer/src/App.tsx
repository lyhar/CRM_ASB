import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
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
    </HashRouter>
  )
}
