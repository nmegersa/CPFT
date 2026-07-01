// Types mirror the MVP tables in docs/database-design.md.

export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'cash'
  | 'investment'
  | 'student_loan'
  | 'other'

export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'credit_card_payment'
  | 'refund'
  | 'fee'

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'

export type Severity = 'info' | 'success' | 'warning' | 'danger'

export interface FinancialAccount {
  id: string
  accountName: string
  accountType: AccountType
  institutionName: string
  currentBalance: number
}

export interface Category {
  id: string
  name: string
  categoryType: 'income' | 'expense' | 'transfer' | 'debt_payment' | 'savings'
  color: string
  icon: string
}

export interface Transaction {
  id: string
  accountId: string
  categoryId: string
  transactionType: TransactionType
  merchant: string
  description?: string
  amount: number
  transactionDate: string
}

export interface Budget {
  id: string
  categoryId: string
  month: number
  year: number
  limitAmount: number
}

export interface Subscription {
  id: string
  categoryId: string
  name: string
  amount: number
  billingCycle: BillingCycle
  nextPaymentDate: string
  isActive: boolean
}

export interface CreditProfile {
  id: string
  accountId: string
  creditLimit: number
  currentBalance: number
  statementBalance: number
  apr: number
  minimumPayment: number
  paymentDueDate: string
}

export interface Insight {
  id: string
  insightType: string
  title: string
  message: string
  severity: Severity
}
