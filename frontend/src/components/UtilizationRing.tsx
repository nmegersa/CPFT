import { formatPercent, utilizationLevel } from '../utils/format'

const levelColors = {
  excellent: '#10b981',
  good: '#34d399',
  risky: '#f59e0b',
  high: '#ef4444',
}

interface UtilizationRingProps {
  ratio: number
  size?: number
}

export default function UtilizationRing({ ratio, size = 132 }: UtilizationRingProps) {
  const stroke = 11
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(Math.max(ratio, 0), 1)
  const color = levelColors[utilizationLevel(ratio)]

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.15)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1), stroke 0.3s' }}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-value" style={{ color }}>
          {formatPercent(ratio)}
        </span>
        <span className="ring-label">utilization</span>
      </div>
    </div>
  )
}
