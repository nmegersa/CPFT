import { useMemo, useState } from 'react'
import UtilizationRing from '../components/UtilizationRing'
import { creditProfile, getAccount } from '../data/mockData'
import {
  formatCurrency,
  formatDate,
  formatPercent,
  utilizationLabels,
  utilizationLevel,
  utilizationMessages,
} from '../utils/format'

type SimulationType =
  | 'add_purchase'
  | 'make_payment'
  | 'increase_credit_limit'
  | 'pay_statement_balance'
  | 'pay_minimum_only'

const simulationOptions: { value: SimulationType; label: string; needsAmount: boolean }[] = [
  { value: 'add_purchase', label: 'What if I make a purchase?', needsAmount: true },
  { value: 'make_payment', label: 'What if I make a payment?', needsAmount: true },
  { value: 'increase_credit_limit', label: 'What if my credit limit increases?', needsAmount: true },
  { value: 'pay_statement_balance', label: 'What if I pay my statement balance?', needsAmount: false },
  { value: 'pay_minimum_only', label: 'What if I only pay the minimum?', needsAmount: false },
]

function levelTone(ratio: number): 'good' | 'warning' | 'danger' | 'info' {
  const level = utilizationLevel(ratio)
  if (level === 'excellent' || level === 'good') return 'good'
  if (level === 'risky') return 'warning'
  return 'danger'
}

export default function Credit() {
  const [simType, setSimType] = useState<SimulationType>('add_purchase')
  const [amount, setAmount] = useState<string>('100')

  const account = getAccount(creditProfile.accountId)
  const utilization = creditProfile.currentBalance / creditProfile.creditLimit

  const simulation = useMemo(() => {
    const input = Math.max(parseFloat(amount) || 0, 0)
    let balance = creditProfile.currentBalance
    let limit = creditProfile.creditLimit

    switch (simType) {
      case 'add_purchase':
        balance += input
        break
      case 'make_payment':
        balance = Math.max(balance - input, 0)
        break
      case 'increase_credit_limit':
        limit += input
        break
      case 'pay_statement_balance':
        balance = Math.max(balance - creditProfile.statementBalance, 0)
        break
      case 'pay_minimum_only':
        balance = Math.max(balance - creditProfile.minimumPayment, 0)
        break
    }

    const resulting = limit > 0 ? balance / limit : 0
    const startLabel = formatPercent(utilization)
    const endLabel = formatPercent(resulting)
    const levelName = utilizationLabels[utilizationLevel(resulting)].toLowerCase()
    const direction =
      resulting > utilization ? 'increase' : resulting < utilization ? 'decrease' : 'stay'

    const message =
      direction === 'stay'
        ? `Your utilization would stay at ${endLabel}. ${utilizationMessages[utilizationLevel(resulting)]}`
        : `Your utilization would ${direction} from ${startLabel} to ${endLabel}, which is considered ${levelName}.`

    return { balance, limit, resulting, message }
  }, [simType, amount, utilization])

  const needsAmount =
    simulationOptions.find((o) => o.value === simType)?.needsAmount ?? false

  return (
    <>
      <div className="page-header">
        <h1>Credit Health</h1>
        <span className="subtitle">{account?.accountName}</span>
      </div>

      <div className="stack">
        <div className="grid grid-2">
          <div className="card">
            <div className="card-title">Current utilization</div>
            <div className="ring-wrap">
              <UtilizationRing ratio={utilization} />
              <div style={{ flex: 1, minWidth: 180 }}>
                <span className={`badge ${levelTone(utilization)}`}>
                  {utilizationLabels[utilizationLevel(utilization)]}
                </span>
                <p style={{ marginTop: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  {utilizationMessages[utilizationLevel(utilization)]}
                </p>
              </div>
            </div>
            <div className="detail-grid" style={{ marginTop: 18 }}>
              <div>
                <div className="detail-label">Current balance</div>
                <div className="detail-value">{formatCurrency(creditProfile.currentBalance)}</div>
              </div>
              <div>
                <div className="detail-label">Credit limit</div>
                <div className="detail-value">{formatCurrency(creditProfile.creditLimit)}</div>
              </div>
              <div>
                <div className="detail-label">Statement balance</div>
                <div className="detail-value">{formatCurrency(creditProfile.statementBalance)}</div>
              </div>
              <div>
                <div className="detail-label">APR</div>
                <div className="detail-value">{creditProfile.apr}%</div>
              </div>
              <div>
                <div className="detail-label">Minimum payment</div>
                <div className="detail-value">{formatCurrency(creditProfile.minimumPayment)}</div>
              </div>
              <div>
                <div className="detail-label">Payment due</div>
                <div className="detail-value">{formatDate(creditProfile.paymentDueDate)}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">What-if simulator</div>
            <div className="field">
              <label htmlFor="sim-type">Scenario</label>
              <select
                id="sim-type"
                value={simType}
                onChange={(e) => setSimType(e.target.value as SimulationType)}
              >
                {simulationOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {needsAmount && (
              <div className="field">
                <label htmlFor="sim-amount">Amount</label>
                <input
                  id="sim-amount"
                  type="number"
                  min="0"
                  step="10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            )}

            <div className="sim-compare">
              <div className="sim-box">
                <div className="sim-label">Now</div>
                <div className="sim-value">{formatPercent(utilization)}</div>
              </div>
              <div className="sim-arrow">→</div>
              <div className="sim-box">
                <div className="sim-label">After</div>
                <div
                  className="sim-value"
                  style={{
                    color:
                      levelTone(simulation.resulting) === 'good'
                        ? 'var(--good)'
                        : levelTone(simulation.resulting) === 'warning'
                          ? 'var(--warning)'
                          : 'var(--danger)',
                  }}
                >
                  {formatPercent(simulation.resulting)}
                </div>
              </div>
            </div>

            <div className={`sim-message ${levelTone(simulation.resulting)}`}>
              {simulation.message}
            </div>

            <div className="detail-grid" style={{ marginTop: 16 }}>
              <div>
                <div className="detail-label">Resulting balance</div>
                <div className="detail-value">{formatCurrency(simulation.balance)}</div>
              </div>
              <div>
                <div className="detail-label">Resulting limit</div>
                <div className="detail-value">{formatCurrency(simulation.limit)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
