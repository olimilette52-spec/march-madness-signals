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

function fourFactors(team) {
  return {
    efg:   team.eFG,
    tov:   team.tovPct,
    orb:   team.orbPct,
    ft:    team.ftRate,
    score: team.eFG * 0.40 + (20 - team.tovPct) * 0.25 + team.orbPct * 0.20 + team.ftRate * 0.15
  }
}

function spreadModel(fav, dog, absSpread) {
  let score = 0
  const favFF = fourFactors(fav)
  const dogFF = fourFactors(dog)

  const favNet = fav.oRtg - fav.dRtg
  const dogNet = dog.oRtg - dog.dRtg
  const netDiff = favNet - dogNet
  const expectedMargin = netDiff * 2.2
  const spreadValue = expectedMargin - absSpread
  score += spreadValue * 0.18

  score += (favFF.efg - dogFF.efg) * 0.12
  score += (dogFF.tov - favFF.tov) * 0.10
  score += (favFF.orb - dogFF.orb) * 0.08
  score += (favFF.ft  - dogFF.ft)  * 0.06

  if (dog.dRtg < 92) score -= (92 - dog.dRtg) * 0.15
  if (dog.dRtg < 95) score -= (95 - dog.dRtg) * 0.08

  if (absSpread >= 19)      score -= 3.5
  else if (absSpread >= 13) score -= 2.0
  else if (absSpread >= 7)  score -= 0.5
  else                      score += 1.5

  score += ((fav.last10W || 5) - (dog.last10W || 5)) * 0.35
  score -= ((fav.sos || 5) - (dog.sos || 5)) * 0.20
  score += (fav.tsPct - dog.tsPct) * 0.08

  const paceDiff = fav.pace - dog.pace
  if (paceDiff > 4)  score -= 1.0
  if (paceDiff < -4) score += 1.0

  const favCoverProb = Math.min(75, Math.max(35, Math.round(50 + score * 2.5)))
  const dogCoverProb = 100 - favCoverProb

  return {
    favCovers:    favCoverProb > 50,
    favCoverProb,
    dogCoverProb,
    coverTeam:    favCoverProb > 50 ? fav : dog,
    coverProb:    Math.max(favCoverProb, dogCoverProb),
    spreadValue:  spreadValue.toFixed(1),
    score:        score.toFixed(2)
  }
}

function overUnderModel(h, a, vegasTotal) {
  let score = 0

  // 1. PACE vs total Vegas
  const avgPace = (h.pace + a.pace) / 2
  const paceVsTotal = (avgPace - 68) * (145 / vegasTotal)
  score += paceVsTotal * 0.6

  // 2. eFG% combiné
  const avgEFG = (h.eFG + a.eFG) / 2
  score += (avgEFG - 51) * 0.5

  // 3. TOV%
  const avgTOV = (h.tovPct + a.tovPct) / 2
  score -= (avgTOV - 14) * 0.4

  // 4. TS%
  const avgTS = (h.tsPct + a.tsPct) / 2
  score += (avgTS - 55) * 0.3

  // 5. FT Rate
  const avgFT = (h.ftRate + a.ftRate) / 2
  score += (avgFT - 34) * 0.2

  // 6. ORB%
  const avgORB = (h.orbPct + a.orbPct) / 2
  score += (avgORB - 29) * 0.15

  // 7. NET rating combiné
  const avgNet = ((h.oRtg - h.dRtg) + (a.oRtg - a.dRtg)) / 2
  if      (avgNet > 15) score += 1.5
  else if (avgNet > 10) score += 0.8
  else if (avgNet <  5) score -= 0.8
  else if (avgNet <  0) score -= 1.5

  // 8. Total Vegas bas = over, haut = under
  if      (vegasTotal < 135) score += 1.5
  else if (vegasTotal < 140) score += 0.8
  else if (vegasTotal > 165) score -= 1.5
  else if (vegasTotal > 158) score -= 0.8

  const overProb  = Math.min(74, Math.max(36, Math.round(50 + score * 2.2)))
  const underProb = 100 - overProb

  return {
    isOver:   overProb > 50,
    overProb,
    underProb,
    ouProb:   Math.max(overProb, underProb),
    avgPace:  avgPace.toFixed(1),
    avgEFG:   avgEFG.toFixed(1),
    score:    score.toFixed(2)
  }
}

export function predictAdvanced(home, away, homeInj = [], awayInj = [], vegasSpread, vegasTotal) {
  const h = applyInjuries(home, homeInj)
  const a = applyInjuries(away, awayInj)

  const hFF = fourFactors(h)
  const aFF = fourFactors(a)

  const fav = (vegasSpread !== undefined && vegasSpread !== null)
    ? (vegasSpread <= 0 ? h : a)
    : (h.seed <= a.seed ? h : a)
  const dog       = fav.abbr === h.abbr ? a : h
  const absSpread = Math.abs(vegasSpread || 3.5)

  const spreadResult = spreadModel(fav, dog, absSpread)
  const ouResult     = overUnderModel(h, a, vegasTotal || 145)

  const hNet      = h.oRtg - h.dRtg
  const aNet      = a.oRtg - a.dRtg
  const netDiff   = hNet - aNet
  const sosFactor = ((h.sos || 5) - (a.sos || 5)) * 0.9
  const l10Factor = ((h.last10W || 5) - (a.last10W || 5)) * 0.7
  const seedFactor= (a.seed - h.seed) * 1.2
  const ffFactor  = (hFF.score - aFF.score) * 0.35

  const rawProb = 50 + netDiff * 1.3 + sosFactor + l10Factor + seedFactor + ffFactor
  const winProb = Math.min(95, Math.max(5, Math.round(rawProb)))

  const netDiffAbs = Math.abs(netDiff)
  const confidence = netDiffAbs > 15 ? 'ÉLEVÉE 🟢' : netDiffAbs > 8 ? 'MOYENNE 🟡' : 'FAIBLE 🔴'

  return {
    favCovers:    spreadResult.favCovers,
    coverTeam:    spreadResult.coverTeam,
    coverProb:    spreadResult.coverProb,
    favCoverProb: spreadResult.favCoverProb,
    dogCoverProb: spreadResult.dogCoverProb,
    fav, dog,
    isOver:    ouResult.isOver,
    overProb:  ouResult.overProb,
    underProb: ouResult.underProb,
    ouProb:    ouResult.ouProb,
    ouDetails: ouResult,
    winProb,
    confidence,
    hAdj: h, aAdj: a,
    hFF: hFF.score.toFixed(1),
    aFF: aFF.score.toFixed(1),
    hScore: 0, aScore: 0,
    projTotal:   vegasTotal || 145,
    spread:      vegasSpread || 0,
    actualTotal: 0,
    absSpread:   absSpread.toFixed(1)
  }
}
