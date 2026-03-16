export function applyInjuries(team, injured = []) {
  if (injured.length === 0) return team
  let { oRtg, dRtg, eFG, pace } = team
  const totalImpact = team.roster.reduce((s, p) => s + p.impact, 0)
  injured.forEach(name => {
    const p = team.roster.find(r => r.name === name)
    if (!p) return
    const w = p.impact / totalImpact
    oRtg -= p.offImpact * 1.4
    dRtg += p.defImpact * 1.4
    eFG  -= p.offImpact * 0.6
    pace -= w * 1.2
  })
  return { ...team, oRtg, dRtg, eFG, pace }
}

export function predictAdvanced(home, away, homeInj = [], awayInj = []) {
  const h = applyInjuries(home, homeInj)
  const a = applyInjuries(away, awayInj)

  // NCAA college: ~70 possessions par match (pace = possessions par 40min)
  // Score réel = ORtg × (pace/100)
  // Ex: ORtg 115 × 70 possessions / 100 = 80.5 points
  const avgPace = (h.pace + a.pace) / 2

  // Score offensif de base
  const hOffBase = (h.oRtg * avgPace) / 100
  const aOffBase = (a.oRtg * avgPace) / 100

  // Ajustement défensif: si dRtg adverse est bon (bas), on réduit le score
  // dRtg moyen NCAA ≈ 100, donc facteur = dRtg/100
  const hDefAdj = a.dRtg / 100
  const aDefAdj = h.dRtg / 100

  // Score final ajusté + avantage terrain +1.5 pts
  const hScore = Math.round(hOffBase * hDefAdj + 1.5)
  const aScore = Math.round(aOffBase * aDefAdj)

  // Total projeté basé sur eFG% et pace
  // Plus eFG% est élevé = plus de points
  const avgEFG  = (h.eFG + a.eFG) / 2
  const efgBonus = (avgEFG - 50) * 0.3
  const projTotal = parseFloat((hScore + aScore + efgBonus).toFixed(1))

  // Spread
  const spread = parseFloat((hScore - aScore).toFixed(1))

  // Probabilité victoire
  // Intègre: spread, SOS, L10, seed, TOV%, ORB%
  const sosFactor  = ((h.sos      || 5) - (a.sos      || 5)) * 1.0
  const l10Factor  = ((h.last10W  || 5) - (a.last10W  || 5)) * 0.8
  const seedFactor = (a.seed - h.seed) * 1.5
  const tovFactor  = (a.tovPct - h.tovPct) * 0.5
  const orbFactor  = (h.orbPct - a.orbPct) * 0.3

  const rawProb = 50 + spread * 2.0 + sosFactor + l10Factor + seedFactor + tovFactor + orbFactor
  const winProb = Math.min(97, Math.max(3, Math.round(rawProb)))

  // Over/Under
  const actualTotal = hScore + aScore
  const isOver      = actualTotal > projTotal
  const absSpread   = Math.abs(spread).toFixed(1)

  // Confiance du modèle basée sur écart de NET rating
  const hNet = h.oRtg - h.dRtg
  const aNet = a.oRtg - a.dRtg
  const netDiff = Math.abs(hNet - aNet)
  const confidence = netDiff > 20 ? 'ÉLEVÉE' : netDiff > 10 ? 'MOYENNE' : 'FAIBLE'

  return {
    hScore, aScore, projTotal, spread,
    winProb, isOver, absSpread,
    actualTotal, confidence,
    hAdj: h, aAdj: a
  }
}
