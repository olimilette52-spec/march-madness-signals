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

  // Pace ajusté
  const avgPace = (h.pace + a.pace) / 2

  // Score brut via ORtg × possessions + avantage terrain
  const hRaw = (h.oRtg / 100) * avgPace + 2.8
  const aRaw = (a.oRtg / 100) * avgPace

  // Ajustement défensif croisé
  const hScore = Math.round(hRaw * ((100 - a.dRtg) / 85))
  const aScore = Math.round(aRaw * ((100 - h.dRtg) / 85))

  // Projection total basé sur eFG%, pace et ORtg moyens
  const projTotal = parseFloat(((h.oRtg + a.oRtg) / 2 * avgPace / 100 * 1.06).toFixed(1))

  // Spread et prob victoire
  const spread   = parseFloat((hScore - aScore).toFixed(1))

  // Prob victoire — intègre SOS, L10, seed
  const sosFactor  = ((h.sos || 5) - (a.sos || 5)) * 0.8
  const l10Factor  = ((h.last10W || 5) - (a.last10W || 5)) * 0.6
  const seedFactor = (a.seed - h.seed) * 1.2
  const rawProb    = 50 + spread * 1.8 + sosFactor + l10Factor + seedFactor
  const winProb    = Math.min(96, Math.max(4, Math.round(rawProb)))

  // Over/Under — calcul précis
  const actualTotal = hScore + aScore
  const isOver      = actualTotal > projTotal
  const ouEdge      = Math.abs(actualTotal - projTotal).toFixed(1)

  // Spread recommandé
  const absSpread   = Math.abs(spread).toFixed(1)
  const favTeam     = spread >= 0 ? home : away
  const dogTeam     = spread >= 0 ? away : home
  const coversProb  = Math.min(92, Math.max(8, Math.round(winProb * 0.88)))

  return {
    hScore, aScore, projTotal, spread,
    winProb, isOver, ouEdge,
    absSpread, favTeam, dogTeam, coversProb,
    hAdj: h, aAdj: a,
    actualTotal
  }
}
