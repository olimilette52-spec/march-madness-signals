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
    efg:  team.eFG,
    tov:  team.tovPct,
    orb:  team.orbPct,
    ft:   team.ftRate,
    score: team.eFG * 0.40 + (20 - team.tovPct) * 0.25 + team.orbPct * 0.20 + team.ftRate * 0.15
  }
}

// ── MODÈLE SPREAD ─────────────────────────────────────────────────────────
// Prédit si le favori ou l'underdog couvre
// Basé sur les facteurs qui historiquement prédisent les covers en NCAA Tournament
function spreadModel(fav, dog, absSpread) {

  // Score de base: commence à 0 (neutre)
  // Positif = favori couvre, Négatif = underdog couvre
  let score = 0
  const favFF = fourFactors(fav)
  const dogFF = fourFactors(dog)

  // ── 1. NET RATING DIFFÉRENTIEL ─────────────────────────────────────────
  // Le NET rating prédit bien qui gagne mais pas toujours qui couvre
  const favNet = fav.oRtg - fav.dRtg
  const dogNet = dog.oRtg - dog.dRtg
  const netDiff = favNet - dogNet

  // Si le NET diff est plus grand que le spread suggère → favori couvre
  // Règle: chaque point de NET diff = 2.2 pts de marge attendu
  const expectedMargin = netDiff * 2.2
  const spreadValue    = expectedMargin - absSpread
  score += spreadValue * 0.18

  // ── 2. FOUR FACTORS DIFFÉRENTIEL ──────────────────────────────────────
  // eFG% — le plus important facteur offensif
  const efgDiff = favFF.efg - dogFF.efg
  score += efgDiff * 0.12

  // TOV% — l'underdog avec moins de turnovers couvre souvent
  const tovDiff = dogFF.tov - favFF.tov  // positif si dog a plus de TO
  score += tovDiff * 0.10

  // ORB% — rebonds offensifs favorisent l'équipe qui domine
  const orbDiff = favFF.orb - dogFF.orb
  score += orbDiff * 0.08

  // FT Rate — favorise l'équipe agressive
  const ftDiff = favFF.ft - dogFF.ft
  score += ftDiff * 0.06

  // ── 3. DÉFENSE DE L'UNDERDOG ──────────────────────────────────────────
  // Si l'underdog a une bonne défense (bas DRtg) → couvre souvent
  // DRtg < 92 = excellente défense
  if (dog.dRtg < 92) score -= (92 - dog.dRtg) * 0.15
  if (dog.dRtg < 95) score -= (95 - dog.dRtg) * 0.08

  // ── 4. FACTEUR SPREAD SIZE ────────────────────────────────────────────
  // Historique NCAA Tournament:
  // Spread 1-6:  favori couvre 52% → léger avantage favori
  // Spread 7-12: favori couvre 49% → quasi neutre
  // Spread 13-18: favori couvre 47% → léger avantage underdog
  // Spread 19+:  favori couvre 44% → avantage underdog
  if (absSpread >= 19)     score -= 3.5
  else if (absSpread >= 13) score -= 2.0
  else if (absSpread >= 7)  score -= 0.5
  else                      score += 1.5

  // ── 5. MOMENTUM L10 ───────────────────────────────────────────────────
  const favMomentum = (fav.last10W || 5) - 5
  const dogMomentum = (dog.last10W || 5) - 5
  score += (favMomentum - dogMomentum) * 0.35

  // ── 6. SOS — FORCE DU CALENDRIER ──────────────────────────────────────
  // Underdog avec fort SOS (meilleure conférence) couvre plus souvent
  const sosDiff = (fav.sos || 5) - (dog.sos || 5)
  score -= sosDiff * 0.20  // si underdog a SOS proche du favori → couvre plus

  // ── 7. TS% — TRUE SHOOTING ────────────────────────────────────────────
  const tsDiff = fav.tsPct - dog.tsPct
  score += tsDiff * 0.08

  // ── 8. PACE MATCH ─────────────────────────────────────────────────────
  // Si pace de l'underdog est plus lent → ralentit le jeu → couvre souvent
  const paceDiff = fav.pace - dog.pace
  if (paceDiff > 4) score -= 1.0  // underdog est plus lent → bon pour cover
  if (paceDiff < -4) score += 1.0

  // ── CONVERSION EN PROBABILITÉ ─────────────────────────────────────────
  // score > 0 = favori couvre, score < 0 = underdog couvre
  // Clampé entre 35% et 75% pour rester réaliste
  const favCoverProb = Math.min(75, Math.max(35, Math.round(50 + score * 2.5)))
  const dogCoverProb = 100 - favCoverProb
  const favCovers    = favCoverProb > 50

  return {
    favCovers,
    favCoverProb,
    dogCoverProb,
    coverTeam:  favCovers ? fav : dog,
    coverProb:  Math.max(favCoverProb, dogCoverProb),
    spreadValue: spreadValue.toFixed(1),
    score: score.toFixed(2)
  }
}

// ── MODÈLE OVER/UNDER ─────────────────────────────────────────────────────
function overUnderModel(h, a, vegasTotal) {

  let score = 0  // positif = over, négatif = under

  // ── 1. PACE COMBINÉ ───────────────────────────────────────────────────
  // C'est LE facteur le plus important pour le total
  // Pace moyen NCAA = 70, chaque point au-dessus = ~1.2 pts de total
  const avgPace = (h.pace + a.pace) / 2
  score += (avgPace - 70) * 0.45

  // ── 2. eFG% COMBINÉ ───────────────────────────────────────────────────
  // eFG% élevé = bonne efficacité = plus de points
  const avgEFG = (h.eFG + a.eFG) / 2
  score += (avgEFG - 53) * 0.35

  // ── 3. DÉFENSES COMBINÉES (DRtg) ──────────────────────────────────────
  // Bonnes défenses = under
  // DRtg moyen = 100, chaque point sous la moyenne = meilleure défense
  const avgDRtg = (h.dRtg + a.dRtg) / 2
  score -= (100 - avgDRtg) * 0.40  // bonnes défenses = under

  // ── 4. OFFENSES COMBINÉES (ORtg) ──────────────────────────────────────
  const avgORtg = (h.oRtg + a.oRtg) / 2
  score += (avgORtg - 112) * 0.25

  // ── 5. TOV% COMBINÉ ───────────────────────────────────────────────────
  // Plus de turnovers = moins de possessions complètes = under
  const avgTOV = (h.tovPct + a.tovPct) / 2
  score -= (avgTOV - 14) * 0.30

  // ── 6. TRUE SHOOTING COMBINÉ ──────────────────────────────────────────
  const avgTS = (h.tsPct + a.tsPct) / 2
  score += (avgTS - 57) * 0.20

  // ── 7. FT RATE COMBINÉ ────────────────────────────────────────────────
  // Plus de lancers francs = plus de points = over
  const avgFT = (h.ftRate + a.ftRate) / 2
  score += (avgFT - 35) * 0.15

  // ── 8. ORB% COMBINÉ ───────────────────────────────────────────────────
  // Plus de rebonds offensifs = plus de possessions = over
  const avgORB = (h.orbPct + a.orbPct) / 2
  score += (avgORB - 29) * 0.12

  // ── 9. TOTAL VEGAS ────────────────────────────────────────────────────
  // Si le total Vegas est bas pour les équipes → tendance over
  // Si le total Vegas est haut pour les équipes → tendance under
  const expectedTotal = (h.oRtg + a.oRtg) / 2 * avgPace / 100 * 0.97
  const vegasVsExpected = expectedTotal - vegasTotal
  score += vegasVsExpected * 0.08

  // ── CONVERSION EN PROBABILITÉ ─────────────────────────────────────────
  const overProb  = Math.min(75, Math.max(35, Math.round(50 + score * 3.0)))
  const underProb = 100 - overProb

  return {
    isOver:    overProb > 50,
    overProb,
    underProb,
    ouProb:    Math.max(overProb, underProb),
    score:     score.toFixed(2),
    avgPace:   avgPace.toFixed(1),
    avgEFG:    avgEFG.toFixed(1),
    avgDRtg:   avgDRtg.toFixed(1)
  }
}

export function predictAdvanced(home, away, homeInj = [], awayInj = [], vegasSpread, vegasTotal) {
  const h = applyInjuries(home, homeInj)
  const a = applyInjuries(away, awayInj)

  const hFF = fourFactors(h)
  const aFF = fourFactors(a)

  // Déterminer favori/underdog selon Vegas
  const fav = (vegasSpread !== undefined && vegasSpread !== null)
    ? (vegasSpread <= 0 ? h : a)
    : (h.seed <= a.seed ? h : a)
  const dog = fav.abbr === h.abbr ? a : h
  const absSpread = Math.abs(vegasSpread || 3.5)

  // Modèle spread
  const spreadResult = spreadModel(fav, dog, absSpread)

  // Modèle over/under
  const ouResult = overUnderModel(h, a, vegasTotal || 145)

  // Probabilité victoire
  const hNet      = h.oRtg - h.dRtg
  const aNet      = a.oRtg - a.dRtg
  const netDiff   = hNet - aNet
  const sosFactor = ((h.sos || 5) - (a.sos || 5)) * 0.9
  const l10Factor = ((h.last10W || 5) - (a.last10W || 5)) * 0.7
  const seedFactor= (a.seed - h.seed) * 1.2
  const ffFactor  = (hFF.score - aFF.score) * 0.35

  const rawProb = 50 + netDiff * 1.3 + sosFactor + l10Factor + seedFactor + ffFactor
  const winProb = Math.min(95, Math.max(5, Math.round(rawProb)))

  // Confiance globale
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
    projTotal: vegasTotal || 145,
    spread: vegasSpread || 0,
    actualTotal: 0,
    absSpread: absSpread.toFixed(1)
  }
}
