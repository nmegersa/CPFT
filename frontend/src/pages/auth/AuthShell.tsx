import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LogoIcon } from '../../components/icons'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
}

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          <div className="brand-mark">
            <LogoIcon size={15} />
          </div>
          CPFT
        </Link>
        <h1>{title}</h1>
        <p className="auth-sub">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}
