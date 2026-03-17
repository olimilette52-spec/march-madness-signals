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

// Modèle de couverture du spread
// Basé sur les facteurs qui prédisent si un underdog couvre
function spreadCoverModel(fav, dog, vegasSpread) {
  const absSpread = Math.abs(vegasSpread)

  // Four Factors
  const favFF = fourFactorsScore(fav)
  const dogFF = fourFactorsScore(dog)

  // NET rating différentiel
  const favNet = fav.oRtg - fav.dRtg
  const dogNet = dog.oRtg - dog.dRtg
  const netDiff = favNet - dogNet

  // Facteurs historiques NCAA Tournament
  // 1. Gros spreads (>15) — underdogs couvrent ~52% du temps
  // 2. Momentum L10 de l'underdog
  // 3. Four Factors de l'underdog
  // 4. SOS — underdog d'une meilleure conférence

  let dogCoverScore = 0

  // Facteur spread — plus le spread est grand, plus l'underdog a de valeur
  if (absSpread >= 20) dogCoverScore += 3.0
  else if (absSpread >= 15) dogCoverScore += 2.0
  else if (absSpread >= 10) dogCoverScore += 1.0
  else if (absSpread >= 7)  dogCoverScore += 0.5
  else dogCoverScore -= 1.0  // petits spreads favorisent le favori

  // Momentum underdog
  const dogMomentum = (dog.last10W || 5) - 5
  dogCoverScore += dogMomentum * 0.4

  // Four Factors underdog vs favori
  const ffDiff = dogFF - favFF
  dogCoverScore += ffDiff * 0.15

  // SOS underdog
  const sosDiff = (dog.sos || 5) - (fav.sos || 5)
  dogCoverScore += sosDiff * 0.3

  // NET rating — si le NET est moins mauvais que le spread suggère
  const expectedNetDiff = absSpread * 2.2
  if (netDiff < expectedNetDiff) dogCoverScore += (expectedNetDiff - netDiff) * 0.05

  // TOV% avantage underdog
  if (dog.tovPct < fav.tovPct) dogCoverScore += 0.5

  // eFG% underdog
  if (dog.eFG > fav.eFG - 3) dogCoverScore += 0.5

  // Prob que l'underdog couvre (0-100)
  const dogCoverProb = Math.min(72, Math.max(28, Math.round(50 + dogCoverScore * 2)))
  const favCoverProb = 100 - dogCoverProb

  return {
    favCoverProb,
    dogCoverProb,
    favCovers: favCoverProb > dogCoverProb,
    coverTeam: favCoverProb > dogCoverProb ? fav : dog,
    coverProb: Math.max(favCoverProb, dogCoverProb)
  }
}

// Modèle Over/Under
function overUnderModel(home, away, vegasTotal) {
  const hAdj = home
  const aAdj = away

  // Pace combiné — plus de pace = plus de points
  const avgPace = (hAdj.pace + aAdj.pace) / 2
  const paceScore = (avgPace - 70) * 0.8

  // eFG% combiné — plus d'efficacité = plus de points
  const avgEFG = (hAdj.eFG + aAdj.eFG) / 2
  const efgScore = (avgEFG - 52) * 0.6

  // TOV% combiné — plus de turnovers = moins de points
  const avgTOV = (hAdj.tovPct + aAdj.tovPct) / 2
  const tovScore = -(avgTOV - 14) * 0.5

  // DRtg combiné — meilleures défenses = under
  const avgDRtg = (hAdj.dRtg + aAdj.dRtg) / 2
  const drtgScore = (avgDRtg - 95) * 0.4

  // ORtg combiné — meilleures offenses = over
  const avgORtg = (hAdj.oRtg + aAdj.oRtg) / 2
  const ortgScore = (avgORtg - 110) * 0.3

  // FT Rate — plus de lancers = plus de points
  const avgFTRate = (hAdj.ftRate + aAdj.ftRate) / 2
  const ftScore = (avgFTRate - 35) * 0.2

  // Score total over
  const overScore = paceScore + efgScore + tovScore + drtgScore + ortgScore + ftScore

  // Prob over (0-100)
  const overProb = Math.min(72, Math.max(28, Math.round(50 + overScore)))
  const underProb = 100 - overProb

  return {
    overProb,
    underProb,
    isOver: overProb > underProb,
    ouProb: Math.max(overProb, underProb)
  }
}

export function predictAdvanced(home, away, homeInj = [], awayInj = [], vegasSpread, vegasTotal) {
  const h = applyInjuries(home, homeInj)
  const a = applyInjuries(away, awayInj)

  const hFF = fourFactorsScore(h)
  const aFF = fourFactorsScore(a)

  // Déterminer favori et underdog selon Vegas
  const fav = vegasSpread !== undefined
    ? (vegasSpread <= 0 ? h : a)
    : (h.seed <= a.seed ? h : a)
  const dog = fav.abbr === h.abbr ? a : h

  // Modèle spread
  const spreadResult = spreadCoverModel(fav, dog, vegasSpread || -3.5)

  // Modèle over/under
  const ouResult = overUnderModel(h, a, vegasTotal || 145)

  // Probabilité victoire
  const hNet      = h.oRtg - h.dRtg
  const aNet      = a.oRtg - a.dRtg
  const netDiff   = hNet - aNet
  const sosFactor = ((h.sos || 5) - (a.sos || 5)) * 0.9
  const l10Factor = ((h.last10W || 5) - (a.last10W || 5)) * 0.7
  const seedFactor= (a.seed - h.seed) * 1.2
  const ffFactor  = (hFF - aFF) * 0.35

  const rawProb = 50 + netDiff * 1.3 + sosFactor + l10Factor + seedFactor + ffFactor
  const winProb = Math.min(95, Math.max(5, Math.round(rawProb)))

  // Confiance
  const netDiffAbs = Math.abs(netDiff)
  const confidence = netDiffAbs > 15 ? 'ÉLEVÉE 🟢' : netDiffAbs > 8 ? 'MOYENNE 🟡' : 'FAIBLE 🔴'

  return {
    // Spread
    favCovers: spreadResult.favCovers,
    coverTeam: spreadResult.coverTeam,
    coverProb: spreadResult.coverProb,
    favCoverProb: spreadResult.favCoverProb,
    dogCoverProb: spreadResult.dogCoverProb,
    fav, dog,
    // Over/Under
    isOver: ouResult.isOver,
    overProb: ouResult.overProb,
    underProb: ouResult.underProb,
    ouProb: ouResult.ouProb,
    // Général
    winProb,
    confidence,
    hAdj: h, aAdj: a,
    hFF: hFF.toFixed(1), aFF: aFF.toFixed(1),
    // Compatibilité
    hScore: 0, aScore: 0, projTotal: vegasTotal || 145,
    spread: vegasSpread || 0, actualTotal: 0,
    absSpread: Math.abs(vegasSpread || 0).toFixed(1)
  }
}
