import { useState } from 'react'
import { TEAMS } from '../data/teams'

export default function TeamPicker({ value, onChange, exclude }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '8px 10px', background: '#f3f4f6',
        border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer',
        textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#111',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>
          {value.logo
            ? <img src={value.logo} alt={value.abbr} style={{ width: 20, height: 20, objectFit: 'contain', marginRight: 6, verticalAlign: 'middle' }} />
            : value.emoji + ' '
          }
          {value.abbr} <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 10 }}>#{value.seed}</span>
        </span>
        <span style={{ color: '#9ca3af', fontSize: 9 }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          zIndex: 99, maxHeight: 260, overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}>
          {TEAMS.filter(t => t.abbr !== exclude).map(t => (
            <button key={t.abbr} onClick={() => { onChange(t); setOpen(false) }} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '9px 12px', background: value.abbr === t.abbr ? '#faf5ff' : '#fff',
              border: 'none', borderBottom: '1px solid #f3f4f6',
              cursor: 'pointer', textAlign: 'left', fontSize: 12,
            }}>
              {t.logo
                ? <img src={t.logo} alt={t.abbr} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                : <span>{t.emoji}</span>
              }
              <span style={{ fontWeight: 700, color: '#111' }}>{t.abbr}</span>
              <span style={{ color: '#9ca3af', fontSize: 11 }}>{t.name}</span>
              <span style={{ marginLeft: 'auto', color: '#7c3aed', fontWeight: 700, fontSize: 10 }}>#{t.seed}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
