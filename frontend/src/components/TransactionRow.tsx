import type { Transaction } from '../types'
import { getAccount, getCategory } from '../data/mockData'
import { formatCurrency, formatDate } from '../utils/format'

export default function TransactionRow({ tx }: { tx: Transaction }) {
  const category = getCategory(tx.categoryId)
  const account = getAccount(tx.accountId)
  const isIncome = tx.transactionType === 'income' || tx.transactionType === 'refund'
  const color = category?.color ?? '#64748b'

  return (
    <div className="list-item">
      <div
        className="list-icon"
        style={{ background: `${color}22`, color }}
      >
        {(category?.name ?? '?').charAt(0)}
      </div>
      <div className="list-body">
        <div className="list-title">{tx.merchant}</div>
        <div className="list-sub">
          {category?.name} · {account?.accountName} · {formatDate(tx.transactionDate)}
        </div>
      </div>
      <div className={`list-amount${isIncome ? ' income' : ''}`}>
        {isIncome ? '+' : '−'}
        {formatCurrency(tx.amount)}
      </div>
    </div>
  )
}
