import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useUserId } from '../lib/auth'
import type { Profile } from '../lib/types'

export function useProfile() {
  const uid = useUserId()
  return useQuery({
    queryKey: ['profile', uid],
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
      if (error) throw error
      if (data) return data as Profile
      // The sign-up trigger should have made this row; create it if missing.
      const ins = await supabase.from('profiles').insert({ id: uid }).select('*').single()
      if (ins.error) throw ins.error
      return ins.data as Profile
    },
  })
}

export function useUpdateProfile() {
  const uid = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Omit<Profile, 'id'>>) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', uid)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', uid] }),
  })
}
