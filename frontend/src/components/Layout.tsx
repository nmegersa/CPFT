import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
        <Outlet />
      </main>

      <nav className="tabbar">
        <NavLinks iconSize={21} />
      </nav>
    </div>
  )
}
