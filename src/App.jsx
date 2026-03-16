import { useState } from 'react'
import { TEAMS, MATCHUPS } from './data/teams'
import MatchCard from './components/MatchCard'
import TeamPicker from './components/TeamPicker'

export default function App() {
  const [tab, setTab] = useState('bracket')
  const [custom, setCustom] = useState([
    { id: 1, home: TEAMS[0], away: TEAMS[2] },
  ])

  const getTeam = abbr => TEAMS.find(t => t.abbr === abbr)

  const update = (id, side, team) =>
    setCustom(ms => ms.map(m => m.id === id ? { ...m, [side]: team } : m))

  const add = () => {
    if (custom.length >= 6) return
    setCustom(ms => [...ms, { id: Date.now(), home: TEAMS[0], away: TEAMS[5] }])
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ background: '#fff', padding: '14px 18px 0', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#7c3aed', letterSpacing: 1, textTransform: 'uppercase' }}>MARCH MADNESS</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#111', letterSpacing: 1, textTransform: 'uppercase' }}> SIGNALS</span>
          </div>
          <div style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>🏀 NCAA 2026</div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {['bracket', 'custom'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px 0', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid #7c3aed' : '2px solid transparent',
              color: tab === t ? '#7c3aed' : '#9ca3af',
              fontSize: 12, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1
            }}>
              {t === 'bracket' ? '🏆 Bracket 2026' : '⚙️ Personnalisé'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 14px', maxWidth: 480, margin: '0 auto' }}>

        {/* BRACKET TAB */}
        {tab === 'bracket' && (
          <>
            {['East', 'West', 'South', 'Midwest'].map(region => (
              <div key={region}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 10, fontWeight: 800, marginTop: 8 }}>
                  📍 Région {region}
                </div>
                {MATCHUPS.filter(m => m.region === region).map(m => {
                  const home = getTeam(m.home)
                  const away = getTeam(m.away)
                  if (!home || !away) return null
                  return (
                    <div key={m.id}>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6 }}>{m.time}</div>
                      <MatchCard home={home} away={away} />
                    </div>
                  )
                })}
              </div>
            ))}
          </>
        )}

        {/* CUSTOM TAB */}
        {tab === 'custom' && (
          <>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 14, fontWeight: 700 }}>
              PRÉDICTIONS PERSONNALISÉES
            </div>
            {custom.map(m => (
              <div key={m.id}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                  <TeamPicker value={m.home} exclude={m.away.abbr} onChange={t => update(m.id, 'home', t)} />
                  <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 700 }}>VS</span>
                  <TeamPicker value={m.away} exclude={m.home.abbr} onChange={t => update(m.id, 'away', t)} />
                  {custom.length > 1 && (
                    <button onClick={() => setCustom(ms => ms.filter(x => x.id !== m.id))}
                      style={{ background: '#fee2e2', border: 'none', borderRadius: 6, color: '#ef4444', fontSize: 14, fontWeight: 700, width: 30, height: 30, cursor: 'pointer', flexShrink: 0 }}>×</button>
                  )}
                </div>
                <MatchCard home={m.home} away={m.away} />
              </div>
            ))}
            {custom.length < 6 && (
              <button onClick={add} style={{ width: '100%', padding: '13px 0', background: '#fff', border: '2px dashed #d1d5db', borderRadius: 12, color: '#9ca3af', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                + Ajouter un matchup
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
