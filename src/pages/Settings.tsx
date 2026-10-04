import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useUserId } from '../lib/auth'
import { useProfile, useUpdateProfile } from '../hooks/useProfile'
import { fromDisplay, round, toDisplay } from '../lib/metrics'
import type { Unit } from '../lib/types'
import { ErrorBox, PageHeader, Spinner } from '../components/ui'

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const cols = Object.keys(rows[0])
  return [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n')
}

export default function Settings() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const uid = useUserId()
  const profile = useProfile()
  const update = useUpdateProfile()
  const [unit, setUnit] = useState<Unit>('kg')
  const [goal, setGoal] = useState('')
  const [height, setHeight] = useState('')
  const [cal, setCal] = useState('')
  const [water, setWater] = useState('2500')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const p = profile.data
    if (!p) return
    setUnit(p.unit)
    setGoal(p.goal_weight_kg !== null ? String(round(toDisplay(p.goal_weight_kg, p.unit), 1)) : '')
    setHeight(p.height_cm !== null ? String(p.height_cm) : '')
    setCal(p.daily_calorie_target !== null ? String(p.daily_calorie_target) : '')
    setWater(String(p.daily_water_target_ml))
  }, [profile.data])

  if (profile.isLoading) return <><PageHeader title="Settings" /><Spinner /></>
  if (profile.error) return <><PageHeader title="Settings" /><ErrorBox error={profile.error} onRetry={() => profile.refetch()} /></>

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    try {
      await update.mutateAsync({
        unit,
        goal_weight_kg: goal ? Math.round(fromDisplay(Number(goal), unit) * 100) / 100 : null,
        height_cm: height ? Number(height) : null,
        daily_calorie_target: cal ? Math.round(Number(cal)) : null,
        daily_water_target_ml: water ? Math.round(Number(water)) : 2500,
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    }
  }

  const exportCsv = async () => {
    setExporting(true)
    setError(null)
    try {
      const tables = ['weight_entries', 'food_entries', 'water_entries'] as const
      const parts: string[] = []
      for (const t of tables) {
        const { data, error } = await supabase.from(t).select('*').eq('user_id', uid).order('entry_date')
        if (error) throw error
        parts.push(`# ${t}\n${toCsv((data ?? []) as Record<string, unknown>[])}`)
      }
      const blob = new Blob([parts.join('\n\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'weight-tracker-export.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.')
    } finally {
      setExporting(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    qc.clear()
    nav('/login', { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Settings"
        back={
          <button aria-label="Back" onClick={() => nav(-1)} className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        }
      />
      <div className="space-y-4 lg:mx-auto lg:max-w-xl">
        <form onSubmit={save} className="card space-y-4">
          <fieldset>
            <legend className="label">Unit</legend>
            <div className="flex gap-2">
              {(['kg', 'lb'] as Unit[]).map((u) => (
                <button type="button" key={u} aria-pressed={unit === u}
                  onClick={() => {
                    if (goal && u !== unit) setGoal(String(round(toDisplay(fromDisplay(Number(goal), unit), u), 1)))
                    setUnit(u)
                  }}
                  className={`btn flex-1 ${unit === u ? 'bg-primary text-white' : 'bg-primary-tint text-primary-hover'}`}>
                  {u}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="goal" className="label">Goal weight ({unit})</label>
            <input id="goal" type="number" step="0.1" inputMode="decimal" className="input" value={goal} onChange={(e) => setGoal(e.target.value)} />
          </div>
          <div>
            <label htmlFor="height" className="label">Height (cm)</label>
            <input id="height" type="number" step="0.1" inputMode="decimal" className="input" value={height} onChange={(e) => setHeight(e.target.value)} />
          </div>
          <div>
            <label htmlFor="cal" className="label">Daily calorie target (optional)</label>
            <input id="cal" type="number" inputMode="numeric" className="input" value={cal} onChange={(e) => setCal(e.target.value)} />
          </div>
          <div>
            <label htmlFor="water" className="label">Daily water target (ml)</label>
            <input id="water" type="number" inputMode="numeric" className="input" value={water} onChange={(e) => setWater(e.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm font-medium text-accent">{error}</p>}
          {saved && <p role="status" className="text-sm font-medium text-primary-hover">Saved.</p>}
          <button className="btn-primary w-full" disabled={update.isPending}>{update.isPending ? 'Saving…' : 'Save changes'}</button>
        </form>

        <section className="card space-y-3">
          <h2 className="text-base">Your data</h2>
          <button className="btn-ghost w-full" onClick={exportCsv} disabled={exporting}>{exporting ? 'Exporting…' : 'Export all data (CSV)'}</button>
          <button className="btn w-full border border-line bg-surface text-accent hover:bg-bg" onClick={logout}>Log out</button>
        </section>
      </div>
    </>
  )
}
