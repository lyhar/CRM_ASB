import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  return (
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden">
      <div
        className="flex-shrink-0 bg-bg-secondary border-b border-border"
        style={{ height: 36, WebkitAppRegion: 'drag' as any }}
      />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
