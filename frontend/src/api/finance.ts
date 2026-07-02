import { request, tokenStore } from './auth'

export interface Account {
  id: string
  account_name: string
  account_type: string
  institution_name: string | null
  current_balance: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  category_type: string
  color: string | null
}

export interface Tx {
  id: string
  account_id: string
  category_id: string | null
  transaction_type: string
  merchant: string
  description: string | null
  amount: string
  transaction_date: string
}

function authed() {
  return { Authorization: `Bearer ${tokenStore.get()}` }
}

export const financeApi = {
  accounts: () => request<Account[]>('/accounts', { headers: authed() }),
  createAccount: (data: {
    account_name: string
    account_type: string
    current_balance: number
    credit_limit?: number
  }) =>
    request<Account>('/accounts', {
      method: 'POST',
      headers: authed(),
      body: JSON.stringify(data),
    }),
  categories: () => request<Category[]>('/categories', { headers: authed() }),
  transactions: () => request<Tx[]>('/transactions', { headers: authed() }),
  createTransaction: (data: {
    account_id: string
    category_id: string | null
    transaction_type: string
    merchant: string
    description: string | null
    amount: number
    transaction_date: string
  }) =>
    request<Tx>('/transactions', {
      method: 'POST',
      headers: authed(),
      body: JSON.stringify(data),
    }),
  budgets: (month: number, year: number) =>
    request<Budget[]>(`/budgets?month=${month}&year=${year}`, { headers: authed() }),
  setBudget: (data: { category_id: string; month: number; year: number; limit_amount: number }) =>
    request<Budget>('/budgets', {
      method: 'PUT',
      headers: authed(),
      body: JSON.stringify(data),
    }),
  subscriptions: () => request<Sub[]>('/subscriptions', { headers: authed() }),
  createSubscription: (data: {
    name: string
    amount: number
    billing_cycle: string
    next_payment_date: string
    account_id: string
    category_id: string | null
  }) =>
    request<Sub>('/subscriptions', {
      method: 'POST',
      headers: authed(),
      body: JSON.stringify(data),
    }),
  toggleSubscription: (id: string, isActive: boolean) =>
    request<Sub>(`/subscriptions/${id}`, {
      method: 'PATCH',
      headers: authed(),
      body: JSON.stringify({ is_active: isActive }),
    }),
  savingsPlans: () => request<SavingsPlan[]>('/savings/plans', { headers: authed() }),
  createSavingsPlan: (data: {
    name: string
    amount: number
    frequency: string
    next_run_date: string
    from_account_id: string
    to_account_id: string
  }) =>
    request<SavingsPlan>('/savings/plans', {
      method: 'POST',
      headers: authed(),
      body: JSON.stringify(data),
    }),
  toggleSavingsPlan: (id: string, isActive: boolean) =>
    request<SavingsPlan>(`/savings/plans/${id}`, {
      method: 'PATCH',
      headers: authed(),
      body: JSON.stringify({ is_active: isActive }),
    }),
  creditProfiles: () =>
    request<CreditProfile[]>('/credit/profiles', { headers: authed() }),
  createCreditProfile: (accountId: string, creditLimit: number) =>
    request<CreditProfile>('/credit/profile', {
      method: 'POST',
      headers: authed(),
      body: JSON.stringify({ account_id: accountId, credit_limit: creditLimit }),
    }),
}

export interface Budget {
  id: string
  category_id: string
  month: number
  year: number
  limit_amount: string
}

export interface Sub {
  id: string
  name: string
  amount: string
  billing_cycle: string
  next_payment_date: string | null
  is_active: boolean
  account_id: string | null
  category_id: string | null
}

export interface SavingsPlan {
  id: string
  name: string
  amount: string
  frequency: string
  next_run_date: string
  is_active: boolean
  from_account_id: string | null
  to_account_id: string | null
}

export interface CreditProfile {
  id: string
  account_id: string
  account_name: string
  credit_limit: string
  current_balance: string
  utilization: string
}
