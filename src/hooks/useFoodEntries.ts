import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useUserId } from '../lib/auth'
import type { FoodEntry, Meal } from '../lib/types'

export function useFoodEntries(date: string) {
  const uid = useUserId()
  return useQuery({
    queryKey: ['food', uid, date],
    queryFn: async (): Promise<FoodEntry[]> => {
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', uid)
        .eq('entry_date', date)
        .order('created_at')
      if (error) throw error
      return (data ?? []) as FoodEntry[]
    },
  })
}

/** Last distinct entries (by name + meal) for quick re-adding. */
export function useRecentFood() {
  const uid = useUserId()
  return useQuery({
    queryKey: ['food-recent', uid],
    queryFn: async (): Promise<FoodEntry[]> => {
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(60)
      if (error) throw error
      const seen = new Set<string>()
      const out: FoodEntry[] = []
      for (const r of (data ?? []) as FoodEntry[]) {
        const k = `${r.name.toLowerCase()}|${r.meal}`
        if (seen.has(k)) continue
        seen.add(k)
        out.push(r)
        if (out.length >= 8) break
      }
      return out
    },
  })
}

export interface NewFood {
  entry_date: string
  meal: Meal
  name: string
  calories: number | null
  eaten_at: string | null
  note: string | null
}

export function useAddFood() {
  const uid = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (f: NewFood) => {
      const { error } = await supabase.from('food_entries').insert({ ...f, user_id: uid })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food', uid] })
      qc.invalidateQueries({ queryKey: ['food-recent', uid] })
    },
  })
}

export function useDeleteFood() {
  const uid = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('food_entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food', uid] }),
  })
}
