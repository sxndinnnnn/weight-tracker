import type { ReactNode } from 'react'

interface Props {
  label: string
  value: ReactNode
  hint?: string
}

export default function StatCard({ label, value, hint }: Props) {
  return (
    <div className="card">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  )
}
