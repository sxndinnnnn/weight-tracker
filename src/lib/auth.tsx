import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthState {
  session: Session | null
  loading: boolean
}
const Ctx = createContext<AuthState>({ session: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true })
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setState({ session: data.session, loading: false }))
      .catch(() => setState({ session: null, loading: false }))
    const { data } = supabase.auth.onAuthStateChange((_e, session) =>
      setState({ session, loading: false }),
    )
    return () => data.subscription.unsubscribe()
  }, [])
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)

/** Only call inside protected routes, where a session is guaranteed. */
export function useUserId(): string {
  const { session } = useAuth()
  if (!session) throw new Error('Not signed in')
  return session.user.id
}
