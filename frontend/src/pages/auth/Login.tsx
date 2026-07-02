import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, authApi, tokenStore } from '../../api/auth'
import AuthShell from './AuthShell'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.login(email.trim(), password)
      tokenStore.set(res.access_token)
      navigate('/app')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your CPFT dashboard.">
      {error && <div className="form-alert error">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">
            Password
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>
      <div className="auth-links">
        New to CPFT? <Link to="/signup">Create an account</Link>
      </div>
    </AuthShell>
  )
}
