import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ToastContainer } from './components/ui/Toast/ToastContainer'

const ComponentShowcase = lazy(() => import('./pages/ComponentShowcase/ComponentShowcase'))

// CRM Lazy Page Imports
const Accounts = lazy(() => import('./pages/Accounts/Accounts').then(module => ({ default: module.Accounts })))
const AccountDetails = lazy(() => import('./pages/Accounts/AccountDetails').then(module => ({ default: module.AccountDetails })))
const Contacts = lazy(() => import('./pages/Contacts/Contacts').then(module => ({ default: module.Contacts })))
const Leads = lazy(() => import('./pages/Leads/Leads').then(module => ({ default: module.Leads })))
const LeadDetails = lazy(() => import('./pages/Leads/LeadDetails').then(module => ({ default: module.LeadDetails })))

function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-lg)',
              backgroundColor: 'var(--bg-base)',
            }}
          >
            Loading...
          </div>
        }
      >
        <Routes>
          {/* Component Showcase documentation */}
          <Route path="/components" element={<ComponentShowcase />} />

          {/* CRM Core Modules */}
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:id" element={<AccountDetails />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetails />} />

          {/* Redirect index to Accounts view */}
          <Route path="/" element={<Navigate to="/accounts" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  )
}

export default App
