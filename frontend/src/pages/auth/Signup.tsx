import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, authApi, tokenStore } from '../../api/auth'
import AuthShell from './AuthShell'

const OCCUPATIONS = [
  { value: 'student', label: 'Student' },
  { value: 'worker_employee', label: 'Worker/Employee' },
  { value: 'intern', label: 'Intern' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'other', label: 'Other' },
]

const PASSWORD_HINT =
  'Use at least 15 characters. A short passphrase is easier to remember and harder to guess.'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    occupation: 'student',
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!form.firstName.trim()) errors.firstName = 'First name is required.'
    if (!form.lastName.trim()) errors.lastName = 'Last name is required.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.'
    if (form.password.length < 15) errors.password = PASSWORD_HINT
    else if (form.password.length > 64) errors.password = 'Passwords can be at most 64 characters.'
    if (form.confirmPassword !== form.password)
      errors.confirmPassword = 'Passwords do not match.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    try {
      const res = await authApi.signup({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        occupation: form.occupation,
        password: form.password,
        confirm_password: form.confirmPassword,
      })
      tokenStore.set(res.access_token)
      navigate('/app')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free for students and anyone figuring out their finances."
    >
      {error && <div className="form-alert error">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="field">
            <label htmlFor="firstName">First name</label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
            />
            {fieldErrors.firstName && <span className="field-error">{fieldErrors.firstName}</span>}
          </div>
          <div className="field">
            <label htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
            />
            {fieldErrors.lastName && <span className="field-error">{fieldErrors.lastName}</span>}
          </div>
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="occupation">Occupation</label>
          <select
            id="occupation"
            value={form.occupation}
            onChange={(e) => update('occupation', e.target.value)}
          >
            {OCCUPATIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
          />
          {fieldErrors.password ? (
            <span className="field-error">{fieldErrors.password}</span>
          ) : (
            <span className="field-hint">{PASSWORD_HINT}</span>
          )}
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
          />
          {fieldErrors.confirmPassword && (
            <span className="field-error">{fieldErrors.confirmPassword}</span>
          )}
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>
      <div className="auth-links">
        Already have an account? <Link to="/login">Log in</Link>
      </div>
    </AuthShell>
  )
}
