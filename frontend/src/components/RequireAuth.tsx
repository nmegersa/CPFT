import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { tokenStore } from '../api/auth'

/** Redirects to /login when no auth token is present. */
export default function RequireAuth({ children }: { children: ReactNode }) {
  if (!tokenStore.get()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
