import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { useProfile } from './hooks/useProfile'
import BottomNav from './components/BottomNav'
import { ErrorBox, Spinner } from './components/ui'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Today from './pages/Today'
import Log from './pages/Log'
import AddEntry from './pages/AddEntry'
import Progress from './pages/Progress'
import Settings from './pages/Settings'

function Protected() {
  const { session, loading } = useAuth()
  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  return <Gate />
}

/** Sends brand-new users to onboarding until start_weight_kg is set. */
function Gate() {
  const profile = useProfile()
  const { pathname } = useLocation()
  if (profile.isLoading) return <Spinner />
  if (profile.error)
    return <div className="mx-auto max-w-[480px] p-5"><ErrorBox error={profile.error} onRetry={() => profile.refetch()} /></div>
  if (profile.data!.start_weight_kg === null) return <Onboarding />
  const hideNav = pathname === '/add' || pathname === '/settings'
  return (
    <>
      <div className={`mx-auto max-w-[480px] px-4 pt-[env(safe-area-inset-top)] lg:max-w-3xl ${hideNav ? 'pb-10' : 'pb-[110px]'}`}>
        <Outlet />
      </div>
      {!hideNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route element={<Protected />}>
        <Route index element={<Today />} />
        <Route path="/log" element={<Log />} />
        <Route path="/add" element={<AddEntry />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
