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
  creditProfiles: () =>
    request<CreditProfile[]>('/credit/profiles', { headers: authed() }),
  createCreditProfile: (accountId: string, creditLimit: number) =>
    request<CreditProfile>('/credit/profile', {
      method: 'POST',
      headers: authed(),
      body: JSON.stringify({ account_id: accountId, credit_limit: creditLimit }),
    }),
}

export interface CreditProfile {
  id: string
  account_id: string
  account_name: string
  credit_limit: string
  current_balance: string
  utilization: string
}
