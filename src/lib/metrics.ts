export interface Point {
  date: string // YYYY-MM-DD
  kg: number
}

const KG_PER_LB = 0.45359237

export const kgToLb = (kg: number) => kg / KG_PER_LB
export const lbToKg = (lb: number) => lb * KG_PER_LB
export const toDisplay = (kg: number, unit: 'kg' | 'lb') => (unit === 'lb' ? kgToLb(kg) : kg)
export const fromDisplay = (v: number, unit: 'kg' | 'lb') => (unit === 'lb' ? lbToKg(v) : v)
export const round = (n: number, dp = 1) => {
  const f = 10 ** dp
  return Math.round(n * f) / f
}
export const formatWeight = (kg: number, unit: 'kg' | 'lb', dp = 1) =>
  `${round(toDisplay(kg, unit), dp).toFixed(dp)} ${unit}`

/** Local-timezone YYYY-MM-DD */
export function toDateStr(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
export const todayStr = () => toDateStr(new Date())

/** Parse YYYY-MM-DD as a local date (noon avoids DST edge cases). */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}
export function addDays(s: string, n: number): string {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}
export const daysBetween = (a: string, b: string) =>
  Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000)

const sortPts = (pts: Point[]) => [...pts].sort((a, b) => a.date.localeCompare(b.date))

/** Trailing moving average over the last `window` calendar days (inclusive). */
export function movingAverage(points: Point[], window = 7): Point[] {
  const sorted = sortPts(points)
  return sorted.map((p) => {
    const inWindow = sorted.filter(
      (q) => q.date <= p.date && daysBetween(q.date, p.date) < window,
    )
    const avg = inWindow.reduce((s, q) => s + q.kg, 0) / inWindow.length
    return { date: p.date, kg: avg }
  })
}

/** Latest weight on or before `today` minus the latest weight on or before today-7. Null if no comparison. */
export function weeklyChange(points: Point[], today: string): number | null {
  const sorted = sortPts(points).filter((p) => p.date <= today)
  if (sorted.length === 0) return null
  const latest = sorted[sorted.length - 1]
  const weekAgo = addDays(today, -7)
  const prior = [...sorted].reverse().find((p) => p.date <= weekAgo)
  const baseline = prior ?? sorted[0]
  if (baseline.date === latest.date) return null
  return latest.kg - baseline.kg
}

/** Consecutive days with a weight entry, ending today (or yesterday if today isn't logged yet). */
export function streak(dates: string[], today: string): number {
  const set = new Set(dates)
  let cursor = set.has(today) ? today : addDays(today, -1)
  let n = 0
  while (set.has(cursor)) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

/** Average change per week (kg, negative = loss) from first to last point. Null if < 7 days of data. */
export function avgWeeklyChange(points: Point[]): number | null {
  const sorted = sortPts(points)
  if (sorted.length < 2) return null
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const days = daysBetween(first.date, last.date)
  if (days < 7) return null
  return ((last.kg - first.kg) / days) * 7
}

/** Estimated goal date, or null if not enough data / not moving toward the goal. */
export function goalEta(points: Point[], goalKg: number, today = todayStr()): string | null {
  const rate = avgWeeklyChange(points)
  if (rate === null || rate === 0) return null
  const sorted = sortPts(points)
  const last = sorted[sorted.length - 1]
  const remaining = goalKg - last.kg
  if (remaining === 0) return today
  if (Math.sign(remaining) !== Math.sign(rate)) return null
  const weeks = remaining / rate
  const base = last.date > today ? last.date : today
  return addDays(base, Math.ceil(weeks * 7))
}

/** Progress from start to goal as 0-100. */
export function percentToGoal(startKg: number, goalKg: number, currentKg: number): number {
  const total = startKg - goalKg
  if (total === 0) return 100
  const pct = ((startKg - currentKg) / total) * 100
  return Math.max(0, Math.min(100, pct))
}

export interface WeekBar {
  weekStart: string
  change: number | null
}

/**
 * Change for each of the last `weeks` weeks (ending at `today`): last weight in the week
 * minus the last weight before it. Null if the week has no data or no baseline.
 */
export function weeklyChanges(points: Point[], today: string, weeks = 5): WeekBar[] {
  const sorted = sortPts(points)
  const out: WeekBar[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const end = addDays(today, -7 * i)
    const start = addDays(end, -6)
    const inWeek = sorted.filter((p) => p.date >= start && p.date <= end)
    if (inWeek.length === 0) {
      out.push({ weekStart: start, change: null })
      continue
    }
    const before = [...sorted].reverse().find((p) => p.date < start)
    const last = inWeek[inWeek.length - 1]
    if (before) out.push({ weekStart: start, change: last.kg - before.kg })
    else if (inWeek.length > 1) out.push({ weekStart: start, change: last.kg - inWeek[0].kg })
    else out.push({ weekStart: start, change: null })
  }
  return out
}

export type PaceNote = { tone: 'info' | 'caution'; text: string } | null

export function paceNote(weekly: WeekBar[], unit: 'kg' | 'lb'): PaceNote {
  const vals = weekly.map((w) => w.change).filter((c): c is number => c !== null)
  if (vals.length < 2) return null
  const recent = vals.slice(-3)
  const lim = unit === 'lb' ? '2 lb' : '1 kg'
  if (recent.length >= 3 && recent.every((c) => c < -1)) {
    return {
      tone: 'caution',
      text: `Your average loss has been above ${lim} per week for a few weeks. A steadier pace is usually easier to sustain. Consider talking to a health professional if you're unsure.`,
    }
  }
  const avg = recent.reduce((s, c) => s + c, 0) / recent.length
  if (avg <= -0.25 && avg >= -1) {
    return {
      tone: 'info',
      text:
        unit === 'lb'
          ? 'Steady pace: about 1-2 lb per week is a sustainable range.'
          : 'Steady pace: about 0.5-1 kg per week is a sustainable range.',
    }
  }
  if (avg > -0.25 && avg < 0.25) return { tone: 'info', text: 'Your weight has been fairly stable recently.' }
  if (avg >= 0.25)
    return { tone: 'info', text: 'Weight has gone up a little recently. Day-to-day swings are normal; look at the trend.' }
  return null
}

/** Filter points to the last N days (null = all). */
export function inRange(points: Point[], days: number | null, today: string): Point[] {
  if (days === null) return sortPts(points)
  const start = addDays(today, -(days - 1))
  return sortPts(points).filter((p) => p.date >= start && p.date <= today)
}
