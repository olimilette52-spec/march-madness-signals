const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

export async function analyzeMatchup(home, away, pred, homeInj, awayInj) {
  const { hAdj, aAdj } = pred
  const injNotes =
    [...homeInj.map(n => `${home.abbr}: ${n} (absent)`),
     ...awayInj.map(n => `${away.abbr}: ${n} (absent)`)].join(', ')
    || 'Aucune blessure déclarée'

  const prompt = `Tu es un analyste NCAA March Madness 2026. Analyse en français.

MATCHUP: ${home.name} (#${home.seed} ${home.conf}) vs ${away.name} (#${away.seed} ${away.conf})

Stats ${home.abbr} (ajustées): ORtg ${hAdj.oRtg.toFixed(1)} | DRtg ${hAdj.dRtg.toFixed(1)} | eFG% ${hAdj.eFG.toFixed(1)} | Pace ${hAdj.pace.toFixed(1)} | TS% ${home.tsPct} | TOV% ${home.tovPct} | ORB% ${home.orbPct}
Stats ${away.abbr} (ajustées): ORtg ${aAdj.oRtg.toFixed(1)} | DRtg ${aAdj.dRtg.toFixed(1)} | eFG% ${aAdj.eFG.toFixed(1)} | Pace ${aAdj.pace.toFixed(1)} | TS% ${away.tsPct} | TOV% ${away.tovPct} | ORB% ${away.orbPct}

Blessures: ${injNotes}
Modèle: ${home.abbr} ${pred.hScore} — ${away.abbr} ${pred.aScore} | Prob ${home.abbr}: ${pred.winProb}%

4 points courts:
1. AVANTAGE STATS: (stat clé qui décide)
2. IMPACT BLESSURES: (si applicable, sinon "Aucun impact majeur")
3. FACTEUR PACE: (influence sur le total)
4. ANGLE PARI: (recommandation concrète)`

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
