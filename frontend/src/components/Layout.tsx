import { NavLink, Outlet } from 'react-router-dom'
import { useAppStore } from '../stores/useAppStore'

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'D' },
  { to: '/quests', label: 'Quests', icon: 'Q' },
  { to: '/quests/new', label: 'New Quest', icon: '+' },
  { to: '/campaign', label: 'Campaign', icon: 'C' },
  { to: '/attributes', label: 'Attributes', icon: 'A' },
  { to: '/weekly', label: 'Weekly', icon: 'W' },
  { to: '/settings', label: 'Settings', icon: 'S' },
]

export function Layout() {
  const settings = useAppStore((state) => state.settings)
  const profile = useAppStore((state) => state.profile)

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-[72px] flex-col border-r border-border bg-bg-surface md:w-[220px]">
        <div className="flex h-20 items-center border-b border-border px-4">
          <div className="min-w-0">
            <p className="truncate font-mono text-lg font-bold text-text-primary md:text-xl">
              <span className="md:hidden">{settings?.app_name?.slice(0, 1) ?? 'A'}</span>
              <span className="hidden md:inline">{settings?.app_name ?? 'Arise'}</span>
            </p>
            <p className="hidden truncate text-xs text-text-muted md:block">
              {settings?.system_name ?? 'The System'}
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex h-11 items-center gap-3 rounded-md px-3 font-mono text-sm transition',
                  isActive
                    ? 'bg-primary text-white shadow-[0_0_24px_rgba(124,58,237,0.25)]'
                    : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary',
                ].join(' ')
              }
              title={item.label}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded border border-border text-xs">
                {item.icon}
              </span>
              <span className="hidden md:inline">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="pl-[72px] md:pl-[220px]">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-end border-b border-border bg-bg-base/90 px-4 backdrop-blur md:px-8">
          <div className="flex flex-wrap justify-end gap-3 text-right font-mono text-sm">
            <span className="text-text-primary">{profile?.display_name ?? 'Hunter'}</span>
            <span className="text-gold">{profile?.gold ?? 0} Gold</span>
            <span className="text-primary">{profile?.total_xp ?? 0} XP</span>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)] px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
