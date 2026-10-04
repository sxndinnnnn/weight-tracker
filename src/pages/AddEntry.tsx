import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAddFood, useRecentFood } from '../hooks/useFoodEntries'
import { todayStr } from '../lib/metrics'
import type { FoodEntry, Meal } from '../lib/types'
import { PageHeader } from '../components/ui'

const MEALS: { id: Meal; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
]

const nowTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function AddEntry() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const date = params.get('date') ?? todayStr()
  const initialMeal = params.get('meal') as Meal | null

  const [kind, setKind] = useState<'food' | 'drink'>(initialMeal === 'drink' ? 'drink' : 'food')
  const [meal, setMeal] = useState<Meal>(initialMeal && initialMeal !== 'drink' ? initialMeal : 'breakfast')
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [time, setTime] = useState(nowTime())
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const add = useAddFood()
  const recent = useRecentFood()

  const fill = (r: FoodEntry) => {
    setKind(r.meal === 'drink' ? 'drink' : 'food')
    if (r.meal !== 'drink') setMeal(r.meal)
    setName(r.name)
    setCalories(r.calories !== null ? String(r.calories) : '')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return setError('Give it a name.')
    try {
      await add.mutateAsync({
        entry_date: date,
        meal: kind === 'drink' ? 'drink' : meal,
        name: name.trim(),
        calories: calories === '' ? null : Math.max(0, Math.round(Number(calories))),
        eaten_at: time || null,
        note: note.trim() || null,
      })
      nav('/log')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Try again.')
    }
  }

  const seg = (active: boolean) =>
    `btn flex-1 ${active ? 'bg-primary text-white' : 'bg-primary-tint text-primary-hover'}`

  return (
    <>
      <PageHeader
        title="Add entry"
        back={
          <button aria-label="Back" onClick={() => nav(-1)} className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        }
      />
      <form onSubmit={submit} className="card space-y-4 lg:mx-auto lg:max-w-xl">
        <div className="flex gap-2" role="group" aria-label="Type">
          <button type="button" aria-pressed={kind === 'food'} className={seg(kind === 'food')} onClick={() => setKind('food')}>Food</button>
          <button type="button" aria-pressed={kind === 'drink'} className={seg(kind === 'drink')} onClick={() => setKind('drink')}>Drink</button>
        </div>

        {recent.data && recent.data.length > 0 && (
          <div>
            <p className="label">Recent</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {recent.data.map((r) => (
                <button type="button" key={r.id} onClick={() => fill(r)} className="min-h-[44px] shrink-0 rounded-full border border-line bg-bg px-4 text-sm font-medium hover:border-primary">
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="name" className="label">Name</label>
          <input id="name" className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'drink' ? 'e.g. Latte' : 'e.g. Oatmeal'} />
        </div>

        {kind === 'food' && (
          <fieldset>
            <legend className="label">Meal</legend>
            <div className="flex flex-wrap gap-2">
              {MEALS.map((m) => (
                <button type="button" key={m.id} aria-pressed={meal === m.id} onClick={() => setMeal(m.id)}
                  className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold ${meal === m.id ? 'border-primary bg-primary text-white' : 'border-line bg-surface'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cal" className="label">Calories (optional)</label>
            <input id="cal" inputMode="numeric" type="number" min="0" className="input" value={calories} onChange={(e) => setCalories(e.target.value)} />
          </div>
          <div>
            <label htmlFor="time" className="label">Time</label>
            <input id="time" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div>
          <label htmlFor="note" className="label">Note (optional)</label>
          <textarea id="note" rows={2} className="input py-2" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error && <p role="alert" className="text-sm font-medium text-accent">{error}</p>}
        <button className="btn-primary w-full" disabled={add.isPending}>{add.isPending ? 'Saving…' : 'Save entry'}</button>
      </form>
    </>
  )
}
