import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, authApi, tokenStore, type User } from '../api/auth'
import { LogoutIcon } from '../components/icons'

const OCCUPATION_LABELS: Record<string, string> = {
  student: 'Student',
  worker_employee: 'Worker/Employee',
  intern: 'Intern',
  self_employed: 'Self-Employed',
  unemployed: 'Unemployed',
  other: 'Other',
}

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    authApi
      .me()
      .then((u) => {
        setUser(u)
        setForm({ firstName: u.first_name, lastName: u.last_name, email: u.email })
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          tokenStore.clear()
          navigate('/login')
        } else {
          setLoadFailed(true)
        }
      })
  }, [navigate])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First and last name are required.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setSaving(true)
    try {
      const updated = await authApi.updateMe({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
      })
      setUser(updated)
      setSuccess('Profile updated.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    tokenStore.clear()
    navigate('/login')
  }

  if (loadFailed) {
    return (
      <>
        <div className="page-header">
          <h1>Profile</h1>
        </div>
        <div className="card empty">Could not load your profile. Is the backend running?</div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <div className="page-header">
          <h1>Profile</h1>
        </div>
        <div className="card empty">Loading…</div>
      </>
    )
  }

  const joined = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <div className="page-header">
        <h1>Profile</h1>
        <span className="subtitle">Manage your account</span>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Account details</div>
          <div className="detail-grid">
            <div>
              <div className="detail-label">Name</div>
              <div className="detail-value">
                {user.first_name} {user.last_name}
              </div>
            </div>
            <div>
              <div className="detail-label">Email</div>
              <div className="detail-value">{user.email}</div>
            </div>
            <div>
              <div className="detail-label">Occupation</div>
              <div className="detail-value">
                {OCCUPATION_LABELS[user.occupation] ?? user.occupation}
              </div>
            </div>
            <div>
              <div className="detail-label">Member since</div>
              <div className="detail-value">{joined}</div>
            </div>
          </div>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 22 }}
            onClick={handleLogout}
          >
            <LogoutIcon size={16} />
            Log Out
          </button>
        </div>

        <div className="card">
          <div className="card-title">Edit profile</div>
          {error && <div className="form-alert error">{error}</div>}
          {success && <div className="form-alert success">{success}</div>}
          <form onSubmit={handleSave} noValidate>
            <div className="form-row">
              <div className="field">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
