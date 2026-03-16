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
  const avgPace    = (h.pace + a.pace) / 2
  const hRaw       = (h.oRtg / 100) * avgPace + 2.2
  const aRaw       = (a.oRtg / 100) * avgPace
  const hDefFactor = (100 - a.dRtg) / 100
  const aDefFactor = (100 - h.dRtg) / 100
  const hScore     = Math.round(hRaw * (1 + hDefFactor * 0.15))
  const aScore     = Math.round(aRaw * (1 + aDefFactor * 0.15))
  const projTotal  = parseFloat(((h.oRtg + a.oRtg) / 2 * avgPace / 100 * 1.08).toFixed(1))
  const spread     = parseFloat((hScore - aScore).toFixed(1))
  const winProb    = Math.min(95, Math.max(5, Math.round(50 + spread * 2.1)))
  return { hScore, aScore, projTotal, spread, winProb, hAdj: h, aAdj: a }
}
