import { useState } from 'react'
import { TEAMS } from './data/teams'
import MatchCard from './components/MatchCard'
import TeamPicker from './components/TeamPicker'

export default function App() {
  const [matchups, setMatchups] = useState([
    { id: 1, home: TEAMS[0], away: TEAMS[5] },
    { id: 2, home: TEAMS[4], away: TEAMS[6] },
  ])

  const update = (id, side, team) =>
    setMatchups(ms => ms.map(m => m.id === id ? { ...m, [side]: team } : m))

  const add = () => {
    if (matchups.length >= 6) return
    setMatchups(ms => [...ms, { id: Date.now(), home: TEAMS[8], away: TEAMS[9] }])
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ background: '#fff', padding: '14px 18px 10px', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#7c3aed', letterSpacing: 1, textTransform: 'uppercase' }}>MARCH MADNESS</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#111', letterSpacing: 1, textTransform: 'uppercase' }}> SIGNALS</span>
          </div>
          <div style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>🏀 NCAA 2026</div>
        </div>
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
          ORtg · DRtg · eFG% · Pace · TS% · TOV% · ORB% · FT Rate + Ajustement blessures
        </div>
      </div>

      <div style={{ padding: '16px 14px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 14, fontWeight: 700 }}>
          PRÉDICTIONS PRÉ-MATCH
        </div>

        {matchups.map(m => (
          <div key={m.id}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <TeamPicker value={m.home} exclude={m.away.abbr} onChange={t => update(m.id, 'home', t)} />
              <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 700 }}>VS</span>
              <TeamPicker value={m.away} exclude={m.home.abbr} onChange={t => update(m.id, 'away', t)} />
              {matchups.length > 1 && (
                <button onClick={() => setMatchups(ms => ms.filter(x => x.id !== m.id))}
                  style={{ background: '#fee2e2', border: 'none', borderRadius: 6, color: '#ef4444', fontSize: 14, fontWeight: 700, width: 30, height: 30, cursor: 'pointer', flexShrink: 0 }}>×</button>
              )}
            </div>
            <MatchCard home={m.home} away={m.away} />
          </div>
        ))}

        {matchups.length < 6 && (
          <button onClick={add} style={{ width: '100%', padding: '13px 0', background: '#fff', border: '2px dashed #d1d5db', borderRadius: 12, color: '#9ca3af', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + Ajouter un matchup
          </button>
        )}
      </div>
    </div>
  )
}
