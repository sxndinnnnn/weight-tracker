import { NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

const icon = (d: ReactNode) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)

const tabs = [
  { to: '/', label: 'Today', end: true, icon: icon(<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>) },
  { to: '/log', label: 'Log', end: false, icon: icon(<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>) },
  { to: '/progress', label: 'Progress', end: false, icon: icon(<path d="M3 17l6-6 4 4 8-8M15 7h6v6" />) },
]

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
    isActive ? 'text-primary' : 'text-muted'
  }`

export default function BottomNav() {
  const nav = useNavigate()
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex h-nav max-w-[480px] items-center lg:max-w-3xl">
        <NavLink to={tabs[0].to} end className={linkCls}>{tabs[0].icon}{tabs[0].label}</NavLink>
        <NavLink to={tabs[1].to} className={linkCls}>{tabs[1].icon}{tabs[1].label}</NavLink>
        <div className="flex flex-1 justify-center">
          <button
            aria-label="Add entry"
            onClick={() => nav('/add')}
            className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg ring-4 ring-bg hover:brightness-90"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
        <NavLink to={tabs[2].to} className={linkCls}>{tabs[2].icon}{tabs[2].label}</NavLink>
        <div className="flex-1" aria-hidden="true" />
      </div>
    </nav>
  )
}
