interface Props {
  value: number
  max: number
  color?: string
  label: string
}

export default function ProgressBar({ value, max, color = '#0F766E', label }: Props) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      className="h-2.5 w-full overflow-hidden rounded-full bg-line"
    >
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}
