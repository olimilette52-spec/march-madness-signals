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
    <div style={{ background: '#fff​​​​​​​​​​​​​​​​
