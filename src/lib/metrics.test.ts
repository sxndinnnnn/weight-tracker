import { describe, expect, it } from 'vitest'
import {
  addDays, avgWeeklyChange, fromDisplay, goalEta, inRange, kgToLb, lbToKg, movingAverage,
  paceNote, percentToGoal, streak, toDateStr, weeklyChange, weeklyChanges,
} from './metrics'

const pts = (...kgs: number[]) => kgs.map((kg, i) => ({ date: addDays('2025-01-01', i), kg }))

describe('units', () => {
  it('round-trips kg and lb', () => {
    expect(lbToKg(kgToLb(80))).toBeCloseTo(80, 6)
    expect(kgToLb(1)).toBeCloseTo(2.2046, 3)
    expect(fromDisplay(176, 'lb')).toBeCloseTo(79.83, 1)
    expect(fromDisplay(80, 'kg')).toBe(80)
  })
})

describe('dates', () => {
  it('formats and shifts local dates', () => {
    expect(toDateStr(new Date(2025, 0, 5))).toBe('2025-01-05')
    expect(addDays('2025-01-31', 1)).toBe('2025-02-01')
    expect(addDays('2025-03-01', -1)).toBe('2025-02-28')
  })
})

describe('movingAverage', () => {
  it('averages the trailing window', () => {
    const ma = movingAverage(pts(80, 79, 78), 7)
    expect(ma[0].kg).toBe(80)
    expect(ma[2].kg).toBeCloseTo(79, 6)
  })
  it('drops points outside the window', () => {
    const ma = movingAverage(pts(90, 80, 80, 80, 80, 80, 80, 80), 7)
    expect(ma[7].kg).toBe(80)
  })
})

describe('weeklyChange', () => {
  it('compares to a week ago', () => {
    const p = pts(80, 80, 80, 80, 80, 80, 80, 79)
    expect(weeklyChange(p, '2025-01-08')).toBeCloseTo(-1, 6)
  })
  it('is null with a single entry or none', () => {
    expect(weeklyChange([], '2025-01-08')).toBeNull()
    expect(weeklyChange(pts(80), '2025-01-01')).toBeNull()
  })
})

describe('streak', () => {
  it('counts consecutive days ending today', () => {
    expect(streak(['2025-01-03', '2025-01-02', '2025-01-01'], '2025-01-03')).toBe(3)
  })
  it('still counts if today is not yet logged', () => {
    expect(streak(['2025-01-02', '2025-01-01'], '2025-01-03')).toBe(2)
  })
  it('breaks on gaps and is 0 when stale', () => {
    expect(streak(['2025-01-03', '2025-01-01'], '2025-01-03')).toBe(1)
    expect(streak(['2025-01-01'], '2025-01-10')).toBe(0)
  })
})

describe('avgWeeklyChange / goalEta', () => {
  const week = pts(80, 79.9, 79.8, 79.7, 79.6, 79.5, 79.4, 79) // day 0..7, -1 kg
  it('computes per-week rate', () => {
    expect(avgWeeklyChange(week)).toBeCloseTo(-1, 6)
  })
  it('needs at least a week of data', () => {
    expect(avgWeeklyChange(pts(80, 79))).toBeNull()
    expect(goalEta(pts(80, 79), 70, '2025-01-03')).toBeNull()
  })
  it('projects a goal date', () => {
    expect(goalEta(week, 70, '2025-01-08')).toBe(addDays('2025-01-08', 63))
  })
  it('is null when moving away from goal', () => {
    expect(goalEta(pts(79, 79, 79, 79, 79, 79, 79, 80), 70, '2025-01-08')).toBeNull()
  })
})

describe('percentToGoal', () => {
  it('clamps to 0-100', () => {
    expect(percentToGoal(90, 80, 85)).toBe(50)
    expect(percentToGoal(90, 80, 95)).toBe(0)
    expect(percentToGoal(90, 80, 70)).toBe(100)
  })
})

describe('weeklyChanges / paceNote', () => {
  it('returns one bar per week with null for empty weeks', () => {
    const bars = weeklyChanges(pts(80, 80, 80, 80, 80, 80, 80, 79), '2025-01-08', 3)
    expect(bars).toHaveLength(3)
    expect(bars[0].change).toBeNull()
    expect(bars[2].change).toBeCloseTo(-1, 6)
  })
  it('shows a caution when loss is fast for several weeks', () => {
    const w = [-1.4, -1.5, -1.3].map((change, i) => ({ weekStart: String(i), change }))
    expect(paceNote(w, 'kg')?.tone).toBe('caution')
  })
  it('shows a steady note for moderate loss and nothing without data', () => {
    const w = [-0.6, -0.7, -0.5].map((change, i) => ({ weekStart: String(i), change }))
    expect(paceNote(w, 'kg')?.tone).toBe('info')
    expect(paceNote([], 'kg')).toBeNull()
  })
})

describe('inRange', () => {
  it('filters by trailing days', () => {
    const p = pts(80, 79, 78, 77)
    expect(inRange(p, 2, '2025-01-04')).toHaveLength(2)
    expect(inRange(p, null, '2025-01-04')).toHaveLength(4)
  })
})
