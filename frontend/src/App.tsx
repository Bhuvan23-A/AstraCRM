import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ToastContainer } from './components/ui/Toast/ToastContainer'

const ComponentShowcase = lazy(() => import('./pages/ComponentShowcase/ComponentShowcase'))

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
          <Route path="/components" element={<ComponentShowcase />} />
          <Route path="/" element={<Navigate to="/components" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  )
}

export default App
