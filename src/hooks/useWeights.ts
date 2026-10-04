import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useUserId } from '../lib/auth'
import type { WeightEntry } from '../lib/types'

export function useWeights() {
  const uid = useUserId()
  return useQuery({
    queryKey: ['weights', uid],
    queryFn: async (): Promise<WeightEntry[]> => {
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', uid)
        .order('entry_date', { ascending: true })
      if (error) throw error
      return (data ?? []).map((r) => ({ ...r, weight_kg: Number(r.weight_kg) })) as WeightEntry[]
    },
  })
}

/** Upsert on (user_id, entry_date) with an optimistic cache update. */
export function useUpsertWeight() {
  const uid = useUserId()
  const qc = useQueryClient()
  const key = ['weights', uid]
  return useMutation({
    mutationFn: async ({ date, kg }: { date: string; kg: number }) => {
      const { error } = await supabase
        .from('weight_entries')
        .upsert(
          { user_id: uid, entry_date: date, weight_kg: Math.round(kg * 100) / 100 },
          { onConflict: 'user_id,entry_date' },
        )
      if (error) throw error
    },
    onMutate: async ({ date, kg }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<WeightEntry[]>(key)
      const next = (prev ?? []).filter((w) => w.entry_date !== date)
      next.push({ id: 'optimistic-' + date, user_id: uid, entry_date: date, weight_kg: kg, note: null })
      next.sort((a, b) => a.entry_date.localeCompare(b.entry_date))
      qc.setQueryData(key, next)
      return { prev }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(key, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}
