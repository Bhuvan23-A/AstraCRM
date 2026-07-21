import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuthStore } from './stores/authStore'
import { ToastContainer } from './components/ui/Toast/ToastContainer'
import CrmLayout from './components/layout/CrmLayout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'

const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'))
const ComponentShowcase = lazy(() => import('./pages/ComponentShowcase/ComponentShowcase'))
const Accounts = lazy(() => import('./pages/Accounts/Accounts').then(m => ({ default: m.Accounts })))
const AccountDetails = lazy(() => import('./pages/Accounts/AccountDetails').then(m => ({ default: m.AccountDetails })))
const Contacts = lazy(() => import('./pages/Contacts/Contacts').then(m => ({ default: m.Contacts })))
const Leads = lazy(() => import('./pages/Leads/Leads').then(m => ({ default: m.Leads })))
const LeadDetails = lazy(() => import('./pages/Leads/LeadDetails').then(m => ({ default: m.LeadDetails })))
const Users = lazy(() => import('./pages/Users/Users'))

const Fallback = (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', color: 'var(--text-secondary)',
    fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)',
    background: 'var(--bg-base)',
  }}>
    Loading...
  </div>
)

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <h1 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)',
        fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)'
      }}>
        {title}
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
        This module is coming in the next phase.
      </p>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Suspense fallback={Fallback}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><CrmLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="accounts/:id" element={<AccountDetails />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="leads" element={<Leads />} />
            <Route path="leads/:id" element={<LeadDetails />} />
            <Route path="users" element={<Users />} />
            <Route path="components" element={<ComponentShowcase />} />
            <Route path="pipeline" element={<PlaceholderPage title="Sales Pipeline" />} />
            <Route path="deals" element={<PlaceholderPage title="Deal Management" />} />
            <Route path="products" element={<PlaceholderPage title="Product Catalog" />} />
            <Route path="quotations" element={<PlaceholderPage title="Quotation Management" />} />
            <Route path="orders" element={<PlaceholderPage title="Order Management" />} />
            <Route path="activities" element={<PlaceholderPage title="Activities" />} />
            <Route path="tasks" element={<PlaceholderPage title="Tasks" />} />
            <Route path="communications" element={<PlaceholderPage title="Communications" />} />
            <Route path="notifications" element={<PlaceholderPage title="Notifications" />} />
            <Route path="tickets" element={<PlaceholderPage title="Support Tickets" />} />
            <Route path="documents" element={<PlaceholderPage title="Documents" />} />
            <Route path="reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="marketing" element={<PlaceholderPage title="Marketing" />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
            <Route path="import-export" element={<PlaceholderPage title="Import / Export" />} />
            <Route path="audit-log" element={<PlaceholderPage title="Audit Log" />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}