import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'
import { useAuth } from '../lib/auth'

function friendly(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Email or password is incorrect.'
  if (m.includes('already registered')) return 'An account with this email already exists. Try logging in.'
  if (m.includes('password') && m.includes('6')) return 'Password must be at least 6 characters.'
  if (m.includes('email not confirmed')) return 'Please confirm your email first, then log in.'
  if (m.includes('failed to fetch')) return 'Network error. Check your connection and Supabase URL.'
  return msg
}

export default function Auth() {
  const { session } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  if (session) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.session) setInfo('Check your email to confirm your account, then log in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(friendly(err instanceof Error ? err.message : 'Something went wrong.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[480px] flex-col justify-center px-5 py-10">
      <h1 className="text-4xl">Weight Tracker</h1>
      <p className="mt-2 text-muted">Log your weight, meals and water. See the trend.</p>

      {!isConfigured && (
        <p role="alert" className="mt-4 rounded-xl bg-accent/10 p-3 text-sm text-accent">
          Supabase isn't configured. Copy .env.example to .env and add your project URL and anon key.
        </p>
      )}

      <form onSubmit={submit} className="card mt-6 space-y-4">
        <h2 className="text-xl">{mode === 'login' ? 'Log in' : 'Create account'}</h2>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm font-medium text-accent">{error}</p>}
        {info && <p role="status" className="text-sm font-medium text-primary-hover">{info}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
        <button
          type="button"
          className="min-h-[44px] w-full text-sm font-semibold text-primary"
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setInfo(null) }}
        >
          {mode === 'login' ? "New here? Create an account" : 'Have an account? Log in'}
        </button>
      </form>
    </main>
  )
}
