import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useUserId } from '../lib/auth'
import type { WaterEntry } from '../lib/types'

export function useWaterEntries(date: string) {
  const uid = useUserId()
  return useQuery({
    queryKey: ['water', uid, date],
    queryFn: async (): Promise<WaterEntry[]> => {
      const { data, error } = await supabase
        .from('water_entries')
        .select('*')
        .eq('user_id', uid)
        .eq('entry_date', date)
        .order('created_at')
      if (error) throw error
      return (data ?? []) as WaterEntry[]
    },
  })
}

export function useAddWater(date: string) {
  const uid = useUserId()
  const qc = useQueryClient()
  const key = ['water', uid, date]
  return useMutation({
    mutationFn: async (ml: number) => {
      const { error } = await supabase.from('water_entries').insert({ user_id: uid, entry_date: date, ml })
      if (error) throw error
    },
    onMutate: async (ml) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<WaterEntry[]>(key)
      qc.setQueryData<WaterEntry[]>(key, [
        ...(prev ?? []),
        { id: 'optimistic-' + Date.now(), user_id: uid, entry_date: date, ml, created_at: new Date().toISOString() },
      ])
      return { prev }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(key, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useUndoWater(date: string) {
  const uid = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('water_entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['water', uid, date] }),
  })
}
