  // 5. Taille du spread — historique NCAA Tournament
  if (absSpread >= 22)      score -= 14.0
  else if (absSpread >= 18) score -= 10.0
  else if (absSpread >= 14) score -= 6.0
  else if (absSpread >= 10) score -= 3.0
  else if (absSpread >= 6)  score -= 1.0
  else                      score += 0.8
