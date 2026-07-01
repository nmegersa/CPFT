// Mock data shaped like the real API so the UI works before the backend is wired up.
import type {
  Budget,
  Category,
  CreditProfile,
  FinancialAccount,
  Insight,
  Subscription,
  Transaction,
} from '../types'

export const accounts: FinancialAccount[] = [
  {
    id: 'acc-1',
    accountName: 'Chase Checking',
    accountType: 'checking',
    institutionName: 'Chase',
    currentBalance: 1842.55,
  },
  {
    id: 'acc-2',
    accountName: 'Savings',
    accountType: 'savings',
    institutionName: 'Chase',
    currentBalance: 3250.0,
  },
  {
    id: 'acc-3',
    accountName: 'Discover Student Card',
    accountType: 'credit_card',
    institutionName: 'Discover',
    currentBalance: 412.35,
  },
]

export const categories: Category[] = [
  { id: 'cat-food', name: 'Food', categoryType: 'expense', color: '#f59e0b', icon: 'food' },
  { id: 'cat-rent', name: 'Rent', categoryType: 'expense', color: '#8b5cf6', icon: 'home' },
  { id: 'cat-gas', name: 'Gas', categoryType: 'expense', color: '#ef4444', icon: 'fuel' },
  { id: 'cat-school', name: 'School', categoryType: 'expense', color: '#3b82f6', icon: 'book' },
  { id: 'cat-fun', name: 'Entertainment', categoryType: 'expense', color: '#ec4899', icon: 'sparkles' },
  { id: 'cat-shop', name: 'Shopping', categoryType: 'expense', color: '#14b8a6', icon: 'bag' },
  { id: 'cat-subs', name: 'Subscriptions', categoryType: 'expense', color: '#6366f1', icon: 'repeat' },
  { id: 'cat-income', name: 'Income', categoryType: 'income', color: '#10b981', icon: 'cash' },
]

export const budgets: Budget[] = [
  { id: 'bud-1', categoryId: 'cat-food', month: 7, year: 2026, limitAmount: 300 },
  { id: 'bud-2', categoryId: 'cat-rent', month: 7, year: 2026, limitAmount: 850 },
  { id: 'bud-3', categoryId: 'cat-gas', month: 7, year: 2026, limitAmount: 120 },
  { id: 'bud-4', categoryId: 'cat-fun', month: 7, year: 2026, limitAmount: 100 },
  { id: 'bud-5', categoryId: 'cat-shop', month: 7, year: 2026, limitAmount: 150 },
  { id: 'bud-6', categoryId: 'cat-subs', month: 7, year: 2026, limitAmount: 60 },
  { id: 'bud-7', categoryId: 'cat-school', month: 7, year: 2026, limitAmount: 200 },
]

export const transactions: Transaction[] = [
  { id: 'tx-1', accountId: 'acc-1', categoryId: 'cat-income', transactionType: 'income', merchant: 'Campus Bookstore (Payroll)', amount: 450.0, transactionDate: '2026-07-01' },
  { id: 'tx-2', accountId: 'acc-3', categoryId: 'cat-food', transactionType: 'expense', merchant: 'Chipotle', amount: 12.85, transactionDate: '2026-07-01' },
  { id: 'tx-3', accountId: 'acc-1', categoryId: 'cat-rent', transactionType: 'expense', merchant: 'University Housing', amount: 850.0, transactionDate: '2026-07-01' },
  { id: 'tx-4', accountId: 'acc-3', categoryId: 'cat-subs', transactionType: 'expense', merchant: 'Spotify', amount: 10.99, transactionDate: '2026-06-30' },
  { id: 'tx-5', accountId: 'acc-1', categoryId: 'cat-gas', transactionType: 'expense', merchant: 'Shell', amount: 38.4, transactionDate: '2026-06-29' },
  { id: 'tx-6', accountId: 'acc-3', categoryId: 'cat-food', transactionType: 'expense', merchant: 'Trader Joes', amount: 64.2, transactionDate: '2026-06-28' },
  { id: 'tx-7', accountId: 'acc-3', categoryId: 'cat-fun', transactionType: 'expense', merchant: 'AMC Theatres', amount: 24.5, transactionDate: '2026-06-27' },
  { id: 'tx-8', accountId: 'acc-1', categoryId: 'cat-shop', transactionType: 'expense', merchant: 'Target', amount: 47.13, transactionDate: '2026-06-26' },
  { id: 'tx-9', accountId: 'acc-3', categoryId: 'cat-food', transactionType: 'expense', merchant: 'Campus Dining', amount: 9.75, transactionDate: '2026-06-25' },
  { id: 'tx-10', accountId: 'acc-1', categoryId: 'cat-income', transactionType: 'income', merchant: 'Summer Internship', amount: 1200.0, transactionDate: '2026-06-24' },
  { id: 'tx-11', accountId: 'acc-3', categoryId: 'cat-subs', transactionType: 'expense', merchant: 'Netflix', amount: 15.49, transactionDate: '2026-06-23' },
  { id: 'tx-12', accountId: 'acc-1', categoryId: 'cat-school', transactionType: 'expense', merchant: 'University Bookstore', amount: 89.99, transactionDate: '2026-06-22' },
  { id: 'tx-13', accountId: 'acc-3', categoryId: 'cat-fun', transactionType: 'expense', merchant: 'Steam', amount: 29.99, transactionDate: '2026-06-21' },
  { id: 'tx-14', accountId: 'acc-1', categoryId: 'cat-gas', transactionType: 'expense', merchant: 'Costco Gas', amount: 41.2, transactionDate: '2026-06-20' },
  { id: 'tx-15', accountId: 'acc-3', categoryId: 'cat-food', transactionType: 'expense', merchant: 'Chick-fil-A', amount: 11.35, transactionDate: '2026-06-19' },
  { id: 'tx-16', accountId: 'acc-1', categoryId: 'cat-shop', transactionType: 'expense', merchant: 'Amazon', amount: 32.68, transactionDate: '2026-06-18' },
  { id: 'tx-17', accountId: 'acc-3', categoryId: 'cat-food', transactionType: 'expense', merchant: 'Panda Express', amount: 13.4, transactionDate: '2026-06-17' },
  { id: 'tx-18', accountId: 'acc-1', categoryId: 'cat-subs', transactionType: 'expense', merchant: 'iCloud Storage', amount: 2.99, transactionDate: '2026-06-16' },
]

export const subscriptions: Subscription[] = [
  { id: 'sub-1', categoryId: 'cat-subs', name: 'Spotify Premium Student', amount: 10.99, billingCycle: 'monthly', nextPaymentDate: '2026-07-30', isActive: true },
  { id: 'sub-2', categoryId: 'cat-subs', name: 'Netflix', amount: 15.49, billingCycle: 'monthly', nextPaymentDate: '2026-07-23', isActive: true },
  { id: 'sub-3', categoryId: 'cat-subs', name: 'iCloud+ 200GB', amount: 2.99, billingCycle: 'monthly', nextPaymentDate: '2026-07-16', isActive: true },
  { id: 'sub-4', categoryId: 'cat-subs', name: 'Gym Membership', amount: 29.99, billingCycle: 'monthly', nextPaymentDate: '2026-07-05', isActive: true },
  { id: 'sub-5', categoryId: 'cat-subs', name: 'Adobe Creative Cloud (Student)', amount: 19.99, billingCycle: 'monthly', nextPaymentDate: '2026-07-12', isActive: false },
]

export const creditProfile: CreditProfile = {
  id: 'cp-1',
  accountId: 'acc-3',
  creditLimit: 1500,
  currentBalance: 412.35,
  statementBalance: 385.6,
  apr: 27.99,
  minimumPayment: 35,
  paymentDueDate: '2026-07-15',
}

export const insights: Insight[] = [
  {
    id: 'ins-1',
    insightType: 'credit_utilization_warning',
    title: 'Credit utilization is getting high',
    message: 'Your Discover Student Card is at 27.5% utilization. Staying under 30% helps your credit health.',
    severity: 'warning',
  },
  {
    id: 'ins-2',
    insightType: 'spending_trend',
    title: 'Food is your top category',
    message: 'Food is your highest spending category this month at $111.55.',
    severity: 'info',
  },
  {
    id: 'ins-3',
    insightType: 'subscription_summary',
    title: 'Subscriptions add up',
    message: 'Your active subscriptions total $59.46/month — about $713.52 per year.',
    severity: 'info',
  },
]

const categoryById = new Map(categories.map((c) => [c.id, c]))
const accountById = new Map(accounts.map((a) => [a.id, a]))

export function getCategory(id: string): Category | undefined {
  return categoryById.get(id)
}

export function getAccount(id: string): FinancialAccount | undefined {
  return accountById.get(id)
}

/** Total spent per category for the current mock month window. */
export function spentByCategory(): Map<string, number> {
  const totals = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.transactionType !== 'expense') continue
    totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount)
  }
  return totals
}

export function totalIncome(): number {
  return transactions
    .filter((t) => t.transactionType === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
}

export function totalExpenses(): number {
  return transactions
    .filter((t) => t.transactionType === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
}
