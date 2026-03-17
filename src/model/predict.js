export function applyInjuries(team, injured = []) {
  if (injured.length === 0) return team
  let { oRtg, dRtg, eFG, pace, tovPct, orbPct, ftRate } = team
  const totalImpact = team.roster.reduce((s, p) => s + p.impact, 0)
  injured.forEach(name => {
    const p = team.roster.find(r => r.name === name)
    if (!p) return
    const w = p.impact / totalImpact
    oRtg   -= p.offImpact * 1.6
    dRtg   += p.defImpact * 1.6
    eFG    -= p.offImpact * 0.7
    tovPct += w * 1.4
    orbPct -= w * 1.2
    ftRate -= w * 0.8
    pace   -= w * 1.0
  })
  return { ...team, oRtg, dRtg, eFG, pace, tovPct, orbPct, ftRate }
}

function fourFactorsScore(team) {
  return team.eFG * 0.40 + (20 - team.tovPct) * 0.25 + team.orbPct * 0.20 + team.ftRate * 0.15
}

export function predictAdvanced(home, away, homeInj = [], awayInj = []) {
  const h = applyInjuries(home, homeInj)
  const a = applyInjuries(away, awayInj)

  // ── PACE ──────────────────────────────────────────────────────────────────
  // pace dans nos données = possessions des DEUX équipes combinées par 40 min
  // Possessions par équipe = pace / 2
  const avgPace = (h.pace + a.pace) / 2
  const teamPoss = avgPace / 2  // ~34-38 possessions par équipe

  // ── SCORE KenPom ──────────────────────────────────────────────────────────
  // Formule: Points = (ORtg_adj / 100) × possessions_par_équipe
  // ORtg adj = ORtg de l'attaque × (DRtg adverse / 100)
  // Ex: Duke ORtg 121.4 × (Siena DRtg 107.8 / 100) = 130.9 → 130.9/100 × 37 = 48.4 pts ← trop bas
  
  // En réalité le pace NCAA = possessions PAR équipe (pas combiné)
  // Duke pace 72 = 72 possessions par équipe → 72 × (121.4/100) × (107.8/100) = ~94 pts ← réaliste !
  
  const hAdjO = h.oRtg * (a.dRtg / 100)  // efficacité offensive ajustée
  const aAdjO = a.oRtg * (h.dRtg / 100)

  // Score = AdjO/100 × pace (possessions par équipe)
  let hBase = (hAdjO / 100) * avgPace
  let aBase = (aAdjO / 100) * avgPace

  // ── FOUR FACTORS (Dean Oliver) ────────────────────────────────────────────
  const hFF  = fourFactorsScore(h)
  const aFF  = fourFactorsScore(a)
  const ffAdj = (hFF - aFF) * 0.06
  hBase += ffAdj
  aBase -= ffAdj

  // ── TRUE SHOOTING % ───────────────────────────────────────────────────────
  hBase += (h.tsPct - 57) * 0.08
  aBase += (a.tsPct - 57) * 0.08

  // ── TURNOVER IMPACT ───────────────────────────────────────────────────────
  // Chaque 1% de TOV supplémentaire = ~0.4 pts perdus
  hBase -= (h.tovPct - 14) * 0.4
  aBase -= (a.tovPct - 14) * 0.4

  // ── OFFENSIVE REBOUND ─────────────────────────────────────────────────────
  hBase += (h.orbPct - 29) * 0.12
  aBase += (a.orbPct - 29) * 0.12

  // ── FREE THROW RATE ───────────────────────────────────────────────────────
  hBase += (h.ftRate - 35) * 0.05
  aBase += (a.ftRate - 35) * 0.05

  // ── MOMENTUM L10 ──────────────────────────────────────────────────────────
  hBase += ((h.last10W || 5) - 5) * 0.35
  aBase += ((a.last10W || 5) - 5) * 0.35

  // ── SOS ───────────────────────────────────────────────────────────────────
  const sosDiff = ((h.sos || 5) - (a.sos || 5)) * 0.18
  hBase += sosDiff
  aBase -= sosDiff

  // ── SEED AVANTAGE ─────────────────────────────────────────────────────────
  hBase += (a.seed - h.seed) * 0.22

  // ── SCORES FINAUX ─────────────────────────────────────────────────────────
  // NCAA college basketball: scores réalistes entre 60-100 pts
  const hScore = Math.round(Math.max(58, Math.min(102, hBase)))
  const aScore = Math.round(Math.max(58, Math.min(102, aBase)))

  const actualTotal = hScore + aScore
  const projTotal   = parseFloat(actualTotal.toFixed(1))
  const spread      = parseFloat((hScore - aScore).toFixed(1))

  // ── PROBABILITÉ DE VICTOIRE ───────────────────────────────────────────────
  const hNet       = h.oRtg - h.dRtg
  const aNet       = a.oRtg - a.dRtg
  const netDiff    = hNet - aNet
  const sosFactor  = ((h.sos     || 5) - (a.sos     || 5)) * 1.2
  const l10Factor  = ((h.last10W || 5) - (a.last10W || 5)) * 1.0
  const seedFactor = (a.seed - h.seed) * 1.8
  const ffFactor   = (hFF - aFF) * 0.5
  const tovFactor  = (a.tovPct - h.tovPct) * 0.6
  const orbFactor  = (h.orbPct - a.orbPct) * 0.4
  const tsFactor   = (h.tsPct - a.tsPct) * 0.3

  const rawProb = 50 + netDiff * 1.6 + sosFactor + l10Factor + seedFactor + ffFactor + tovFactor + orbFactor + tsFactor
  const winProb = Math.min(97, Math.max(3, Math.round(rawProb)))

  // ── CONFIANCE ─────────────────────────────────────────────────────────────
  const netDiffAbs = Math.abs(netDiff)
  const confidence = netDiffAbs > 15 ? 'ÉLEVÉE 🟢' : netDiffAbs > 8 ? 'MOYENNE 🟡' : 'FAIBLE 🔴'

  return {
    hScore, aScore, projTotal, spread,
    winProb, actualTotal, confidence,
    isOver: false,
    absSpread: Math.abs(spread).toFixed(1),
    hAdj: h, aAdj: a,
    hFF: hFF.toFixed(1), aFF: aFF.toFixed(1)
  }
}
