import { useRef, useState } from 'react'
import * as db from './supabase.js'
import { CompanyBadge, IconGlyph } from './ui.jsx'
import { resizePhoto } from './utils.js'

function BusinessCard({ business, teams, onOpenGroup, onNotify, onChanged }) {
  const [creating, setCreating] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [busy, setBusy] = useState(false)
  const logoInput = useRef(null)

  return (
    <div className="card">
      <div className="row">
        <div className="grow"><CompanyBadge name={business.name} logo={business.logo} size={22} /></div>
        <button className="mini sec" onClick={() => logoInput.current?.click()}>Cambiar logo</button>
        <input ref={logoInput} type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
          const f = e.target.files?.[0]
          if (!f) return
          const dataUrl = await resizePhoto(f, 240)
          const { error } = await db.updateBusinessLogo(business.id, dataUrl)
          if (error) onNotify(error.message)
          else { onNotify('Logo actualizado'); onChanged() }
        }} />
      </div>

      <div className="spacer" />
      {teams.length === 0 && <p className="muted small">Aún no tienes equipos en esta empresa.</p>}
      {teams.map(g => (
        <div key={g.id} className="hist" onClick={() => onOpenGroup(g)} style={{ cursor: 'pointer' }}>
          <IconGlyph icon="👥" size={18} />
          <div className="grow">
            <b>{g.name}</b>
            <div className="muted small">{g.members.length} {g.members.length === 1 ? 'miembro' : 'miembros'}</div>
          </div>
        </div>
      ))}

      <div className="spacer" />
      {!creating && <button className="sec mini" onClick={() => setCreating(true)}>+ Nuevo equipo</button>}
      {creating && (
        <div className="row">
          <input className="grow" value={teamName} onChange={e => setTeamName(e.target.value)}
            placeholder="Ej: Ventas" maxLength={30} />
          <button className="mini" disabled={!teamName.trim() || busy} onClick={async () => {
            setBusy(true)
            const { error } = await db.createBusinessGroup(business.id, teamName.trim(), 'Trabajo')
            setBusy(false)
            if (error) onNotify(error.message)
            else { onNotify('¡Equipo creado!'); setTeamName(''); setCreating(false); onChanged() }
          }}>Crear</button>
          <button className="mini sec" onClick={() => { setCreating(false); setTeamName('') }}>Cancelar</button>
        </div>
      )}
    </div>
  )
}

export default function BusinessHome({ businesses, groups, onOpenGroup, onNotify, onChanged }) {
  return (
    <>
      <h1>Empresa</h1>
      <p className="muted">Arma tus equipos, invita a tu gente y crea retos internos.</p>
      {businesses.map(b => (
        <BusinessCard key={b.id} business={b} teams={groups.filter(g => g.businessId === b.id)}
          onOpenGroup={onOpenGroup} onNotify={onNotify} onChanged={onChanged} />
      ))}
    </>
  )
}
