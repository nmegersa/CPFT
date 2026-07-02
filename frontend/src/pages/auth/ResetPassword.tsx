import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError, authApi } from '../../api/auth'
import AuthShell from './AuthShell'

const PASSWORD_HINT =
  'Use at least 15 characters. A short passphrase is easier to remember and harder to guess.'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 15) {
      setError(PASSWORD_HINT)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.resetPassword(token, password, confirmPassword)
      setMessage(res.message)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This reset link is missing its token.">
        <div className="auth-links">
          <Link to="/forgot-password">Request a new reset link</Link>
        </div>
      </AuthShell>
    )
  }

  if (message) {
    return (
      <AuthShell title="Password updated" subtitle="You're all set.">
        <div className="form-alert success">{message}</div>
        <Link to="/login" className="btn btn-primary btn-block">
          Go to log in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Choose a new password" subtitle={PASSWORD_HINT}>
      {error && <div className="form-alert error">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthShell>
  )
}
