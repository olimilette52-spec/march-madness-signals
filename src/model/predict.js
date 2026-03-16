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

  const avgPace = (h.pace + a.pace) / 2

  // Score via ORtg × possessions avec ajustement défensif
  const hScore = Math.round((h.oRtg / 100) * avgPace * (100 / a.dRtg) + 1.5)
  const aScore = Math.round((a.oRtg / 100) * avgPace * (100 / h.dRtg))

  const projTotal  = parseFloat(((h.oRtg + a.oRtg) / 2 * avgPace / 100 * 1.04).toFixed(1))
  const spread     = parseFloat((hScore - aScore).toFixed(1))

  // Prob victoire avec SOS + L10 + seed
  const sosFactor  = ((h.sos || 5) - (a.sos || 5)) * 0.8
  const l10Factor  = ((h.last10W || 5) - (a.last10W || 5)) * 0.6
  const seedFactor = (a.seed - h.seed) * 1.2
  const rawProb    = 50 + spread * 1.8 + sosFactor + l10Factor + seedFactor
  const winProb    = Math.min(96, Math.max(4, Math.round(rawProb)))

  const actualTotal = hScore + aScore
  const isOver      = actualTotal > projTotal
  const absSpread   = Math.abs(spread).toFixed(1)
  const favTeam     = spread >= 0 ? home : away
  const dogTeam     = spread >= 0 ? away : home

  return {
    hScore, aScore, projTotal, spread,
    winProb, isOver,
    absSpread, favTeam, dogTeam,
    actualTotal,
    hAdj: h, aAdj: a
  }
}
