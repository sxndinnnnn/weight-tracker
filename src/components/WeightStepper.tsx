import { useEffect, useRef, useState } from 'react'
import { formatWeight, fromDisplay, round, toDisplay } from '../lib/metrics'
import type { Unit } from '../lib/types'

interface Props {
  /** Saved weight for the day in kg, if any. */
  savedKg: number | null
  /** Where the stepper starts if nothing is saved (previous entry), in kg. */
  startKg: number | null
  previousKg: number | null
  unit: Unit
  onSave: (kg: number) => void
}

export default function WeightStepper({ savedKg, startKg, previousKg, unit, onSave }: Props) {
  const initial = savedKg ?? startKg
  const [display, setDisplay] = useState<number | null>(initial === null ? null : round(toDisplay(initial, unit), 1))
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync when the day (and so the saved value) changes.
  useEffect(() => {
    const v = savedKg ?? startKg
    setDisplay(v === null ? null : round(toDisplay(v, unit), 1))
  }, [savedKg, startKg, unit])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const change = (delta: number) => {
    const next = round((display ?? (unit === 'kg' ? 70 : 150)) + delta, 1)
    setDisplay(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onSave(fromDisplay(next, unit)), 500)
  }

  const diff =
    display !== null && previousKg !== null ? round(display - toDisplay(previousKg, unit), 1) : null
  const btn =
    'flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-2xl font-bold text-primary-hover hover:bg-line'

  return (
    <div className="card">
      <p className="text-sm font-medium text-muted">Weight</p>
      <div className="mt-2 flex items-center justify-between">
        <button className={btn} aria-label="Decrease weight by 0.1" onClick={() => change(-0.1)}>−</button>
        <div className="text-center" aria-live="polite">
          <p className="font-heading text-4xl font-bold">
            {display === null ? '—' : display.toFixed(1)}
            <span className="ml-1 text-lg font-semibold text-muted">{unit}</span>
          </p>
          {savedKg === null && display !== null && <p className="text-xs text-muted">Not saved yet</p>}
        </div>
        <button className={btn} aria-label="Increase weight by 0.1" onClick={() => change(0.1)}>+</button>
      </div>
      {display === null && (
        <p className="mt-2 text-center text-sm text-muted">Tap + or − to log your first weigh-in.</p>
      )}
      {previousKg !== null && (
        <p className="mt-3 text-center text-sm text-muted">
          Previous: {formatWeight(previousKg, unit)}
          {diff !== null && (
            <span className="font-semibold text-ink">
              {' '}({diff > 0 ? '+' : ''}{diff.toFixed(1)} {unit})
            </span>
          )}
        </p>
      )}
    </div>
  )
}
