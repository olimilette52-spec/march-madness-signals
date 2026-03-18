export function applyInjuries(team, injured = []) {
  if (injured.length === 0) return team
  let { oRtg, dRtg, eFG, pace, tovPct, orbPct, ftRate, adjOE, adjDE, adjT } = team
  const totalImpact = team.roster.reduce((s, p) => s + p.impact, 0)
  injured.forEach(name => {
    const p = team.roster.find(r => r.name === name)
    if (!p) return
    const w = p.impact / totalImpact
    oRtg   -= p.offImpact * 1.6
    dRtg   += p.defImpact * 1.6
    adjOE  -= p.offImpact * 1.8
    adjDE  += p.defImpact * 1.8
    eFG    -= p.offImpact * 0.7
    tovPct += w * 1.4
    orbPct -= w * 1.2
    ftRate -= w * 0.8
    pace   -= w * 1.0
    adjT   -= w * 0.8
  })
  return { ...team, oRtg, dRtg, eFG, pace, tovPct, orbPct, ftRate, adjOE, adjDE, adjT }
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

function projectTotal(h, a) {
  const avgT = (h.adjT + a.adjT) / 2
  const hPoints = (h.adjOE * a.adjDE / 100) * (avgT / 100) * 0.975
  const aPoints = (a.adjOE * h.adjDE / 100) * (avgT / 100) * 0.975
  return {
    hPoints: parseFloat(hPoints.toFixed(1)),
    aPoints: parseFloat(aPoints.toFixed(1)),
    total:   parseFloat((hPoints + aPoints).toFixed(1)),
    spread:  parseFloat((hPoints - aPoints).toFixed(1))
  }
}

function spreadModel(fav, dog, absSpread, projSpread) {
  let score = 0
  const favFF = fourFactors(fav)
  const dogFF = fourFactors(dog)

  // 1. AdjEM différentiel
  const adjEMdiff = (fav.adjEM || 20) - (dog.adjEM || 5)
  score += adjEMdiff * 0.06

  // 2. Spread projeté vs Vegas
  const projFavSpread = Math.abs(projSpread)
  const spreadEdge = projFavSpread - absSpread
  score += spreadEdge * 0.12

  // 3. Efficacités croisées
  const favOffVsDogDef = (fav.adjOE || 115) - (dog.adjDE || 100)
  score += favOffVsDogDef * 0.04
  const dogOffVsFavDef = (dog.adjOE || 105) - (fav.adjDE || 92)
  score -= dogOffVsFavDef * 0.04

  // 4. Four Factors
  score += (favFF.efg - dogFF.efg) * 0.08
  score += (dogFF.tov - favFF.tov) * 0.06
  score += (favFF.orb - dogFF.orb) * 0.05

  // 5. Historique NCAA Tournament
  // Spread 1-6: favori couvre 52%, 7-12: 50%, 13-18: 48%, 19+: 44%
  if (absSpread >= 22)      score -= 4.5
  else if (absSpread >= 18) score -= 3.0
  else if (absSpread >= 14) score -= 1.8
  else if (absSpread >= 10) score -= 0.8
  else if (absSpread >= 6)  score -= 0.2
  else                      score += 0.5

  // 6. Momentum L10
  score += ((fav.last10W || 5) - (dog.last10W || 5)) * 0.28

  // 7. SOS
  score -= ((fav.sos || 5) - (dog.sos || 5)) * 0.15

  // 8. Défense underdog forte
  if ((dog.adjDE || 100) < 90)      score -= 2.0
  else if ((dog.adjDE || 100) < 94) score -= 1.2
  else if ((dog.adjDE || 100) < 97) score -= 0.6

  // 9. Pace mismatch
  const paceDiff = (fav.adjT || 70) - (dog.adjT || 70)
  if (paceDiff > 5)  score -= 0.8
  if (paceDiff < -5) score += 0.8

  const favCoverProb = Math.min(74, Math.max(36, Math.round(50 + score * 2.0)))
  const dogCoverProb = 100 - favCoverProb

  return {
    favCovers:    favCoverProb > 50,
    favCoverProb,
    dogCoverProb,
    coverTeam:    favCoverProb > 50 ? fav : dog,
    coverProb:    Math.max(favCoverProb, dogCoverProb),
    projSpread:   projSpread.toFixed(1),
    score:        score.toFixed(2)
  }
}

function overUnderModel(h, a, vegasTotal, projTotal) {
  let score = 0

  const totalEdge = projTotal - vegasTotal
  score += totalEdge * 0.15

  const avgAdjDE = ((h.adjDE || 95) + (a.adjDE || 95)) / 2
  if      (avgAdjDE < 88)  score -= 3.5
  else if (avgAdjDE < 91)  score -= 2.5
  else if (avgAdjDE < 94)  score -= 1.5
  else if (avgAdjDE < 97)  score -= 0.5
  else if (avgAdjDE > 103) score += 0.8
  else if (avgAdjDE > 106) score += 1.8
  else if (avgAdjDE > 110) score += 2.8

  const avgAdjOE = ((h.adjOE || 112) + (a.adjOE || 112)) / 2
  if      (avgAdjOE > 122) score += 2.5
  else if (avgAdjOE > 119) score += 1.5
  else if (avgAdjOE > 116) score += 0.8
  else if (avgAdjOE < 110) score -= 0.8
  else if (avgAdjOE < 107) score -= 1.5

  const avgAdjT = ((h.adjT || 70) + (a.adjT || 70)) / 2
  if      (avgAdjT > 75)   score += 2.0
  else if (avgAdjT > 73)   score += 1.2
  else if (avgAdjT > 71)   score += 0.5
  else if (avgAdjT < 67)   score -= 1.5
  else if (avgAdjT < 65)   score -= 2.5
  else if (avgAdjT < 62)   score -= 3.5

  const avgTOV = (h.tovPct + a.tovPct) / 2
  if      (avgTOV > 16) score -= 1.8
  else if (avgTOV > 15) score -= 1.0
  else if (avgTOV < 13) score += 1.0
  else if (avgTOV < 12) score += 1.8

  if      (vegasTotal < 133) score -= 2.0
  else if (vegasTotal < 138) score -= 1.0
  else if (vegasTotal > 165) score += 2.0
  else if (vegasTotal > 160) score += 1.2

  const avgEFG = (h.eFG + a.eFG) / 2
  score += (avgEFG - 52) * 0.20

  const overProb  = Math.min(74, Math.max(36, Math.round(50 + score * 2.5)))
  const underProb = 100 - overProb

  return {
    isOver:    overProb > 50,
    overProb,
    underProb,
    ouProb:    Math.max(overProb, underProb),
    projTotal: projTotal.toFixed(1),
    avgAdjDE:  avgAdjDE.toFixed(1),
    avgAdjT:   avgAdjT.toFixed(1),
    score:     score.toFixed(2)
  }
}

export function predictAdvanced(home, away, homeInj = [], awayInj = [], vegasSpread, vegasTotal) {
  const h = applyInjuries(home, homeInj)
  const a = applyInjuries(away, awayInj)

  const hFF = fourFactors(h)
  const aFF = fourFactors(a)

  const proj = projectTotal(h, a)

  const fav = (vegasSpread !== undefined && vegasSpread !== null)
    ? (vegasSpread <= 0 ? h : a)
    : (h.seed <= a.seed ? h : a)
  const dog       = fav.abbr === h.abbr ? a : h
  const absSpread = Math.abs(vegasSpread || 3.5)

  const projSpread = fav.abbr === h.abbr ? proj.spread : -proj.spread

  const spreadResult = spreadModel(fav, dog, absSpread, projSpread)
  const ouResult     = overUnderModel(h, a, vegasTotal || 145, proj.total)

  const adjEMdiff  = (h.adjEM || 20) - (a.adjEM || 5)
  const sosFactor  = ((h.sos || 5) - (a.sos || 5)) * 0.6
  const l10Factor  = ((h.last10W || 5) - (a.last10W || 5)) * 0.5
  const seedFactor = (a.seed - h.seed) * 0.8
  const ffFactor   = (hFF.score - aFF.score) * 0.25

  const rawProb = 50 + adjEMdiff * 0.85 + sosFactor + l10Factor + seedFactor + ffFactor
  const winProb = Math.min(95, Math.max(5, Math.round(rawProb)))

  const adjEMabs   = Math.abs(adjEMdiff)
  const confidence = adjEMabs > 20 ? 'ÉLEVÉE 🟢' : adjEMabs > 10 ? 'MOYENNE 🟡' : 'FAIBLE 🔴'

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
    projTotal: proj.total,
    projSpread: proj.spread,
    winProb,
    confidence,
    hAdj: h, aAdj: a,
    hFF: hFF.score.toFixed(1),
    aFF: aFF.score.toFixed(1),
    hScore: parseFloat(proj.hPoints.toFixed(0)),
    aScore: parseFloat(proj.aPoints.toFixed(0)),
    spread:      vegasSpread || 0,
    actualTotal: proj.total,
    absSpread:   absSpread.toFixed(1)
  }
}
