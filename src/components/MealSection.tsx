import { useNavigate } from 'react-router-dom'
import type { FoodEntry, Meal } from '../lib/types'

const LABEL: Record<Meal, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  drink: 'Drink',
}

interface Props {
  meal: Meal
  entries: FoodEntry[]
  date: string
  onDelete: (id: string) => void
}

export default function MealSection({ meal, entries, date, onDelete }: Props) {
  const nav = useNavigate()
  const total = entries.reduce((s, e) => s + (e.calories ?? 0), 0)
  const hasCals = entries.some((e) => e.calories !== null)
  const add = () => nav(`/add?meal=${meal}&date=${date}`)

  return (
    <section className="card" aria-label={LABEL[meal]}>
      <div className="flex items-center justify-between">
        <h3 className="text-base">{LABEL[meal]}</h3>
        {hasCals && <span className="text-sm font-semibold text-muted">{total} kcal</span>}
      </div>
      {entries.length === 0 ? (
        <button
          onClick={add}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl border-2 border-dashed border-line text-sm font-semibold text-muted hover:border-primary hover:text-primary"
        >
          + Add {LABEL[meal].toLowerCase()}
        </button>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {entries.map((e) => (
            <li key={e.id} className="flex min-h-[44px] items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{e.name}</p>
                <p className="text-xs text-muted">
                  {[e.eaten_at?.slice(0, 5), e.calories !== null ? `${e.calories} kcal` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <button
                aria-label={`Delete ${e.name}`}
                onClick={() => onDelete(e.id)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-accent"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                </svg>
              </button>
            </li>
          ))}
          <li className="pt-2">
            <button onClick={add} className="min-h-[44px] text-sm font-semibold text-primary">
              + Add more
            </button>
          </li>
        </ul>
      )}
    </section>
  )
}
