import { useState } from 'react'
import InjuryPanel from './InjuryPanel'
import StatGrid from './StatGrid'
import { predictAdvanced } from '../model/predict'
import { analyzeMatchup } from '../api/claude'

const TeamLogo = ({ team }) => (
  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
    {team.logo
      ? <img src={team.logo} alt={team.abbr} style={{ width: 36, height: 36, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
      : <span style={{ fontSize: 22 }}>{team.emoji || '🏀'}</span>
    }
  </div>
)

export default function MatchCard({ home, away, vegasSpread, vegasTotal }) {
  const [homeInj,   setHomeInj]   = useState([])
  const [awayInj,   setAwayInj]   = useState([])
  const [showInj,   setShowInj]   = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [aiText,    setAiText]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const pred = predictAdvanced(home, away, homeInj, awayInj, vegasSpread, vegasTotal)
  const { hAdj, aAdj } = pred

  const hasVegas   = vegasSpread !== undefined && vegasTotal !== undefined
  const vegasFav   = hasVegas && vegasSpread <= 0 ? home : away
  const vegasDog   = vegasFav.abbr === home.abbr ? away : home
  const absSpread  = Math.abs(vegasSpread || 0).toFixed(1)

  const hNet = hAdj.oRtg - hAdj.dRtg
  const aNet = aAdj.oRtg - aAdj.dRtg
  const totalInj = homeInj.length + awayInj.length

  const handleAnalyze = async () => {
    setLoading(true); setAiText(null); setError(null)
    try {
      const text = await analyzeMatchup(home, away, pred, homeInj, awayInj, vegasSpread, vegasTotal)
      setAiText(text)
    } catch {
      setError('Erreur API. Vérifie VITE_ANTHROPIC_API_KEY dans Vercel.')
    }
    setLoading(false)
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

      {/* Teams */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TeamLogo team={home} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>{home.abbr}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280' }}>#{home.seed}</span>
              {homeInj.length > 0 && <span style={{ fontSize: 10, background: '#fee2e2', color: '#ef4444', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>🚑{homeInj.length}</span>}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>L10: {home.last10W}-{home.last10L} · {home.conf}</div>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#374151', letterSpacing: 1 }}>VS</div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>NCAA 2026</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'row-reverse' }}>
          <TeamLogo team={away} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              {awayInj.length > 0 && <span style={{ fontSize: 10, background: '#fee2e2', color: '#ef4444', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>🚑{awayInj.length}</span>}
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280' }}>#{away.seed}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>{away.abbr}</span>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>L10: {away.last10W}-{away.last10L} · {away.conf}</div>
          </div>
        </div>
      </div>

      {/* Vegas Lines */}
      {hasVegas && (
        <div style={{ margin: '0 14px', background: '#1e1b4b', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#a5b4fc', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>🎰 LIGNES VEGAS (DraftKings)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', gap: 0 }}>
            <div style={{ textAlign: 'center', paddingRight: 8 }}>
              <div style={{ fontSize: 9, color: '#a5b4fc', marginBottom: 4 }}>FAVORI</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>{vegasFav.abbr}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>{vegasSpread}</div>
            </div>
            <div style={{ background: '#312e81' }} />
            <div style={{ textAlign: 'center', padding: '0 8px' }}>
              <div style={{ fontSize: 9, color: '#a5b4fc', marginBottom: 4 }}>TOTAL O/U</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>{vegasTotal}</div>
              <div style={{ fontSize: 10, color: '#a5b4fc' }}>pts combinés</div>
            </div>
            <div style={{ background: '#312e81' }} />
            <div style={{ textAlign: 'center', paddingLeft: 8 }}>
              <div style={{ fontSize: 9, color: '#a5b4fc', marginBottom: 4 }}>OUTSIDER</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>{vegasDog.abbr}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>+{absSpread}</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', margin: '10px 14px 0', borderRadius: 12, padding: '12px 16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>STATS {home.abbr}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{hAdj.oRtg.toFixed(1)}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>DRtg {hAdj.dRtg.toFixed(1)}</div>
          <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: hNet >= 0 ? '#10b981' : '#ef4444' }}>NET {hNet >= 0 ? '+' : ''}{hNet.toFixed(1)}</div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>eFG% {hAdj.eFG.toFixed(1)} · 4F {pred.hFF}</div>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>Pace {hAdj.pace.toFixed(1)} · TOV {hAdj.tovPct}%</div>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>CONFIANCE</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: pred.confidence.includes('ÉLEVÉE') ? '#10b981' : pred.confidence.includes('MOYENNE') ? '#f59e0b' : '#ef4444' }}>
            {pred.confidence}
          </div>
          <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 8, textTransform: 'uppercase' }}>PROB VICTOIRE</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#7c3aed', marginTop: 2 }}>{pred.winProb}%</div>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>{home.abbr}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>STATS {away.abbr}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{aAdj.oRtg.toFixed(1)}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>DRtg {aAdj.dRtg.toFixed(1)}</div>
          <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: aNet >= 0 ? '#10b981' : '#ef4444' }}>NET {aNet >= 0 ? '+' : ''}{aNet.toFixed(1)}</div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>eFG% {aAdj.eFG.toFixed(1)} · 4F {pred.aFF}</div>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>Pace {aAdj.pace.toFixed(1)} · TOV {aAdj.tovPct}%</div>
        </div>
      </div>

      {/* RECOMMANDATIONS PRINCIPALES */}
      <div style={{ margin: '10px 14px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

        {/* Spread */}
        <div style={{
          background: pred.favCovers ? '#f0fdf4' : '#fff7ed',
          border: `2px solid ${pred.favCovers ? '#10b981' : '#f59e0b'}`,
          borderRadius: 12, padding: '12px 14px', textAlign: 'center'
        }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>📊 SPREAD</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: pred.favCovers ? '#065f46' : '#92400e' }}>
            {pred.favCovers
              ? `${vegasFav.abbr} ${vegasSpread}`
              : `${vegasDog.abbr} +${absSpread}`
            }
          </div>
          <div style={{ fontSize: 11, color: pred.favCovers ? '#10b981' : '#f59e0b', fontWeight: 700, marginTop: 4 }}>
            {pred.favCovers ? '✅ FAVORI COUVRE' : '⚡ OUTSIDER COUVRE'}
          </div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
            Confiance {pred.coverProb}%
          </div>
        </div>

        {/* Over/Under */}
        <div style={{
          background: pred.isOver ? '#fef3c7' : '#eff6ff',
          border: `2px solid ${pred.isOver ? '#f59e0b' : '#3b82f6'}`,
          borderRadius: 12, padding: '12px 14px', textAlign: 'center'
        }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>🎯 TOTAL {vegasTotal}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: pred.isOver ? '#92400e' : '#1e40af' }}>
            {pred.isOver ? '🔥 OVER' : '🧊 UNDER'}
          </div>
          <div style={{ fontSize: 11, color: pred.isOver ? '#f59e0b' : '#3b82f6', fontWeight: 700, marginTop: 4 }}>
            {pred.isOver ? `OVER ${vegasTotal}` : `UNDER ${vegasTotal}`}
          </div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
            Confiance {pred.ouProb}%
          </div>
        </div>
      </div>

      {/* Prob bar */}
      <div style={{ margin: '10px 14px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, marginBottom: 4 }}>
          <span style={{ color: '#10b981' }}>{home.abbr} {pred.winProb}%</span>
          <span style={{ color: '#ef4444' }}>{away.abbr} {100 - pred.winProb}%</span>
        </div>
        <div style={{ height: 8, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pred.winProb}%`, background: 'linear-gradient(90deg,#10b981,#6ee7b7)', borderRadius: 10 }} />
        </div>
      </div>

      {/* Toggles */}
      <div style={{ padding: '12px 14px 10px', display: 'flex', gap: 8 }}>
        <button onClick={() => setShowStats(s => !s)} style={{ flex: 1, padding: '9px 0', background: showStats ? '#f3f4f6' : '#fff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#374151', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          {showStats ? '▲ Masquer stats' : '▼ Stats avancées'}
        </button>
        <button onClick={() => setShowInj(s => !s)} style={{ flex: 1, padding: '9px 0', background: totalInj > 0 ? '#fee2e2' : (showInj ? '#f3f4f6' : '#fff'), border: `1px solid ${totalInj > 0 ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 8, color: totalInj > 0 ? '#ef4444' : '#374151', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          🏥 {totalInj > 0 ? `${totalInj} blessé${totalInj > 1 ? 's' : ''}` : 'Blessures'}
        </button>
      </div>

      {showStats && <StatGrid home={home} away={away} hAdj={hAdj} aAdj={aAdj} />}

      {showInj && (
        <div style={{ margin: '0 14px 10px', padding: '12px 14px', background: '#f9fafb', borderRadius: 12 }}>
          <InjuryPanel team={home} injured={homeInj} setInjured={setHomeInj} />
          <div style={{ height: 1, background: '#e5e7eb', margin: '12px 0' }} />
          <InjuryPanel team={away} injured={awayInj} setInjured={setAwayInj} />
        </div>
      )}

      {/* AI */}
      <div style={{ padding: '4px 14px 14px' }}>
        <button onClick={handleAnalyze} disabled={loading} style={{ width: '100%', padding: '11px 0', background: loading ? '#e5e7eb' : 'linear-gradient(135deg,#7c3aed,#6366f1)', border: 'none', borderRadius: 10, color: loading ? '#9ca3af' : '#fff', fontSize: 12, fontWeight: 800, cursor: loading ? 'wait' : 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>
          {loading ? '⏳  Analyse en cours...' : '✦  ANALYSE IA AVANCÉE'}
        </button>
        {error && <div style={{ marginTop: 8, padding: '8px 12px', background: '#fee2e2', borderRadius: 8, fontSize: 12, color: '#ef4444' }}>{error}</div>}
      </div>

      {aiText && (
        <div style={{ margin: '0 14px 14px', background: '#faf5ff', borderRadius: 10, padding: '13px 15px', borderLeft: '3px solid #7c3aed' }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#7c3aed', marginBottom: 8, textTransform: 'uppercase', fontWeight: 700 }}>✦ Analyse IA — Claude</div>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-line' }}>{aiText}</div>
        </div>
      )}
    </div>
  )
}
