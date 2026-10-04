import { useState, type FormEvent } from 'react'
import { useUpdateProfile } from '../hooks/useProfile'
import { useUpsertWeight } from '../hooks/useWeights'
import { fromDisplay, todayStr } from '../lib/metrics'
import type { Unit } from '../lib/types'

export default function Onboarding() {
  const update = useUpdateProfile()
  const upsert = useUpsertWeight()
  const [unit, setUnit] = useState<Unit>('kg')
  const [start, setStart] = useState('')
  const [goal, setGoal] = useState('')
  const [height, setHeight] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const s = Number(start)
    const g = Number(goal)
    if (!s || !g) return setError('Enter your start and goal weight.')
    const startKg = fromDisplay(s, unit)
    const goalKg = fromDisplay(g, unit)
    if (startKg <= 20 || startKg >= 500 || goalKg <= 20 || goalKg >= 500)
      return setError('Weights must be between 20 and 500 kg.')
    try {
      await update.mutateAsync({
        unit,
        start_weight_kg: Math.round(startKg * 100) / 100,
        goal_weight_kg: Math.round(goalKg * 100) / 100,
        height_cm: height ? Number(height) : null,
        start_date: todayStr(),
      })
      // Seed today's weigh-in with the start weight so the charts have a first point.
      await upsert.mutateAsync({ date: todayStr(), kg: startKg })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Try again.')
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-[480px] px-5 py-10">
      <h1 className="text-3xl">Let's set your goal</h1>
      <p className="mt-2 text-muted">You can change any of this later in Settings.</p>
      <form onSubmit={submit} className="card mt-6 space-y-4">
        <fieldset>
          <legend className="label">Unit</legend>
          <div className="flex gap-2">
            {(['kg', 'lb'] as Unit[]).map((u) => (
              <button
                type="button"
                key={u}
                aria-pressed={unit === u}
                onClick={() => setUnit(u)}
                className={`btn flex-1 ${unit === u ? 'bg-primary text-white' : 'bg-primary-tint text-primary-hover'}`}
              >
                {u}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="start" className="label">Start weight ({unit})</label>
          <input id="start" inputMode="decimal" type="number" step="0.1" required className="input" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label htmlFor="goal" className="label">Goal weight ({unit})</label>
          <input id="goal" inputMode="decimal" type="number" step="0.1" required className="input" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>
        <div>
          <label htmlFor="height" className="label">Height in cm (optional)</label>
          <input id="height" inputMode="decimal" type="number" step="0.1" className="input" value={height} onChange={(e) => setHeight(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm font-medium text-accent">{error}</p>}
        <button className="btn-primary w-full" disabled={update.isPending || upsert.isPending}>
          {update.isPending ? 'Saving…' : 'Start tracking'}
        </button>
      </form>
    </main>
  )
}
