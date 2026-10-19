import './App.css'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider, useAuth } from './components/AuthContext'

function AppContent() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-xs font-medium text-slate-400">Verifying session permissions...</span>
        </div>
      </div>
    )
  }

  return <AppRoutes />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App