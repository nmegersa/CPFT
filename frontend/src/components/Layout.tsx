import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { tokenStore } from '../api/auth'
import {
  BankIcon,
  CardIcon,
  ChartIcon,
  ClockIcon,
  CoinIcon,
  DollarIcon,
  HomeIcon,
  ListIcon,
  LogoIcon,
  LogoutIcon,
  MenuIcon,
  RepeatIcon,
  UserIcon,
} from './icons'

const navItems = [
  { to: '/app', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/app/accounts', label: 'Accounts', icon: BankIcon },
  { to: '/app/transactions', label: 'Transactions', icon: ListIcon },
  { to: '/app/payroll', label: 'Payroll', icon: DollarIcon },
  { to: '/app/budgets', label: 'Budgets', icon: ChartIcon },
  { to: '/app/history', label: 'History', icon: ClockIcon },
  { to: '/app/credit', label: 'Credit', icon: CardIcon },
  { to: '/app/subscriptions', label: 'Subscriptions', icon: RepeatIcon },
  { to: '/app/savings', label: 'Savings', icon: CoinIcon },
  { to: '/app/profile', label: 'Profile', icon: UserIcon },
]

// The 4 tabs shown directly in the mobile bottom bar; the rest live in "More".
const PRIMARY = ['/app', '/app/transactions', '/app/budgets', '/app/credit']
const primaryItems = navItems.filter((i) => PRIMARY.includes(i.to))
const moreItems = navItems.filter((i) => !PRIMARY.includes(i.to))

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
  const navigate = useNavigate()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  function handleLogout() {
    tokenStore.clear()
    navigate('/login')
  }

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
        <button className="nav-link logout-btn" onClick={handleLogout}>
          <LogoutIcon size={19} />
          <span>Log Out</span>
        </button>
      </aside>

      <main className="main">
        {/* key remounts the page on route change so the entrance animation replays */}
        <div className="page-anim" key={location.pathname}>
          <Outlet />
        </div>
      </main>

      <nav className="tabbar">
        {primaryItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          className={`nav-link${moreOpen ? ' active' : ''}`}
          onClick={() => setMoreOpen(true)}
        >
          <MenuIcon size={21} />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="sheet-overlay" onClick={() => setMoreOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grid">
              {moreItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `sheet-item${isActive ? ' active' : ''}`}
                  onClick={() => setMoreOpen(false)}
                >
                  <Icon size={22} />
                  <span>{label}</span>
                </NavLink>
              ))}
              <button className="sheet-item" onClick={handleLogout}>
                <LogoutIcon size={22} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
