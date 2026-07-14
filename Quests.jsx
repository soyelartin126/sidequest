import { useState, useEffect } from 'react'
import * as db from './supabase.js'
import { PixelCode } from './Avatar.jsx'
import { IconGlyph } from './ui.jsx'

// ---------- Premios / retos de empresas ----------
export function Quests({ quests, goals, pendingRedeem, onJoin, onRedeem }) {
  const joined = new Set(goals.map(g => g.questId).filter(Boolean))
  const activeQuests = quests.filter(q => q.active)
  const [busy, setBusy] = useState(false)
  const [joinCounts, setJoinCounts] = useState({})
  const now = Date.now()

  useEffect(() => {
    const ids = activeQuests.filter(q => q.capacity != null).map(q => q.id)
    if (ids.length === 0) { setJoinCounts({}); return }
    db.fetchQuestJoinCounts(ids).then(({ data }) => {
      const counts = {}
      for (const row of data || []) counts[row.quest_id] = +row.joined_count
      setJoinCounts(counts)
    })
  }, [activeQuests.length])

  return (
    <>
      <h1>Premios</h1>
      <p className="muted">Retos patrocinados por comercios reales. Complétalos y canjea tu premio en la tienda.</p>

      {pendingRedeem.length > 0 && <h2>Tus canjes</h2>}
      {pendingRedeem.map(g => (
        <div key={g.id} className="banner row" onClick={() => onRedeem(g)} style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: 26 }}>🏆</span>
          <div className="grow">
            <b>{g.prize}</b>
            <div className="muted small">{g.sponsor} · toca para ver el código</div>
          </div>
        </div>
      ))}

      <h2>Retos disponibles</h2>
      {activeQuests.length === 0 && <p className="muted">Pronto habrá nuevos retos.</p>}
      {activeQuests.map(q => {
        const already = joined.has(q.id)
        const taken = joinCounts[q.id] || 0
        const full = q.capacity != null && taken >= q.capacity
        const notStarted = q.startsAt && new Date(q.startsAt).getTime() > now
        const ended = q.endsAt && new Date(q.endsAt).getTime() < now
        const blocked = full || notStarted || ended
        const label = already ? 'Ya estás en este reto'
          : full ? 'Cupos agotados'
          : notStarted ? 'Aún no empieza'
          : ended ? 'Reto finalizado'
          : '¡Acepto el reto!'
        return (
          <div key={q.id} className="card">
            {q.image && <img src={q.image} alt={q.sponsor}
              style={{ width: '100%', borderRadius: 14, border: '1px solid #E6E9ED', marginBottom: 8, maxHeight: 130, objectFit: 'cover' }} />}
            <h3>{q.icon && <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 6 }}><IconGlyph icon={q.icon} size={22} /></span>}{q.title}</h3>
            <div className="muted small">Patrocina: {q.sponsor} · {q.freqPerWeek}x/semana · {q.weeks} semanas</div>
            <div className="spacer" />
            <span className="chip">🎁 {q.prize}</span>
            <span className="chip">📍 {q.comuna?.length > 0 ? q.comuna.join(', ') : 'Nacional'}</span>
            {q.capacity != null && <span className="chip">{Math.max(0, q.capacity - taken)}/{q.capacity} cupos</span>}
            <div className="spacer" />
            <button disabled={already || blocked || busy} onClick={async () => { setBusy(true); await onJoin(q); setBusy(false) }}>
              {label}
            </button>
          </div>
        )
      })}
    </>
  )
}

export function Redeem({ goal: g, onBack }) {
  return (
    <>
      <div className="topbar">
        <button className="sec mini" onClick={onBack}>← Volver</button>
        <h1>Tu canje</h1>
      </div>
      <div className="card center">
        <h3>🎁 {g.prize}</h3>
        <p className="muted">Muestra este código en {g.sponsor} para cobrar tu premio. Es de un solo uso.</p>
        <PixelCode code={g.redeemCode} />
        <div className="code">{g.redeemCode}</div>
        {g.redeemed
          ? <span className="chip ok">Canjeado ✔</span>
          : <p className="muted small">El local lo valida y lo marca como usado.</p>}
      </div>
    </>
  )
}

export function Credits({ onBack }) {
  return (
    <>
      <div className="topbar">
        <button className="sec mini" onClick={onBack}>← Volver</button>
        <h1>Créditos</h1>
      </div>
      <div className="card">
        <p className="muted small">
          Los personajes de LevelApp usan arte pixel de{' '}
          <a href="https://lpc.opengameart.org/" target="_blank" rel="noreferrer">Liberated Pixel Cup</a>{' '}
          (LPC), un proyecto de arte abierto creado por decenas de artistas de la comunidad.
        </p>
        <p className="muted small">
          Licenciado bajo{' '}
          <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>{' '}
          y{' '}
          <a href="https://static.opengameart.org/OGA-BY-3.0.txt" target="_blank" rel="noreferrer">OGA-BY 3.0</a>.
        </p>
        <p className="muted small">
          A medida que LevelApp crezca, reemplazaremos estos assets por ilustraciones propias
          encargadas a un artista.
        </p>
      </div>
    </>
  )
}
