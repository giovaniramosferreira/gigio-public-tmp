'use client'

interface FilterProps {
  months: { value: string; label: string }[]
  categories: string[]
  selectedMonth: string
  selectedCategory?: string
}

export default function TransactionFilters({ months, categories, selectedMonth, selectedCategory }: FilterProps) {
  const handleChange = (key: string, value: string) => {
    const url = new URL(window.location.href)
    if (value) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
    window.location.href = url.toString()
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select
        name="month"
        defaultValue={selectedMonth}
        onChange={e => handleChange('month', e.target.value)}
        className="px-4 py-2 rounded-xl text-sm"
        style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.3)', color: '#f0e6ff', fontFamily: 'DM Sans', outline: 'none' }}
      >
        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>

      {categories.length > 0 && (
        <select
          name="category"
          defaultValue={selectedCategory || ''}
          onChange={e => handleChange('category', e.target.value)}
          className="px-4 py-2 rounded-xl text-sm"
          style={{ background: '#150025', border: '1px solid rgba(138,5,190,0.3)', color: '#f0e6ff', fontFamily: 'DM Sans', outline: 'none' }}
        >
          <option value="">Todas categorias</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
    </div>
  )
}
