export default function DashboardLoading() {
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

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ ...pulse, width: 160, height: 32 }} />
            <div style={{ ...pulse, width: 220, height: 16 }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ ...pulse, width: 120, height: 36 }} />
            <div style={{ ...pulse, width: 160, height: 36 }} />
          </div>
        </div>

        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ ...pulse, height: 96 }} />
            ))}
          </div>

          {/* Story card */}
          <div style={{ ...pulse, height: 80 }} />

          {/* Line chart */}
          <div style={{ ...pulse, height: 220 }} />

          {/* Bottom row */}
          <div className="grid md:grid-cols-2 gap-6">
            <div style={{ ...pulse, height: 300 }} />
            <div style={{ ...pulse, height: 300 }} />
          </div>
        </div>
      </div>
    </>
  )
}
