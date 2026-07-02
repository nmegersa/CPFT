import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, authApi } from '../../api/auth'
import AuthShell from './AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.forgotPassword(email.trim())
      setMessage(res.message)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you reset instructions."
    >
      {message && <div className="form-alert success">{message}</div>}
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
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset instructions'}
        </button>
      </form>
      <div className="auth-links">
        Remembered it? <Link to="/login">Back to log in</Link>
      </div>
    </AuthShell>
  )
}
