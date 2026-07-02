// Small auth API client. All auth calls to the backend live here.
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  occupation: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

const TOKEN_KEY = 'cpft_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/** Thrown with a message that is always safe to show to the user. */
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const GENERIC_ERROR = 'Something went wrong. Please try again.'

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers: extraHeaders, ...rest } = options
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
    })
  } catch {
    throw new ApiError('Could not reach the server. Is the backend running?', 0)
  }

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // Non-JSON response; fall through to generic handling.
  }

  if (!res.ok) {
    // Session expired: clear the stale token and return to login.
    if (res.status === 401 && tokenStore.get() && path !== '/auth/login') {
      tokenStore.clear()
      window.location.href = '/login'
      throw new ApiError('Your session expired. Please log in again.', 401)
    }
    const detail = (body as { detail?: unknown } | null)?.detail
    let message = GENERIC_ERROR
    if (typeof detail === 'string') {
      message = detail
    } else if (Array.isArray(detail) && detail.length > 0) {
      // FastAPI validation error: turn the first issue into a readable message.
      const first = detail[0] as { loc?: unknown[]; msg?: string }
      const field = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1]) : ''
      message = field ? `${field.replaceAll('_', ' ')}: ${first.msg ?? 'invalid value'}` : (first.msg ?? GENERIC_ERROR)
    }
    throw new ApiError(message, res.status)
  }

  return body as T
}

export const authApi = {
  signup(data: {
    first_name: string
    last_name: string
    email: string
    occupation: string
    password: string
    confirm_password: string
  }) {
    return request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  forgotPassword(email: string) {
    return request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  resetPassword(token: string, password: string, confirmPassword: string) {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password, confirm_password: confirmPassword }),
    })
  },

  me() {
    return request<User>('/auth/me', {
      headers: { Authorization: `Bearer ${tokenStore.get()}` },
    })
  },

  updateMe(data: { first_name: string; last_name: string; email: string }) {
    return request<User>('/auth/me', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenStore.get()}` },
      body: JSON.stringify(data),
    })
  },
}
