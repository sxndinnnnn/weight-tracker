import { Link } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useWeights } from '../hooks/useWeights'
import { useFoodEntries } from '../hooks/useFoodEntries'
import { useWaterEntries } from '../hooks/useWaterEntries'
import { formatWeight, inRange, percentToGoal, round, streak, todayStr, toDisplay, weeklyChange } from '../lib/metrics'
import ProgressBar from '../components/ProgressBar'
import StatCard from '../components/StatCard'
import TrendChart from '../components/TrendChart'
import { EmptyState, ErrorBox, PageHeader, Spinner } from '../components/ui'

export default function Today() {
  const today = todayStr()
  const profile = useProfile()
  const weights = useWeights()
  const food = useFoodEntries(today)
  const water = useWaterEntries(today)

  const gear = (
    <Link to="/settings" aria-label="Settings" className="flex h-11 w-11 items-center justify-center rounded-full bg-surface border border-line text-muted hover:text-primary">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    </Link>
  )

  if (profile.isLoading || weights.isLoading) return <><PageHeader title="Today" right={gear} /><Spinner /></>
  if (profile.error || weights.error)
    return <><PageHeader title="Today" right={gear} /><ErrorBox error={profile.error ?? weights.error} onRetry={() => { profile.refetch(); weights.refetch() }} /></>

  const p = profile.data!
  const unit = p.unit
  const entries = weights.data ?? []
  const pts = entries.map((w) => ({ date: w.entry_date, kg: w.weight_kg }))

  if (entries.length === 0)
    return (
      <>
        <PageHeader title="Today" right={gear} />
        <EmptyState
          title="No weigh-ins yet"
          body="Log your first weight to see your progress here."
          action={<Link to="/log" className="btn-primary">Log weight</Link>}
        />
      </>
    )

  const latest = entries[entries.length - 1].weight_kg
  const startKg = p.start_weight_kg ?? entries[0].weight_kg
  const lost = startKg - latest
  const pct = p.goal_weight_kg !== null ? percentToGoal(startKg, p.goal_weight_kg, latest) : null
  const wk = weeklyChange(pts, today)
  const strk = streak(entries.map((e) => e.entry_date), today)
  const last30 = inRange(pts, 30, today)

  const kcal = (food.data ?? []).reduce((s, f) => s + (f.calories ?? 0), 0)
  const hasKcal = (food.data ?? []).some((f) => f.calories !== null)
  const ml = (water.data ?? []).reduce((s, w) => s + w.ml, 0)

  return (
    <>
      <PageHeader title="Today" right={gear} />
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        <section className="card bg-primary text-white border-primary lg:col-span-2" aria-label="Current weight">
          <p className="text-sm text-white/90">Current weight</p>
          <p className="font-heading text-5xl font-bold">{formatWeight(latest, unit)}</p>
          <p className="mt-1 text-white/90">
            {lost >= 0 ? 'Lost' : 'Gained'} {formatWeight(Math.abs(lost), unit)} so far
          </p>
          {pct !== null && p.goal_weight_kg !== null && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-sm">
                <span>{formatWeight(startKg, unit, 0)}</span>
                <span className="font-semibold">{Math.round(pct)}% to goal</span>
                <span>{formatWeight(p.goal_weight_kg, unit, 0)}</span>
              </div>
              <div role="progressbar" aria-label="Progress to goal" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} className="h-3 overflow-hidden rounded-full bg-white/30">
                <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </section>

        <StatCard
          label="This week"
          value={wk === null ? '—' : `${wk > 0 ? '+' : ''}${round(toDisplay(wk, unit) - 0, 1).toFixed(1)} ${unit}`}
          hint={wk === null ? 'Needs two entries' : 'vs 7 days ago'}
        />
        <StatCard label="Logging streak" value={`${strk} ${strk === 1 ? 'day' : 'days'}`} hint="consecutive weigh-ins" />

        <section className="card lg:col-span-2" aria-label="30-day weight">
          <h2 className="mb-2 text-base">Last 30 days</h2>
          <TrendChart points={last30} unit={unit} goalKg={p.goal_weight_kg} />
        </section>

        <section className="card">
          <div className="flex justify-between">
            <h2 className="text-base">Calories</h2>
            <span className="text-sm font-semibold">
              {hasKcal ? kcal : 0}{p.daily_calorie_target ? ` / ${p.daily_calorie_target}` : ''} kcal
            </span>
          </div>
          {p.daily_calorie_target ? (
            <div className="mt-3"><ProgressBar label="Calories today" value={kcal} max={p.daily_calorie_target} color="#C2410C" /></div>
          ) : (
            <p className="mt-2 text-sm text-muted">Optional. Set a target in <Link to="/settings" className="font-semibold text-primary underline">Settings</Link>.</p>
          )}
        </section>

        <section className="card">
          <div className="flex justify-between">
            <h2 className="text-base">Water</h2>
            <span className="text-sm font-semibold">{ml} / {p.daily_water_target_ml} ml</span>
          </div>
          <div className="mt-3"><ProgressBar label="Water today" value={ml} max={p.daily_water_target_ml} color="#1D4ED8" /></div>
        </section>
      </div>
    </>
  )
}
