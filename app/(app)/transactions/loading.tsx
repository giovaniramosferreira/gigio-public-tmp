export default function TransactionsLoading() {
  const pulse = {
    background: 'linear-gradient(90deg, #1e0035 25%, #2a0047 50%, #1e0035 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-shimmer 1.4s infinite',
    borderRadius: 12,
  } as React.CSSProperties

  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...pulse, width: 180, height: 32 }} />
          <div style={{ ...pulse, width: 120, height: 16 }} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ ...pulse, width: 160, height: 38 }} />
          <div style={{ ...pulse, width: 180, height: 38 }} />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ ...pulse, height: 80 }} />
          ))}
        </div>

        {/* Transaction rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{ ...pulse, height: 56, opacity: 1 - i * 0.05 }} />
          ))}
        </div>
      </div>
    </>
  )
}
