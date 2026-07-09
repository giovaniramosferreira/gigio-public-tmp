interface Point { x: number; y: number; label: string }

/** Gráfico de linha em SVG puro — carga máxima por sessão. Zero dependências. */
export default function Chart({ data, unit }: { data: { label: string; value: number }[]; unit: string }) {
  if (data.length < 2) return null
  const W = 320
  const H = 140
  const PAD = { l: 34, r: 10, t: 12, b: 22 }
  const vals = data.map((d) => d.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b

  const pts: Point[] = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * iw,
    y: PAD.t + (1 - (d.value - min) / range) * ih,
    label: d.label,
  }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${path} L${pts[pts.length - 1].x},${H - PAD.b} L${pts[0].x},${H - PAD.b} Z`

  return (
    <div className="chart-wrap">
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6e56f8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6e56f8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <text x={2} y={PAD.t + 4}>{max}{unit}</text>
        <text x={2} y={H - PAD.b}>{min}{unit}</text>
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="#262f3d" />
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="#262f3d" />
        <path d={area} fill="url(#cg)" />
        <path d={path} fill="none" stroke="#8f7bff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4.5 : 3} fill={i === pts.length - 1 ? '#f5b942' : '#8f7bff'} />
        ))}
        <text x={pts[0].x} y={H - 6} textAnchor="start">{pts[0].label}</text>
        <text x={pts[pts.length - 1].x} y={H - 6} textAnchor="end">{pts[pts.length - 1].label}</text>
      </svg>
    </div>
  )
}
