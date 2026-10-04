import { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useUpsertWeight, useWeights } from '../hooks/useWeights'
import { useDeleteFood, useFoodEntries } from '../hooks/useFoodEntries'
import { useAddWater, useUndoWater, useWaterEntries } from '../hooks/useWaterEntries'
import { todayStr } from '../lib/metrics'
import type { Meal } from '../lib/types'
import DateStrip from '../components/DateStrip'
import WeightStepper from '../components/WeightStepper'
import MealSection from '../components/MealSection'
import ProgressBar from '../components/ProgressBar'
import { ErrorBox, PageHeader, Spinner } from '../components/ui'

const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack']

export default function Log() {
  const [date, setDate] = useState(todayStr())
  const profile = useProfile()
  const weights = useWeights()
  const food = useFoodEntries(date)
  const water = useWaterEntries(date)
  const upsert = useUpsertWeight()
  const delFood = useDeleteFood()
  const addWater = useAddWater(date)
  const undoWater = useUndoWater(date)

  if (profile.isLoading || weights.isLoading)
    return <><PageHeader title="Log" /><Spinner /></>
  if (profile.error || weights.error)
    return <><PageHeader title="Log" /><ErrorBox error={profile.error ?? weights.error} onRetry={() => { profile.refetch(); weights.refetch() }} /></>

  const unit = profile.data!.unit
  const all = weights.data ?? []
  const saved = all.find((w) => w.entry_date === date)?.weight_kg ?? null
  const before = [...all].reverse().find((w) => w.entry_date < date)?.weight_kg ?? null
  const startKg = before ?? profile.data!.start_weight_kg

  const entries = food.data ?? []
  const ml = (water.data ?? []).reduce((s, w) => s + w.ml, 0)
  const target = profile.data!.daily_water_target_ml
  const drinks = entries.filter((e) => e.meal === 'drink')

  return (
    <>
      <PageHeader title="Log" />
      <div className="space-y-4 lg:mx-auto lg:max-w-xl">
        <DateStrip selected={date} onSelect={setDate} />

        <WeightStepper
          key={date}
          savedKg={saved}
          startKg={startKg}
          previousKg={before}
          unit={unit}
          onSave={(kg) => upsert.mutate({ date, kg })}
        />
        {upsert.isError && <p role="alert" className="text-sm font-medium text-accent">Couldn't save weight. Try again.</p>}

        <h2 className="pt-2 text-lg">Food &amp; drink</h2>
        {food.isLoading && <Spinner />}
        {food.error && <ErrorBox error={food.error} onRetry={() => food.refetch()} />}
        {!food.isLoading && !food.error && (
          <>
            {MEALS.map((m) => (
              <MealSection key={m} meal={m} date={date} entries={entries.filter((e) => e.meal === m)} onDelete={(id) => delFood.mutate(id)} />
            ))}
            {drinks.length > 0 && (
              <MealSection meal="drink" date={date} entries={drinks} onDelete={(id) => delFood.mutate(id)} />
            )}
          </>
        )}

        <section className="card" aria-label="Water">
          <div className="flex items-center justify-between">
            <h2 className="text-base">Water</h2>
            <span className="text-sm font-semibold text-water">{ml} / {target} ml</span>
          </div>
          <div className="mt-3"><ProgressBar label="Water" value={ml} max={target} color="#1D4ED8" /></div>
          <div className="mt-3 flex gap-2">
            <button className="btn flex-1 bg-water text-white hover:brightness-90" onClick={() => addWater.mutate(250)}>+250 ml</button>
            <button className="btn flex-1 bg-water text-white hover:brightness-90" onClick={() => addWater.mutate(500)}>+500 ml</button>
            <button
              className="btn bg-bg text-muted border border-line"
              aria-label="Undo last water entry"
              disabled={!water.data?.length}
              onClick={() => { const last = water.data?.at(-1); if (last && !last.id.startsWith('optimistic')) undoWater.mutate(last.id) }}
            >
              Undo
            </button>
          </div>
          {addWater.isError && <p role="alert" className="mt-2 text-sm text-accent">Couldn't add water. Try again.</p>}
        </section>
      </div>
    </>
  )
}
