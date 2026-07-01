import { NavLink, Outlet } from 'react-router-dom'
import { CardIcon, ChartIcon, HomeIcon, ListIcon, LogoIcon, RepeatIcon } from './icons'

const navItems = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/budgets', label: 'Budgets', icon: ChartIcon },
  { to: '/transactions', label: 'Transactions', icon: ListIcon },
  { to: '/credit', label: 'Credit', icon: CardIcon },
  { to: '/subscriptions', label: 'Subscriptions', icon: RepeatIcon },
]

function NavLinks({ iconSize }: { iconSize: number }) {
  return (
    <>
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <Icon size={iconSize} />
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  )
}

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <LogoIcon />
          </div>
          <div>
            CPFT
            <small>Personal Finances</small>
          </div>
        </div>
        <NavLinks iconSize={19} />
      </aside>

      <main className="main">
        <Outlet />
      </main>

      <nav className="tabbar">
        <NavLinks iconSize={21} />
      </nav>
    </div>
  )
}
