import { useEffect, useMemo, useState } from 'react'
import { financeApi, type Tx } from '../api/finance'
import { formatCurrency } from '../utils/format'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const W = 680
const H = 240
const PAD = { top: 12, right: 16, bottom: 26, left: 56 }

export default function SpendingChart({ txs }: { txs: Tx[] }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [budgetTotal, setBudgetTotal] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    financeApi
      .budgets(month, year)
      .then((rows) => setBudgetTotal(rows.reduce((s, b) => s + Number(b.limit_amount), 0)))
      .catch(() => setBudgetTotal(0))
  }, [month, year])

  const years = useMemo(() => {
    const ys = new Set<number>([now.getFullYear()])
    txs.forEach((t) => ys.add(Number(t.transaction_date.slice(0, 4))))
    return [...ys].sort((a, b) => b - a)
  }, [txs]) // eslint-disable-line react-hooks/exhaustive-deps

  const daysInMonth = new Date(year, month, 0).getDate()

  // Cumulative spending per day of the selected month.
  const { daily, cumulative } = useMemo(() => {
    const daily = new Array(daysInMonth).fill(0)
    txs.forEach((t) => {
      if (t.transaction_type !== 'expense' && t.transaction_type !== 'fee') return
      const [y, m, d] = t.transaction_date.split('-').map(Number)
      if (y === year && m === month) daily[d - 1] += Number(t.amount)
    })
    const cumulative: number[] = []
    daily.reduce((s: number, v: number, i: number) => (cumulative[i] = s + v), 0)
    return { daily, cumulative }
  }, [txs, month, year, daysInMonth])

  const totalSpent = cumulative[daysInMonth - 1] ?? 0
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear()
  const lastDay = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth

  const yMax = Math.max(budgetTotal * 1.2, totalSpent * 1.1, 100)
  const x = (day: number) => PAD.left + ((day - 1) / (daysInMonth - 1)) * (W - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + (1 - v / yMax) * (H - PAD.top - PAD.bottom)

  const points = cumulative.slice(0, lastDay).map((v, i) => `${x(i + 1)},${y(v)}`).join(' ')

  // Zone boundaries (only when a budget exists): green < 80%, yellow 80–100%, red above.
  const warnY = y(budgetTotal * 0.8)
  const limitY = y(budgetTotal)
  const bottom = H - PAD.bottom

  const status =
    budgetTotal === 0 ? null : totalSpent >= budgetTotal ? 'red' : totalSpent >= budgetTotal * 0.8 ? 'yellow' : 'green'
  const lineColor = status === 'red' ? '#ef4444' : status === 'yellow' ? '#eab308' : '#34d399'

  return (
    <div className="card">
      <div className="card-title" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span>Spending History</span>
        <span style={{ display: 'flex', gap: 8 }}>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="chart-select">
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="chart-select">
            {years.map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </span>
      </div>

      <div className="chart-meta">
        <span>
          Spent in {MONTHS[month - 1]}: <strong style={{ color: lineColor }}>{formatCurrency(totalSpent)}</strong>
        </span>
        {budgetTotal > 0 ? (
          <span className="muted">Budget: {formatCurrency(budgetTotal)}</span>
        ) : (
          <span className="muted">No budgets set for this month</span>
        )}
        {hover !== null && (
          <span className="muted">
            {MONTHS[month - 1].slice(0, 3)} {hover + 1}: {formatCurrency(daily[hover])} spent · {formatCurrency(cumulative[hover])} total
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} onMouseLeave={() => setHover(null)}>
        {budgetTotal > 0 && (
          <>
            <rect x={PAD.left} y={Math.max(warnY, PAD.top)} width={W - PAD.left - PAD.right} height={Math.max(bottom - Math.max(warnY, PAD.top), 0)} fill="#34d399" opacity="0.07" />
            <rect x={PAD.left} y={Math.max(limitY, PAD.top)} width={W - PAD.left - PAD.right} height={Math.max(Math.max(warnY, PAD.top) - Math.max(limitY, PAD.top), 0)} fill="#eab308" opacity="0.09" />
            <rect x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={Math.max(Math.max(limitY, PAD.top) - PAD.top, 0)} fill="#ef4444" opacity="0.08" />
            <line x1={PAD.left} x2={W - PAD.right} y1={limitY} y2={limitY} stroke="#ef4444" strokeDasharray="5 4" strokeWidth="1" opacity="0.6" />
            <text x={W - PAD.right - 4} y={limitY - 5} textAnchor="end" fontSize="10" fill="#ef4444" opacity="0.8">budget {formatCurrency(budgetTotal)}</text>
          </>
        )}

        {/* y-axis labels */}
        {[0, 0.5, 1].map((f) => (
          <text key={f} x={PAD.left - 8} y={y(yMax * f) + 4} textAnchor="end" fontSize="10" fill="var(--text-dim, #94a3b8)">
            {formatCurrency(yMax * f)}
          </text>
        ))}
        {/* x-axis day labels */}
        {[1, Math.ceil(daysInMonth / 2), daysInMonth].map((d) => (
          <text key={d} x={x(d)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--text-dim, #94a3b8)">
            {MONTHS[month - 1].slice(0, 3)} {d}
          </text>
        ))}

        <line x1={PAD.left} x2={W - PAD.right} y1={bottom} y2={bottom} stroke="var(--border-strong, #334155)" strokeWidth="1" />

        {points && (
          <>
            <polyline points={points} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={x(lastDay)} cy={y(cumulative[lastDay - 1])} r="4" fill={lineColor} />
          </>
        )}

        {/* hover targets */}
        {Array.from({ length: lastDay }, (_, i) => (
          <rect
            key={i}
            x={x(i + 1) - (W - PAD.left - PAD.right) / daysInMonth / 2}
            y={PAD.top}
            width={(W - PAD.left - PAD.right) / daysInMonth}
            height={H - PAD.top - PAD.bottom}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
        {hover !== null && hover < lastDay && (
          <>
            <line x1={x(hover + 1)} x2={x(hover + 1)} y1={PAD.top} y2={bottom} stroke="var(--text-dim, #94a3b8)" strokeWidth="1" opacity="0.4" />
            <circle cx={x(hover + 1)} cy={y(cumulative[hover])} r="4" fill="none" stroke={lineColor} strokeWidth="2" />
          </>
        )}
      </svg>

      {budgetTotal > 0 && (
        <div className="chart-legend">
          <span><i style={{ background: '#34d399' }} /> Within budget</span>
          <span><i style={{ background: '#eab308' }} /> Approaching limit</span>
          <span><i style={{ background: '#ef4444' }} /> At or over budget</span>
        </div>
      )}
    </div>
  )
}
