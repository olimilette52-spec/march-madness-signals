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

// ── MODÈLE SPREAD ─────────────────────────────────────────────────────────
function spreadModel(fav, dog, absSpread) {
  let score = 0
  const favFF = fourFactors(fav)
  const dogFF = fourFactors(dog)

  // 1. KenPom AdjEM différentiel — le meilleur prédicteur
  // AdjEM = kpOff rank - kpDef rank (plus bas = meilleur)
  const favAdjEM = (fav.kpOff || 50) + (fav.kpDef || 50)  // score combiné (bas = bon)
  const dogAdjEM = (dog.kpOff || 150) + (dog.kpDef || 150)
  const kpDiff   = dogAdjEM - favAdjEM  // positif = favori meilleur
  score += kpDiff * 0.04

  // 2. KenPom rank différentiel
  const kpRankDiff = (dog.kpRank || 150) - (fav.kpRank || 50)
  score += kpRankDiff * 0.025

  // 3. Offense KenPom rank de l'underdog vs defense KenPom rank du favori
  // Si underdog offense rank (bas = bon) < favori defense rank → underdog peut scorer
  const dogOffVsFavDef = (fav.kpDef || 50) - (dog.kpOff || 150)
  score += dogOffVsFavDef * 0.02  // positif = favori défense meilleure → favori couvre

  // 4. NET rating différentiel
  const favNet = fav.oRtg - fav.dRtg
  const dogNet = dog.oRtg - dog.dRtg
  const netDiff = favNet - dogNet
  const expectedMargin = netDiff * 2.2
  score += (expectedMargin - absSpread) * 0.15

  // 5. Four Factors
  score += (favFF.efg - dogFF.efg) * 0.10
  score += (dogFF.tov - favFF.tov) * 0.08
  score += (favFF.orb - dogFF.orb) * 0.06

  // 6. Facteur taille du spread — historique NCAA Tournament
  if (absSpread >= 20)      score -= 4.0
  else if (absSpread >= 15) score -= 2.5
  else if (absSpread >= 10) score -= 1.0
  else if (absSpread >= 6)  score -= 0.3
  else                      score += 1.5

  // 7. Momentum L10
  score += ((fav.last10W || 5) - (dog.last10W || 5)) * 0.30

  // 8. SOS — underdog de bonne conférence couvre plus souvent
  score -= ((fav.sos || 5) - (dog.sos || 5)) * 0.18

  // 9. Défense KenPom de l'underdog
  if ((dog.kpDef || 100) < 20) score -= 2.5  // underdog top 20 défense
  else if ((dog.kpDef || 100) < 35) score -= 1.5
  else if ((dog.kpDef || 100) < 50) score -= 0.8

  // 10. Pace matchup
  const paceDiff = fav.pace - dog.pace
  if (paceDiff > 5)  score -= 0.8  // underdog joue lent = couvre
  if (paceDiff < -5) score += 0.8

  const favCoverProb = Math.min(76, Math.max(34, Math.round(50 + score * 2.2)))
  const dogCoverProb = 100 - favCoverProb

  return {
    favCovers:    favCoverProb > 50,
    favCoverProb,
    dogCoverProb,
    coverTeam:    favCoverProb > 50 ? fav : dog,
    coverProb:    Math.max(favCoverProb, dogCoverProb),
    score:        score.toFixed(2)
  }
}

// ── MODÈLE OVER/UNDER ─────────────────────────────────────────────────────
function overUnderModel(h, a, vegasTotal) {
  let score = 0

  // 1. KenPom offense ranks combinés — meilleure offense = over
  const avgOffRank = ((h.kpOff || 100) + (a.kpOff || 100)) / 2
  // Rank bas = bonne offense → over
  if (avgOffRank < 15)       score += 2.5
  else if (avgOffRank < 30)  score += 1.5
  else if (avgOffRank < 50)  score += 0.8
  else if (avgOffRank > 100) score -= 1.0
  else if (avgOffRank > 150) score -= 2.0

  // 2. KenPom defense ranks combinés — meilleure défense = under
  const avgDefRank = ((h.kpDef || 100) + (a.kpDef || 100)) / 2
  if (avgDefRank < 10)       score -= 3.0  // deux excellentes défenses = under fort
  else if (avgDefRank < 20)  score -= 2.0
  else if (avgDefRank < 35)  score -= 1.2
  else if (avgDefRank < 55)  score -= 0.5
  else if (avgDefRank > 80)  score += 0.8
  else if (avgDefRank > 120) score += 1.5

  // 3. Pace combiné relatif au total Vegas
  const avgPace = (h.pace + a.pace) / 2
  const paceVsTotal = (avgPace - 68) * (145 / vegasTotal)
  score += paceVsTotal * 0.5

  // 4. TOV% combiné
  const avgTOV = (h.tovPct + a.tovPct) / 2
  if      (avgTOV > 16) score -= 2.0
  else if (avgTOV > 15) score -= 1.2
  else if (avgTOV < 13) score += 1.2
  else if (avgTOV < 12) score += 2.0

  // 5. Total Vegas signal
  if      (vegasTotal < 133) score -= 2.5  // Vegas dit match défensif
  else if (vegasTotal < 138) score -= 1.2
  else if (vegasTotal < 142) score -= 0.5
  else if (vegasTotal > 168) score += 2.5  // Vegas dit match offensif
  else if (vegasTotal > 162) score += 1.5
  else if (vegasTotal > 156) score += 0.8

  // 6. eFG% combiné
  const avgEFG = (h.eFG + a.eFG) / 2
  score += (avgEFG - 52) * 0.25

  // 7. Momentum — deux équipes en forme = over
  const avgL10 = ((h.last10W || 5) + (a.last10W || 5)) / 2
  if      (avgL10 > 7.5) score += 1.0
  else if (avgL10 < 4.5) score -= 1.0

  const overProb  = Math.min(74, Math.max(36, Math.round(50 + score * 2.8)))
  const underProb = 100 - overProb

  return {
    isOver:   overProb > 50,
    overProb,
    underProb,
    ouProb:   Math.max(overProb, underProb),
    avgPace:  avgPace.toFixed(1),
    avgDefRank: avgDefRank.toFixed(0),
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

  // Probabilité victoire basée sur KenPom rank
  const kpRankDiff = (a.kpRank || 100) - (h.kpRank || 100)
  const netDiff    = (h.oRtg - h.dRtg) - (a.oRtg - a.dRtg)
  const sosFactor  = ((h.sos || 5) - (a.sos || 5)) * 0.8
  const l10Factor  = ((h.last10W || 5) - (a.last10W || 5)) * 0.6
  const seedFactor = (a.seed - h.seed) * 1.0
  const ffFactor   = (hFF.score - aFF.score) * 0.3

  const rawProb = 50 + kpRankDiff * 0.18 + netDiff * 1.1 + sosFactor + l10Factor + seedFactor + ffFactor
  const winProb = Math.min(95, Math.max(5, Math.round(rawProb)))

  const kpDiffAbs  = Math.abs(kpRankDiff)
  const confidence = kpDiffAbs > 80 ? 'ÉLEVÉE 🟢' : kpDiffAbs > 40 ? 'MOYENNE 🟡' : 'FAIBLE 🔴'

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
