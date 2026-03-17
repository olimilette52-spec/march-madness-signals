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

// Calibration basée sur historique NCAA Tournament
// Score moyen NCAA Tournament = ~72 pts par équipe
// Total moyen = ~144 pts
// Pace moyen = ~70 possessions par équipe
const LEAGUE_AVG_ORTG = 100  // baseline NCAA
const LEAGUE_AVG_DRTG = 100
const TOURNAMENT_FACTOR = 0.98  // légère réduction en tournoi (site neutre, meilleurs adversaires)

export function predictAdvanced(home, away, homeInj = [], awayInj = []) {
  const h = applyInjuries(home, homeInj)
  const a = applyInjuries(away, awayInj)

  // ── PACE ──────────────────────────────────────────────────────────────────
  // pace = possessions par équipe par 40 min (standard KenPom)
  const avgPace = (h.pace + a.pace) / 2

  // ── FORMULE KENPOM CORRECTE ───────────────────────────────────────────────
  // Score = (ORtg / 100) × possessions
  // SANS croiser avec DRtg adverse — ça double l'ajustement
  // On utilise ORtg de l'équipe directement × pace
  // Puis on ajuste via NET rating de l'adversaire

  // Score offensif de base
  const hOffBase = (h.oRtg / 100) * avgPace
  const aOffBase = (a.oRtg / 100) * avgPace

  // Ajustement défensif: NET rating adverse / 20
  // Si adversaire a DRtg 90 (excellent) → réduction de (100-90)/20 = 0.5 pts
  // Si adversaire a DRtg 110 (mauvais) → augmentation de (100-110)/20 = -0.5 pts  
  const hDefAdj = (LEAGUE_AVG_DRTG - a.dRtg) / 20
  const aDefAdj = (LEAGUE_AVG_DRTG - h.dRtg) / 20

  let hBase = hOffBase + hDefAdj
  let aBase = aOffBase + aDefAdj

  // ── FOUR FACTORS (Dean Oliver) ────────────────────────────────────────────
  const hFF   = fourFactorsScore(h)
  const aFF   = fourFactorsScore(a)
  // Impact modéré: 1 point de FF = 0.03 pts de score
  hBase += (hFF - 22) * 0.03
  aBase += (aFF - 22) * 0.03

  // ── TURNOVER ADJUSTMENT ───────────────────────────────────────────────────
  // 1% TOV supplémentaire = ~0.3 pts perdus
  hBase -= (h.tovPct - 14) * 0.3
  aBase -= (a.tovPct - 14) * 0.3

  // ── OFFENSIVE REBOUND ─────────────────────────────────────────────────────
  // 1% ORB supplémentaire = ~0.08 pts
  hBase += (h.orbPct - 29) * 0.08
  aBase += (a.orbPct - 29) * 0.08

  // ── TRUE SHOOTING ─────────────────────────────────────────────────────────
  // 1% TS% supplémentaire = ~0.05 pts
  hBase += (h.tsPct - 57) * 0.05
  aBase += (a.tsPct - 57) * 0.05

  // ── TOURNOI = SITE NEUTRE ─────────────────────────────────────────────────
  hBase *= TOURNAMENT_FACTOR
  aBase *= TOURNAMENT_FACTOR

  // ── MOMENTUM L10 ──────────────────────────────────────────────────────────
  hBase += ((h.last10W || 5) - 5) * 0.25
  aBase += ((a.last10W || 5) - 5) * 0.25

  // ── SOS ───────────────────────────────────────────────────────────────────
  const sosDiff = ((h.sos || 5) - (a.sos || 5)) * 0.10
  hBase += sosDiff
  aBase -= sosDiff

  // ── UPSET FACTOR March Madness ────────────────────────────────────────────
  // Underdogs performent mieux que prévu en tournoi
  const seedGap = h.seed - a.seed  // positif si away est favori
  if (Math.abs(seedGap) > 3) {
    // Réduire l'écart de 12%
    const avg = (hBase + aBase) / 2
    hBase = hBase * 0.88 + avg * 0.12
    aBase = aBase * 0.88 + avg * 0.12
  }

  // ── SCORES FINAUX ─────────────────────────────────────────────────────────
  const hScore = Math.round(Math.max(56, Math.min(98, hBase)))
  const aScore = Math.round(Math.max(56, Math.min(98, aBase)))

  const actualTotal = hScore + aScore
  const projTotal   = parseFloat(actualTotal.toFixed(1))
  const spread      = parseFloat((hScore - aScore).toFixed(1))

  // ── PROBABILITÉ DE VICTOIRE ───────────────────────────────────────────────
  const hNet       = h.oRtg - h.dRtg
  const aNet       = a.oRtg - a.dRtg
  const netDiff    = hNet - aNet
  const sosFactor  = ((h.sos     || 5) - (a.sos     || 5)) * 0.9
  const l10Factor  = ((h.last10W || 5) - (a.last10W || 5)) * 0.7
  const seedFactor = (a.seed - h.seed) * 1.2
  const ffFactor   = (hFF - aFF) * 0.35
  const tovFactor  = (a.tovPct - h.tovPct) * 0.5
  const orbFactor  = (h.orbPct - a.orbPct) * 0.3
  const tsFactor   = (h.tsPct - a.tsPct) * 0.25

  const rawProb = 50 + netDiff * 1.3 + sosFactor + l10Factor + seedFactor + ffFactor + tovFactor + orbFactor + tsFactor
  const winProb = Math.min(95, Math.max(5, Math.round(rawProb)))

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
