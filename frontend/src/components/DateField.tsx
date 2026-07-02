interface Props {
  label?: string
  value: string
  onChange: (value: string) => void
  id?: string
}

export default function DateField({ label = 'Date', value, onChange, id = 'date' }: Props) {
  const display = value
    ? new Date(value + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  return (
    <div className="field date-field">
      <label htmlFor={id}>{label}</label>
      <div className="date-input-wrap">
        <input
          id={id}
          type="date"
          className="date-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {display && (
        <span className="date-hint">
          {display}
          {value === new Date().toISOString().slice(0, 10) ? ' · Today' : ''}
        </span>
      )}
    </div>
  )
}
