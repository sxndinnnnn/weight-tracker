import { addDays, parseDate, todayStr } from '../lib/metrics'

interface Props {
  selected: string
  onSelect: (d: string) => void
}

export default function DateStrip({ selected, onSelect }: Props) {
  const today = todayStr()
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
  return (
    <div role="tablist" aria-label="Select day" className="flex gap-2 overflow-x-auto pb-1">
      {days.map((d) => {
        const dt = parseDate(d)
        const active = d === selected
        return (
          <button
            key={d}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(d)}
            className={`flex min-h-[64px] min-w-[48px] flex-1 flex-col items-center justify-center rounded-2xl border text-sm ${
              active ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-ink'
            }`}
          >
            <span className={`text-xs ${active ? 'text-white' : 'text-muted'}`}>
              {dt.toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
            <span className="font-heading text-lg font-bold">{dt.getDate()}</span>
          </button>
        )
      })}
    </div>
  )
}
