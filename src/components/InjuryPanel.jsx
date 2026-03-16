export default function InjuryPanel({ team, injured, setInjured }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 }}>
        🏥 Joueurs blessés — {team.abbr}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {team.roster.map(p => {
          const isInj = injured.includes(p.name)
          return (
            <button key={p.name} onClick={() =>
              setInjured(isInj ? injured.filter(n => n !== p.name) : [...injured, p.name])
            } style={{
              padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
              border: isInj ? '2px solid #ef4444' : '2px solid #e5e7eb',
              background: isInj ? '#fee2e2' : '#f9fafb',
              color: isInj ? '#ef4444' : '#374151',
              cursor: 'pointer',
            }}>
              {isInj ? '🚑 ' : ''}{p.name}
              <span style={{ fontSize: 9, color: isInj ? '#ef4444' : '#9ca3af', marginLeft: 4 }}>
                ({p.pos} −{p.impact.toFixed(1)})
              </span>
            </button>
          )
        })}
      </div>
      {injured.length > 0 && (
        <div style={{ marginTop: 8, padding: '7px 10px', background: '#fef3c7', borderRadius: 8, fontSize: 11, color: '#92400e', fontWeight: 600 }}>
          ⚠️ {injured.length} joueur{injured.length > 1 ? 's' : ''} retiré{injured.length > 1 ? 's' : ''} du modèle
        </div>
      )}
    </div>
  )
}
