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

// Ajustement KenPom-style: efficacité ajustée selon qualité adversaire
function adjEfficiency(offRtg, defRtgAdv, leagueAvg = 100) {
  return (offRtg * defRtgAdv) / leagueAvg
}

// Four Factors weights (Dean Oliver)
// eFG% = 40%, TOV% = 25%, ORB% = 20%, FT Rate = 15%
function fourFactorsScore(team) {
  const efgScore  = team.eFG    * 0.40
  const tovScore  = (20 - team.tovPct) * 0.25  // moins de TO = mieux
  const orbScore  = team.orbPct  * 0.20
  const ftScore   = team.ftRate  * 0.15
  return efgScore + tovScore + orbScore + ftScore
}

export function predictAdvanced(home, away, homeInj = [], awayInj = []) {
  const h = applyInjuries(home, homeInj)
  const a = applyInjuries(away, awayInj)

  // 1. PACE — moyenne pondérée des deux équipes
  const avgPace = (h.pace * 0.5 + a.pace * 0.5)

  // 2. EFFICACITÉ AJUSTÉE (style KenPom AdjO/AdjD)
  const hAdjO = adjEfficiency(h.oRtg, a.dRtg)
  const aAdjO = adjEfficiency(a.oRtg, h.dRtg)

  // 3. SCORE DE BASE via AdjO × Pace / 100
  let hScoreBase = (hAdjO * avgPace) / 100
  let aScoreBase = (aAdjO * avgPace) / 100

  // 4. FOUR FACTORS ADJUSTMENT (Dean Oliver)
  const hFF = fourFactorsScore(h)
  const aFF = fourFactorsScore(a)
  const ffDiff = (hFF - aFF) * 0.08
  hScoreBase += ffDiff
  aScoreBase -= ffDiff

  // 5. FREE THROW ADJUSTMENT
  // FT Rate = FTA/FGA, TS% intègre FT
  const hFTAdj = (h.tsPct - h.eFG * 0.5) * 0.12
  const aFTAdj = (a.tsPct - a.eFG * 0.5) * 0.12
  hScoreBase += hFTAdj
  aScoreBase += aFTAdj

  // 6. TURNOVER ADJUSTMENT
  // Chaque 1% de TOV = ~0.5 pt perdu
  const hTovAdj = (a.tovPct - h.tovPct) * 0.5
  const aTovAdj = (h.tovPct - a.tovPct) * 0.5
  hScoreBase += hTovAdj
  aScoreBase += aTovAdj

  // 7. OFFENSIVE REBOUND ADJUSTMENT
  // ORB% élevé = plus de possessions
  const hOrbAdj = (h.orbPct - a.orbPct) * 0.15
  hScoreBase += hOrbAdj
  aScoreBase -= hOrbAdj

  // 8. AVANTAGE TERRAIN NEUTRE (tournoi = site neutre)
  // Légère prime pour l'équipe mieux seedée
  const seedAdv = (a.seed - h.seed) * 0.3
  hScoreBase += seedAdv

  // 9. MOMENTUM (L10)
  const hMomentum = ((h.last10W || 5) - 5) * 0.4
  const aMomentum = ((a.last10W || 5) - 5) * 0.4
  hScoreBase += hMomentum
  aScoreBase += aMomentum

  // 10. SOS ADJUSTMENT
  const hSosAdj = ((h.sos || 5) - (a.sos || 5)) * 0.3
  hScoreBase += hSosAdj

  // SCORES FINAUX
  const hScore = Math.round(Math.max(45, Math.min(105, hScoreBase)))
  const aScore = Math.round(Math.max(45, Math.min(105, aScoreBase)))

  // TOTAL PROJETÉ
  const avgEFG    = (h.eFG + a.eFG) / 2
  const avgTov    = (h.tovPct + a.tovPct) / 2
  const efgBonus  = (avgEFG - 50) * 0.25
  const tovPenalty = (avgTov - 14) * 0.2
  const projTotal = parseFloat((hScore + aScore + efgBonus - tovPenalty).toFixed(1))

  // SPREAD
  const spread = parseFloat((hScore - aScore).toFixed(1))

  // PROBABILITÉ DE VICTOIRE — modèle logistique
  const netDiff    = (h.oRtg - h.dRtg) - (a.oRtg - a.dRtg)
  const sosFactor  = ((h.sos     || 5) - (a.sos     || 5)) * 1.2
  const l10Factor  = ((h.last10W || 5) - (a.last10W || 5)) * 1.0
  const seedFactor = (a.seed - h.seed) * 1.8
  const ffFactor   = (hFF - aFF) * 0.4
  const tovFactor  = (a.tovPct - h.tovPct) * 0.6
  const orbFactor  = (h.orbPct - a.orbPct) * 0.4
  const ftFactor   = (h.tsPct - a.tsPct) * 0.3

  const rawProb = 50 + netDiff * 1.5 + sosFactor + l10Factor + seedFactor + ffFactor + tovFactor + orbFactor + ftFactor
  const winProb = Math.min(97, Math.max(3, Math.round(rawProb)))

  // OVER/UNDER
  const actualTotal = hScore + aScore
  const isOver      = actualTotal > projTotal
  const absSpread   = Math.abs(spread).toFixed(1)

  // CONFIANCE DU MODÈLE
  const netDiffAbs = Math.abs(netDiff)
  const confidence  = netDiffAbs > 15 ? 'ÉLEVÉE 🟢' : netDiffAbs > 8 ? 'MOYENNE 🟡' : 'FAIBLE 🔴'

  // EDGE BETTING (écart entre notre modèle et le marché)
  const coverProb = Math.min(95, Math.max(5, Math.round(winProb * 0.9 + (hFF > aFF ? 3 : -3))))

  return {
    hScore, aScore, projTotal, spread,
    winProb, isOver, absSpread,
    actualTotal, confidence, coverProb,
    hAdj: h, aAdj: a,
    hFF: hFF.toFixed(1), aFF: aFF.toFixed(1)
  }
}
