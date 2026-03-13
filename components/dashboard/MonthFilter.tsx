'use client'

interface MonthFilterProps {
  months: { value: string; label: string }[]
  selected: string
}

export default function MonthFilter({ months, selected }: MonthFilterProps) {
  const handleChange = (value: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('month', value)
    window.location.href = url.toString()
  }

  return (
    <select
      value={selected}
      onChange={e => handleChange(e.target.value)}
      className="px-4 py-2 rounded-xl text-sm"
      style={{
        background: '#150025',
        border: '1px solid rgba(138,5,190,0.3)',
        color: '#f0e6ff',
        fontFamily: 'DM Sans',
        outline: 'none',
      }}
    >
      {months.map(m => (
        <option key={m.value} value={m.value}>{m.label}</option>
      ))}
    </select>
  )
}
