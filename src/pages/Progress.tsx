import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { useProfile } from '../hooks/useProfile'
import { useWeights } from '../hooks/useWeights'
import {
  avgWeeklyChange, formatWeight, goalEta, inRange, paceNote, parseDate, round, todayStr, toDisplay, weeklyChanges,
} from '../lib/metrics'
import StatCard from '../components/StatCard'
import TrendChart from '../components/TrendChart'
import { EmptyState, ErrorBox, PageHeader, Spinner } from '../components/ui'

const RANGES = [
  { id: '1W', days: 7 },
  { id: '1M', days: 30 },
  { id: '3M', days: 90 },
  { id: 'All', days: null },
] as const

export default function Progress() {
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('1M')
  const profile = useProfile()
  const weights = useWeights()

  if (profile.isLoading || weights.isLoading) return <><PageHeader title="Progress" /><Spinner /></>
  if (profile.error || weights.error)
    return <><PageHeader title="Progress" /><ErrorBox error={profile.error ?? weights.error} onRetry={() => { profile.refetch(); weights.refetch() }} /></>

  const p = profile.data!
  const unit = p.unit
  const today = todayStr()
  const all = (weights.data ?? []).map((w) => ({ date: w.entry_date, kg: w.weight_kg }))

  if (all.length === 0)
    return (
      <>
        <PageHeader title="Progress" />
        <EmptyState title="Nothing to chart yet" body="Log a few weigh-ins and your trend will show up here."
          action={<Link to="/log" className="btn-primary">Log weight</Link>} />
      </>
    )

  const days = RANGES.find((r) => r.id === range)!.days
  const pts = inRange(all, days, today)
  const latest = all[all.length - 1].kg
  const startKg = p.start_weight_kg ?? all[0].kg
  const rate = avgWeeklyChange(all)
  const eta = p.goal_weight_kg !== null ? goalEta(all, p.goal_weight_kg, today) : null
  const remaining = p.goal_weight_kg !== null ? latest - p.goal_weight_kg : null
  const weekly = weeklyChanges(all, today, 5)
  const note = paceNote(weekly, unit)
  const bars = weekly.map((w) => ({
    label: parseDate(w.weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    change: w.change === null ? null : round(toDisplay(w.change, unit), 2),
  }))

  return (
    <>
      <PageHeader title="Progress" />
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        <section className="card lg:col-span-2">
          <div role="group" aria-label="Range" className="mb-3 flex gap-2">
            {RANGES.map((r) => (
              <button key={r.id} aria-pressed={range === r.id} onClick={() => setRange(r.id)}
                className={`btn flex-1 ${range === r.id ? 'bg-primary text-white' : 'bg-primary-tint text-primary-hover'}`}>
                {r.id}
              </button>
            ))}
          </div>
          {pts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No entries in this range.</p>
          ) : (
            <TrendChart points={pts} unit={unit} goalKg={p.goal_weight_kg} variant="trend" height={240} />
          )}
          <p className="mt-2 text-xs text-muted">Line: 7-day moving average. Dots: daily weigh-ins. Dashed: goal.</p>
        </section>

        <StatCard label="Total lost" value={formatWeight(startKg - latest, unit)} />
        <StatCard
          label="Avg change / week"
          value={rate === null ? '—' : `${rate > 0 ? '+' : ''}${round(toDisplay(rate, unit), 2).toFixed(2)} ${unit}`}
          hint={rate === null ? 'Needs a week of data' : undefined}
        />
        <StatCard label="Remaining to goal" value={remaining === null ? '—' : formatWeight(Math.max(0, remaining), unit)} />
        <StatCard
          label="Estimated goal date"
          value={eta ? parseDate(eta).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          hint={eta ? 'Based on your average rate' : 'Not enough data yet'}
        />

        <section className="card lg:col-span-2">
          <h2 className="mb-2 text-base">Weekly change (last 5 weeks)</h2>
          <div role="img" aria-label="Weekly change bars" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: '#4D6666', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4D6666', fontSize: 12 }} width={36} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v} ${unit}`, 'Change']} />
                <ReferenceLine y={0} stroke="#D8E3DF" />
                <Bar dataKey="change" radius={[6, 6, 6, 6]}>
                  {bars.map((b, i) => <Cell key={i} fill={(b.change ?? 0) <= 0 ? '#0F766E' : '#C2410C'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {note && (
          <p role="note" className={`card lg:col-span-2 text-sm ${note.tone === 'caution' ? 'border-accent/50 bg-accent/5' : 'text-muted'}`}>
            {note.text}
          </p>
        )}
      </div>
    </>
  )
}
