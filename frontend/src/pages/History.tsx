import { useEffect, useState } from 'react'
import { financeApi, type Tx } from '../api/finance'
import SpendingChart from '../components/SpendingChart'

export default function History() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    financeApi
      .transactions()
      .then(setTxs)
      .catch(() => setError('Could not load spending history. Is the backend running?'))
  }, [])

  return (
    <>
      <div className="page-header">
        <h1>Spending History</h1>
        <span className="subtitle">Daily spending vs. your budgets, month by month</span>
      </div>
      {error && <div className="form-alert error">{error}</div>}
      <div className="stack">
        <SpendingChart txs={txs} />
      </div>
    </>
  )
}
