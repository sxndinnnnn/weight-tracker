import {
  Area, AreaChart, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Scatter, Tooltip,
  XAxis, YAxis,
} from 'recharts'
import { movingAverage, parseDate, round, toDisplay, type Point } from '../lib/metrics'
import type { Unit } from '../lib/types'

interface Props {
  points: Point[]
  unit: Unit
  goalKg?: number | null
  /** 'area' = simple area (Today). 'trend' = moving average + daily dots + goal line (Progress). */
  variant?: 'area' | 'trend'
  height?: number
}

const fmtDate = (s: string) =>
  parseDate(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export default function TrendChart({ points, unit, goalKg, variant = 'area', height = 200 }: Props) {
  const ma = new Map(movingAverage(points, 7).map((p) => [p.date, p.kg]))
  const data = points.map((p) => ({
    date: p.date,
    weight: round(toDisplay(p.kg, unit), 2),
    avg: round(toDisplay(ma.get(p.date) ?? p.kg, unit), 2),
  }))
  const goal = goalKg != null ? round(toDisplay(goalKg, unit), 1) : null
  const vals = data.flatMap((d) => [d.weight, d.avg]).concat(goal !== null ? [goal] : [])
  const lo = Math.floor(Math.min(...vals) - 1)
  const hi = Math.ceil(Math.max(...vals) + 1)

  const common = (
    <>
      <CartesianGrid stroke="#D8E3DF" strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#4D6666', fontSize: 12 }} minTickGap={32} axisLine={false} tickLine={false} />
      <YAxis domain={[lo, hi]} tick={{ fill: '#4D6666', fontSize: 12 }} width={36} axisLine={false} tickLine={false} />
      <Tooltip
        labelFormatter={(l) => fmtDate(String(l))}
        formatter={(v, name) => [`${v} ${unit}`, name === 'avg' ? '7-day avg' : 'Weight']}
      />
      {goal !== null && (
        <ReferenceLine y={goal} stroke="#C2410C" strokeDasharray="6 4" label={{ value: 'Goal', fill: '#C2410C', fontSize: 12, position: 'insideTopRight' }} />
      )}
    </>
  )

  return (
    <div role="img" aria-label={`Weight chart in ${unit}, ${points.length} entries`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'area' ? (
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F766E" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#0F766E" stopOpacity={0} />
              </linearGradient>
            </defs>
            {common}
            <Area type="monotone" dataKey="weight" stroke="#0F766E" strokeWidth={2.5} fill="url(#wfill)" dot={false} />
          </AreaChart>
        ) : (
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            {common}
            <Scatter dataKey="weight" fill="#0F766E" fillOpacity={0.35} />
            <Line type="monotone" dataKey="avg" stroke="#0F766E" strokeWidth={3} dot={false} />
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
