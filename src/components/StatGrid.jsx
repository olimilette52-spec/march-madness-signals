export default function StatGrid({ home, away, hAdj, aAdj }) {
  const rows = [
    { label: 'ORtg',    hv: hAdj.oRtg,   av: aAdj.oRtg,   hO: home.oRtg,   aO: away.oRtg,   fmt: v => v.toFixed(1),       better: 'high' },
    { label: 'DRtg',    hv: hAdj.dRtg,   av: aAdj.dRtg,   hO: home.dRtg,   aO: away.dRtg,   fmt: v => v.toFixed(1),       better: 'low'  },
    { label: 'eFG%',    hv: hAdj.eFG,    av: aAdj.eFG,    hO: home.eFG,    aO: away.eFG,    fmt: v => v.toFixed(1) + '%', better: 'high' },
    { label: 'Pace',    hv: hAdj.pace,   av: aAdj.pace,   hO: home.pace,   aO: away.pace,   fmt: v => v.toFixed(1),       better: null   },
    { label: 'TOV%',    hv: home.tovPct, av: away.tovPct, hO: home.tovPct, aO: away.tovPct, fmt: v => v + '%',            better: 'low'  },
    { label: 'TS%',     hv: home.tsPct,  av: away.tsPct,  hO: home.tsPct,  aO: away.tsPct,  fmt: v => v + '%',            better: 'high' },
    { label: 'ORB%',    hv: home.orbPct, av: away.orbPct, hO: home.orbPct, aO: away.orbPct, fmt: v => v + '%',            better: 'high' },
    { label: 'FT Rate', hv: home.ftRate, av: away.ftRate, hO: home.ftRate, aO: away.ftRate, fmt: v => v + '%',            better: 'high' },
  ]
  return (
    <div style={{ margin: '10px 14px 0', background: '#f9fafb', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', padding: '8px 14px 4px', fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>
        <span>{home.abbr}</span><span style={{ textAlign: 'center' }}>STAT</span><span style={{ textAlign: 'right' }}>{away.abbr}</span>
      </div>
      {rows.map((r, i) => {
        const hBetter  = r.better === null ? null : r.better === 'high' ? r.hv >= r.av : r.hv <= r.av
        const hChanged = Math.abs(r.hv - r.hO) > 0.05
        const aChanged = Math.abs(r.av - r.aO) > 0.05
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', padding: '7px 14px', borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: hBetter === true ? '#10b981' : hBetter === false ? '#ef4444' : '#374151' }}>
              {r.fmt(r.hv)}{hChanged && <span style={{ fontSize: 9, color: '#ef4444', marginLeft: 3 }}>▼</span>}
            </span>
            <span style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#9ca3af' }}>{r.label}</span>
            <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 800, color: hBetter === false ? '#10b981' : hBetter === true ? '#ef4444' : '#374151' }}>
              {aChanged && <span style={{ fontSize: 9, color: '#ef4444', marginRight: 3 }}>▼</span>}{r.fmt(r.av)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
