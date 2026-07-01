import { useMemo, useState } from 'react'
import TransactionRow from '../components/TransactionRow'
import { categories, transactions } from '../data/mockData'

export default function Transactions() {
  const [filter, setFilter] = useState<string>('all')

  const expenseCategories = categories.filter((c) => {
    return transactions.some((t) => t.categoryId === c.id)
  })

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions
    return transactions.filter((t) => t.categoryId === filter)
  }, [filter])

  return (
    <>
      <div className="page-header">
        <h1>Transactions</h1>
        <span className="subtitle">{filtered.length} transactions</span>
      </div>

      <div className="filters">
        <button
          className={`chip${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        {expenseCategories.map((c) => (
          <button
            key={c.id}
            className={`chip${filter === c.id ? ' active' : ''}`}
            onClick={() => setFilter(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty">No transactions in this category.</div>
        ) : (
          filtered.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </div>
    </>
  )
}
