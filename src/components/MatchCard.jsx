import { useState } from 'react'
import InjuryPanel from './InjuryPanel'
import StatGrid from './StatGrid'
import { predictAdvanced } from '../model/predict'
import { analyzeMatchup } from '../api/claude'

const Badge = ({ label, color, bg }) => (
  <div style={{ background: bg, color, padding: '6px 11px', borderRadius: 8, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>{label}</div>
)

const WinBar = ({ prob, homeAbbr, awayAbbr }) => (
  <div style={{ margin: '10px 14px 0' }}>
    <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 }}>PROBABILITÉ DE VICTOIRE</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, marginBottom: 4 }}>
      <span style={{ color: '#10b981' }}>{homeAbbr} {prob}%</span>
      <span style={{ color: '#ef4444' }}>{awayAbbr} {100 - prob}%</span>
    </div>
    <div style={{ height: 10, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${prob}%`, background: 'linear-gradient(90deg,#10b981,#6ee7b7)', borderRadius: 10, transition: 'width .5s' }} />
    </div>
  </div>
)

export default function MatchCard({ home, away }) {
  const [homeInj,   setHomeInj]   = useState([])
  const [awayInj,   setAwayInj]   = useState([])
  const [showInj,   setShowInj]   = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [aiText,    setAiText]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const pred     = predictAdvanced(home, away, homeInj, awayInj)
  const { hAdj, aAdj } = pred
  const hWins    = pred.hScore >= pred.aScore
  const winner   = hWins ? home : away
  const spread   = Math.abs(pred.spread).toFixed(1)
  const isOver   = (pred.hScore + pred.aScore) > pred.projTotal
  const totalInj = homeInj.length + awayInj.length
  const hNet     = hAdj.oRtg - hAdj.dRtg
  const aNet     = aAdj.oRtg - aAdj.dRtg

  const handleAnalyze = async () => {
    setLoading(true); setAiText(null); setError(null)
    try {
      const text = await analyzeMatchup(home, away, pred, homeInj, awayInj)
      setAiText(text)
    } catch {
      setError('Erreur API. Vérifie VITE_ANTHROPIC_API_KEY dans Vercel.')
    }
    setLoading(false)
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{home.emoji}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>{home.abbr}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280' }}>#{home.seed}</span>
              {homeInj.length > 0 && <span style={{ fontSize: 10, background: '#fee2e2', color: '#ef4444', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>🚑{homeInj.length}</span>}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>L10: {home.last10} · {home.conf}</div>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#374151', letterSpacing: 1 }}>VS</div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>March Madness</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'row-reverse' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{away.emoji}</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              {awayInj.length > 0 && <span style={{ fontSize: 10, background: '#fee2e2', color: '#ef4444', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>🚑{awayInj.length}</span>}
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280' }}>#{away.seed}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>{away.abbr}</span>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>L10: {away.last10} · {away.conf}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', margin: '0 14px', borderRadius: 12, padding: '14px 18px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>MOY {home.abbr}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#111', lineHeight: 1 }}>{hAdj.oRtg.toFixed(1)}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>DRtg {hAdj.dRtg.toFixed(1)}</div>
          <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: hNet >= 0 ? '#10b981' : '#ef4444' }}>NET {hNet >= 0 ? '+' : ''}{hNet.toFixed(1)}</div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>eFG% {hAdj.eFG.toFixed(1)}</div>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>PROJECTION</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: '#7c3aed', lineHeight: 1 }}>{pred.projTotal}</div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>Pace {((hAdj.pace + aAdj.pace) / 2).toFixed(1)}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>MOY {away.abbr}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#111', lineHeight: 1 }}>{aAdj.oRtg.toFixed(1)}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>DRtg {aAdj.dRtg.toFixed(1)}</div>
          <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: aNet >= 0 ? '#10b981' : '#ef4444' }}>NET {aNet >= 0 ? '+' : ''}{aNet.toFixed(1)}</div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>eFG% {aAdj.eFG.toFixed(1)}</div>
        </div>
      </div>

      <WinBar prob={pred.winProb} homeAbbr={home.abbr} awayAbbr={away.abbr} />

      <div style={{ margin: '10px 14px 0', background: '#f9fafb', borderRadius: 12, padding: '14px 18px' }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10 }}>SCORE PRÉVU</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{home.abbr}</div>
              <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, color: hWins ? '#ef4444' : '#d1d5db' }}>{pred.hScore}</div>
            </div>
            <div style={{ fontSize: 26, color: '#d1d5db', marginBottom: 6, fontWeight: 200 }}>–</div>
            <div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{away.abbr}</div>
              <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, color: !hWins ? '#10b981' : '#d1d5db' }}>{pred.aScore}</div>
            </div>
          </div>
          <div style={{ background: '#10b981', color: '#fff', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 800 }}>
            {winner.abbr} GAGNE
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>TOTAL: {pred.hScore + pred.aScore}</span>
          <Badge label={isOver ? 'OVER PRÉVU' : 'UNDER PRÉVU'} color={isOver ? '#16a34a' : '#d97706'} bg={isOver ? '#dcfce7' : '#fef3c7'} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge label={`${home.abbr} ${pred.spread >= 0 ? '-' : '+'}${spread}`} color='#16a34a' bg='#dcfce7' />
          <Badge label={`${away.abbr} ${pred.spread >= 0 ? '+' : '-'}${spread}`} color='#ef4444' bg='#fee2e2' />
          <Badge label={`${winner.abbr} -${spread} COUVRE`} color={hWins ? '#16a34a' : '#ef4444'} bg={hWins ? '#dcfce7' : '#fee2e2'} />
        </div>
      </div>

      <div style={{ padding: '0 14px 10px', display: 'flex', gap: 8 }}>
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
