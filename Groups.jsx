import { useState, useEffect } from 'react'
import * as db from './supabase.js'
import { Bar, IconGlyph, CompanyBadge } from './ui.jsx'
import { resizePhoto } from './utils.js'
import { goalProgress, THEMES } from './game.js'

export function Groups({ groups, profile, onOpen, onNotify, onChanged }) {
  const [mode, setMode] = useState(null) // null | create | join
  const [name, setName] = useState('')
  const [theme, setTheme] = useState(THEMES[0])
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <>
      <h1>Grupos</h1>
      <p className="muted">Familia, trabajo, amigos: retos temáticos compartidos y el avance de todos.</p>

      {groups.map(g => (
        <div key={g.id} className="card row" onClick={() => onOpen(g)} style={{ cursor: 'pointer' }}>
          <IconGlyph icon="👥" size={26} />
          <div className="grow">
            <h3>{g.name}</h3>
            <div className="muted small">{g.theme} · {g.members.length} {g.members.length === 1 ? 'miembro' : 'miembros'}</div>
            {g.businessName && <CompanyBadge name={g.businessName} logo={g.businessLogo} />}
          </div>
          {(g.myRole === 'admin' || g.ownerId === profile.id) && <span className="chip">admin</span>}
        </div>
      ))}
      {groups.length === 0 && <div className="card center"><p className="muted">Aún no estás en ningún grupo.</p></div>}

      {!mode && (
        <>
          <button onClick={() => setMode('create')}>+ Crear grupo</button>
          <div className="spacer" />
          <button className="sec" onClick={() => setMode('join')}>Unirme con un código</button>
        </>
      )}

      {mode === 'create' && (
        <div className="card">
          <h3>Nuevo grupo</h3>
          <label>Nombre</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Los Ortega" maxLength={30} />
          <label>Tema</label>
          <select value={theme} onChange={e => setTheme(e.target.value)}>
            {THEMES.map(t => <option key={t}>{t}</option>)}
          </select>
          <button disabled={!name.trim() || busy} onClick={async () => {
            setBusy(true)
            const { error } = await db.createGroup(profile.id, name.trim(), theme)
            setBusy(false)
            if (error) onNotify(error.message)
            else { onNotify('¡Grupo creado!'); setMode(null); setName(''); onChanged() }
          }}>Crear grupo</button>
          <div className="spacer" />
          <button className="sec" onClick={() => setMode(null)}>Cancelar</button>
        </div>
      )}

      {mode === 'join' && (
        <div className="card">
          <h3>Unirme a un grupo</h3>
          <label>Código de invitación</label>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={6} />
          <button disabled={code.length !== 6 || busy} onClick={async () => {
            setBusy(true)
            const { error } = await db.joinGroup(profile.id, code)
            setBusy(false)
            if (error) {
              onNotify(error.message?.includes('not_invited')
                ? 'Tu correo no está autorizado por esta empresa. Pídele al admin que te agregue.'
                : 'Código no válido')
            } else { onNotify('¡Bienvenido al grupo!'); setMode(null); setCode(''); onChanged() }
          }}>Unirme</button>
          <div className="spacer" />
          <button className="sec" onClick={() => setMode(null)}>Cancelar</button>
        </div>
      )}
    </>
  )
}

export function GroupDetail({ group: g, profile, goals, quests, onBack, onNotify, onChanged }) {
  const isAdmin = g.myRole === 'admin' || g.ownerId === profile.id
  const joined = new Set(goals.map(x => x.questId).filter(Boolean))
  const [form, setForm] = useState(null)
  const [progress, setProgress] = useState(null)
  const [busy, setBusy] = useState(false)
  const [invites, setInvites] = useState(null)
  const [newEmail, setNewEmail] = useState('')
  const [winnerPick, setWinnerPick] = useState({})
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const ids = quests.map(q => q.id)
    if (ids.length === 0) { setProgress({}); return }
    db.fetchQuestGoals(ids).then(({ data }) => {
      const by = {}
      for (const row of data || []) {
        by[row.quest_id] = by[row.quest_id] || []
        by[row.quest_id].push({ userId: row.user_id, checkins: row.checkins || [], status: row.status })
      }
      setProgress(by)
    })
  }, [quests.length])

  useEffect(() => {
    if (!isAdmin || !g.businessId) return
    db.fetchCompanyInvites(g.id).then(({ data }) => setInvites(data || []))
  }, [g.id, g.businessId, isAdmin])

  const nameOf = id => g.members.find(m => m.id === id)?.name || '—'

  return (
    <>
      <div className="topbar">
        <button className="sec mini" onClick={onBack}>← Volver</button>
        <h1>{g.name}</h1>
      </div>
      {g.businessName && <CompanyBadge name={g.businessName} logo={g.businessLogo} size={20} />}

      <div className="card">
        <div className="muted small">Tema: {g.theme} · Código de invitación:</div>
        <div className="code" style={{ fontSize: 22, letterSpacing: 4 }}>{g.inviteCode}</div>
        <div className="muted small">
          {g.businessId
            ? 'Compártelo con tu equipo: solo los correos que autorices abajo podrán usarlo.'
            : 'Compártelo para que se unan al grupo.'}
        </div>
      </div>

      {isAdmin && g.businessId && (
        <>
          <h2>Equipo autorizado</h2>
          <div className="card flat">
            {invites === null && <p className="muted small">Cargando…</p>}
            {invites?.length === 0 && <p className="muted small">Aún no agregas correos. Nadie puede unirse todavía.</p>}
            {invites?.map(inv => (
              <div key={inv.id} className="hist">
                <IconGlyph icon="✉️" size={18} />
                <div className="grow">
                  <b>{inv.email}</b>
                  {inv.joined_user_id && <span className="muted small"> · ya se unió</span>}
                </div>
                <button className="mini sec" onClick={async () => {
                  await db.removeCompanyInvite(inv.id)
                  setInvites(list => list.filter(x => x.id !== inv.id))
                }}>Quitar</button>
              </div>
            ))}
          </div>
          <div className="card">
            <label>Agregar correo al equipo</label>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="persona@empresa.com" />
            <button disabled={!newEmail.includes('@') || busy} onClick={async () => {
              setBusy(true)
              const { data, error } = await db.addCompanyInvite(g.id, newEmail)
              setBusy(false)
              if (error) onNotify(error.message.includes('duplicate') ? 'Ese correo ya está autorizado' : error.message)
              else {
                setNewEmail('')
                if (data?.[0]?.id) db.sendTeamInvite(data[0].id).catch(() => {})
                db.fetchCompanyInvites(g.id).then(({ data }) => setInvites(data || []))
              }
            }}>+ Agregar</button>
          </div>
        </>
      )}

      <h2>Miembros ({g.members.length})</h2>
      <div className="card flat">
        {g.members.map(m => (
          <div key={m.id} className="hist">
            <IconGlyph icon="👤" size={18} />
            <div className="grow"><b>{m.name}</b></div>
            {m.role === 'admin' && <span className="chip">admin</span>}
          </div>
        ))}
      </div>

      <h2>Retos del grupo</h2>
      {quests.length === 0 && <p className="muted">Aún no hay retos. {isAdmin ? 'Crea el primero.' : 'El admin puede crearlos.'}</p>}
      {quests.filter(q => q.active).map(q => {
        const kind = q.kind || 'constancia'
        let rows = (progress?.[q.id] || []).map(r => ({ ...r, progress: goalProgress({ kind, checkins: r.checkins }) }))
        const target = kind === 'numero' ? (q.targetNumber || Infinity) : Math.max(1, Math.round(q.freqPerWeek * q.weeks))
        if (kind === 'numero') rows = [...rows].sort((a, b) => b.progress - a.progress)
        return (
          <div key={q.id} className="card">
            <h3>{q.title}</h3>
            {kind === 'numero' && (
              <div className="muted small">Meta: {q.targetNumber} {q.unitLabel || ''} · ranking del equipo</div>
            )}
            {kind === 'constancia' && (
              <div className="muted small">{q.freqPerWeek}x/semana · {q.weeks} semanas · meta {target} check-ins</div>
            )}
            {kind === 'reconocimiento' && (
              <div className="muted small">Reconocimiento · el admin elige a quién premiar</div>
            )}
            {q.prize && <span className="chip">🎁 {q.prize}</span>}
            <div className="spacer" />

            {kind === 'reconocimiento' ? (
              q.awardedTo ? (
                <div className="card flat center" style={{ marginBottom: 0 }}>
                  <b>🏆 {nameOf(q.awardedTo)}</b>
                  {q.prize && <div className="muted small">{q.prize}</div>}
                </div>
              ) : isAdmin ? (
                <>
                  <select value={winnerPick[q.id] || ''} onChange={e => setWinnerPick(w => ({ ...w, [q.id]: e.target.value }))}>
                    <option value="">Elegir integrante…</option>
                    {g.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <button disabled={!winnerPick[q.id] || busy} onClick={async () => {
                    setBusy(true)
                    const { error } = await db.awardRecognition(q.id, winnerPick[q.id])
                    setBusy(false)
                    if (error) onNotify(error.message)
                    else { onNotify('¡Reconocimiento otorgado!'); onChanged() }
                  }}>Elegir ganador</button>
                </>
              ) : <p className="muted small">Aún sin ganador.</p>
            ) : (
              <>
                {rows.length === 0 && <p className="muted small">Nadie se ha unido todavía.</p>}
                {rows.map((r, i) => (
                  <div key={i} className="hist">
                    {kind === 'numero' && <b style={{ width: 22 }}>{i + 1}º</b>}
                    <div className="grow"><b>{nameOf(r.userId)}</b></div>
                    <div style={{ width: 130 }}><Bar frac={target === Infinity ? 0 : r.progress / target} /></div>
                    <span className="muted small">
                      {r.status === 'completed' ? '🏆' : kind === 'numero' ? `${r.progress}/${q.targetNumber} ${q.unitLabel || ''}` : `${r.progress}/${target}`}
                    </span>
                  </div>
                ))}
                <div className="spacer" />
                <button disabled={joined.has(q.id) || busy} onClick={async () => {
                  setBusy(true)
                  await db.insertGoal(profile.id, {
                    title: q.title, icon: q.icon, freqPerWeek: q.freqPerWeek, weeks: q.weeks, questId: q.id,
                    kind: q.kind, targetNumber: q.targetNumber, unitLabel: q.unitLabel, prize: q.prize, image: q.image,
                  })
                  setBusy(false); onNotify('¡Te uniste al reto del grupo!'); onChanged()
                }}>
                  {joined.has(q.id) ? 'Ya estás en este reto' : 'Unirme al reto'}
                </button>
              </>
            )}
          </div>
        )
      })}

      {isAdmin && !form && <button onClick={() => setForm({ kind: 'constancia', title: '', freqPerWeek: 3, weeks: 2, targetNumber: '', unitLabel: '', prize: '', image: null })}>+ Nuevo reto del grupo</button>}
      {form && (
        <div className="card">
          <h3>Nuevo reto para {g.name}</h3>
          <label>Tipo de reto</label>
          <select value={form.kind} onChange={e => set('kind', e.target.value)}>
            <option value="constancia">Constancia (check-in periódico)</option>
            <option value="numero">Número / ranking (ej: ventas, unidades)</option>
            <option value="reconocimiento">Reconocimiento (ej: empleado del mes)</option>
          </select>
          <label>Título</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej: Todos al gym 3x esta semana" maxLength={60} />
          {form.kind === 'constancia' && (
            <>
              <label>Veces por semana: {form.freqPerWeek}</label>
              <input type="range" min="1" max="7" value={form.freqPerWeek} onChange={e => set('freqPerWeek', +e.target.value)} />
              <label>Semanas: {form.weeks}</label>
              <input type="range" min="1" max="8" value={form.weeks} onChange={e => set('weeks', +e.target.value)} />
            </>
          )}
          {form.kind === 'numero' && (
            <>
              <label>Meta numérica</label>
              <input type="number" min="1" value={form.targetNumber} onChange={e => set('targetNumber', e.target.value)} placeholder="Ej: 500" />
              <label>Unidad</label>
              <input value={form.unitLabel} onChange={e => set('unitLabel', e.target.value)} placeholder="Ej: ventas, unidades" maxLength={30} />
            </>
          )}
          <label>Premio (opcional)</label>
          <input value={form.prize} onChange={e => set('prize', e.target.value)} placeholder="Ej: Día libre, bono, entrada al cine" maxLength={60} />
          <label className="muted small">Imagen del premio (opcional)</label>
          <input type="file" accept="image/*" onChange={async e => {
            const f = e.target.files?.[0]
            if (f) set('image', await resizePhoto(f, 640))
          }} />
          {form.image && <img src={form.image} alt="" style={{ width: '100%', borderRadius: 14, border: '1px solid #E6E9ED', marginBottom: 8, maxHeight: 120, objectFit: 'cover' }} />}
          <button disabled={!form.title.trim() || (form.kind === 'numero' && !form.targetNumber) || busy} onClick={async () => {
            setBusy(true)
            const { data, error } = await db.insertQuest(profile.id, { ...form, groupId: g.id })
            setBusy(false)
            if (error) onNotify(error.message)
            else {
              onNotify('¡Reto publicado al grupo!'); setForm(null); onChanged()
              if (data?.id) db.notifyNewQuest(data.id).catch(() => {})
            }
          }}>Publicar reto</button>
          <div className="spacer" />
          <button className="sec" onClick={() => setForm(null)}>Cancelar</button>
        </div>
      )}
    </>
  )
}
