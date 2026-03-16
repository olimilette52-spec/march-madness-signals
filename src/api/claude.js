const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

export async function analyzeMatchup(home, away, pred, homeInj, awayInj, vegasSpread, vegasTotal) {
  const { hAdj, aAdj } = pred
  const injNotes =
    [...homeInj.map(n => `${home.abbr}: ${n} (absent)`),
     ...awayInj.map(n => `${away.abbr}: ${n} (absent)`)].join(', ')
    || 'Aucune blessure déclarée'

  const hasVegas = vegasSpread !== undefined && vegasTotal !== undefined
  const vegasLine = hasVegas
    ? `Spread Vegas: ${vegasSpread > 0 ? '+' : ''}${vegasSpread} | Total Vegas: ${vegasTotal}`
    : 'Lignes Vegas non disponibles'

  const spreadDiff = hasVegas ? (pred.spread - vegasSpread).toFixed(1) : null
  const totalDiff  = hasVegas ? (pred.actualTotal - vegasTotal).toFixed(1) : null

  const prompt = `Tu es un analyste sportif expert NCAA March Madness 2026. Analyse en français.

MATCHUP: ${home.name} (#${home.seed} ${home.conf}) vs ${away.name} (#${away.seed} ${away.conf})

STATS AVANCÉES ${home.abbr}:
ORtg: ${hAdj.oRtg.toFixed(1)} | DRtg: ${hAdj.dRtg.toFixed(1)} | NET: ${(hAdj.oRtg - hAdj.dRtg).toFixed(1)}
eFG%: ${hAdj.eFG.toFixed(1)} | TOV%: ${home.tovPct} | ORB%: ${home.orbPct} | TS%: ${home.tsPct} | FT Rate: ${home.ftRate}
Pace: ${hAdj.pace.toFixed(1)} | SOS: ${home.sos} | L10: ${home.last10W}-${home.last10L} | Four Factors: ${pred.hFF}

STATS AVANCÉES ${away.abbr}:
ORtg: ${aAdj.oRtg.toFixed(1)} | DRtg: ${aAdj.dRtg.toFixed(1)} | NET: ${(aAdj.oRtg - aAdj.dRtg).toFixed(1)}
eFG%: ${aAdj.eFG.toFixed(1)} | TOV%: ${away.tovPct} | ORB%: ${away.orbPct} | TS%: ${away.tsPct} | FT Rate: ${away.ftRate}
Pace: ${aAdj.pace.toFixed(1)} | SOS: ${away.sos} | L10: ${away.last10W}-${away.last10L} | Four Factors: ${pred.aFF}

BLESSURES: ${injNotes}

MODÈLE PRÉDIT: ${home.abbr} ${pred.hScore} — ${away.abbr} ${pred.aScore}
Total modèle: ${pred.actualTotal} | Spread modèle: ${pred.spread > 0 ? '-' : '+'}${Math.abs(pred.spread).toFixed(1)}
Prob victoire ${home.abbr}: ${pred.winProb}% | Confiance: ${pred.confidence}

LIGNES VEGAS: ${vegasLine}
${hasVegas ? `Écart spread modèle vs Vegas: ${spreadDiff > 0 ? '+' : ''}${spreadDiff} pts` : ''}
${hasVegas ? `Écart total modèle vs Vegas: ${totalDiff > 0 ? '+' : ''}${totalDiff} pts` : ''}

Donne une analyse en 5 points courts:
1. AVANTAGE STATS: (quelle stat avancée clé décide ce match)
2. IMPACT BLESSURES: (si applicable, sinon "Aucun impact majeur")
3. ANALYSE VEGAS: (compare notre modèle aux lignes Vegas, y a-t-il une value bet?)
4. FACTEUR CLÉ: (élément tactique décisif - pace, eFG%, TOV%, etc.)
5. RECOMMANDATION: (spread ou total à jouer avec niveau de confiance)

Sois direct, précis, comme un vrai analyste sportif professionnel.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  return data.content?.find(b => b.type === 'text')?.text || 'Erreur.'
}
