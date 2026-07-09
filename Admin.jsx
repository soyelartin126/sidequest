import React, { useEffect, useState } from 'react'
import * as db from './supabase.js'
import { resizePhoto } from './utils.js'
import { ICONS, SKILLS, MAX_SKILLS_PER_GOAL } from './game.js'

export default function Admin({ quests, profile, banners = [], onBack, onNotify, onChanged }) {
  const empty = { title: '', sponsor: '', prize: '', icon: ICONS[0], skills: [], freqPerWeek: 3, weeks: 4, image: null }
  const [form, setForm] = useState(null)
  const [adminData, setAdminData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [bform, setBform] = useState({ name: '', price: 120, image: null })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleSkill = id => setForm(f => ({
    ...f,
    skills: f.skills.includes(id) ? f.skills.filter(x => x !== id)
      : f.skills.length < MAX_SKILLS_PER_GOAL ? [...f.skills, id] : f.skills,
  }))

  useEffect(() => { db.fetchAdminData().then(setAdminData) }, [])

  return (
    <>
      <div className="topbar">
        <button className="sec mini" onClick={onBack}>← Volver</button>
        <h1>Admin</h1>
      </div>
      {adminData && (
        <div className="kpis">
          {[
            ['Usuarios', adminData.metrics.totalUsers],
            ['Activos', adminData.metrics.activeUsers],
            ['2ª misión', adminData.metrics.secondMission],
            ['Misiones', adminData.metrics.goalsTotal],
            ['Completadas', adminData.metrics.goalsCompleted],
            ['Canjes', `${adminData.metrics.redUsed}/${adminData.metrics.redGen}`],
          ].map(([label, val]) => (
            <div key={label} className="kpi">
              <div className="kpi-val">{val}</div>
              <div className="kpi-lbl">{label}</div>
            </div>
          ))}
        </div>
      )}

      <h2>Retos de empresas</h2>
      {quests.map(q => (
        <div key={q.id} className="card flat">
          <div className="row">
            <div className="grow">
              <b>{q.icon && <span>{q.icon} </span>}{q.title}</b>
              <div className="muted small">{q.sponsor} · 🎁 {q.prize} · {q.freqPerWeek}x/sem · {q.weeks} sem</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button className="mini sec" onClick={async () => { await db.setQuestActive(q.id, !q.active); onChanged() }}>
                {q.active ? 'Pausar' : 'Activar'}
              </button>
              <button className="mini" onClick={() => onNotify('El anuncio por correo se activará al conectar el envío')}>
                Anunciar
              </button>
            </div>
          </div>
        </div>
      ))}
      {!form && <button onClick={() => setForm({ ...empty })}>+ Nuevo reto de empresa</button>}
      {form && (
        <div className="card">
          <label>Título del reto</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej: Entrena 3x por semana" />
          <label>Comercio patrocinador</label>
          <input value={form.sponsor} onChange={e => set('sponsor', e.target.value)} placeholder="Ej: MBIG" />
          <label>Premio</label>
          <input value={form.prize} onChange={e => set('prize', e.target.value)} placeholder="Ej: Shaker + 15% dcto." />
          <label>Ícono</label>
          <div className="icon-picker">
            {ICONS.map(ic => (
              <button key={ic} type="button" className={'icon-opt' + (form.icon === ic ? ' sel' : '')}
                onClick={() => set('icon', ic)}>{ic}</button>
            ))}
          </div>
          <label>Skills que mejora (hasta {MAX_SKILLS_PER_GOAL})</label>
          <div className="interests">
            {SKILLS.map(s => (
              <button key={s.id} type="button" className={'interest' + (form.skills.includes(s.id) ? ' on' : '')}
                onClick={() => toggleSkill(s.id)}>{s.emoji} {s.name}</button>
            ))}
          </div>
          <label>Imagen del reto (logo o foto del premio, opcional)</label>
          <input type="file" accept="image/*" onChange={async e => {
            const f = e.target.files?.[0]
            if (f) set('image', await resizePhoto(f, 640))
          }} />
          {form.image && <img src={form.image} alt="" style={{ width: '100%', borderRadius: 14, border: '1px solid #E6E9ED', marginBottom: 8, maxHeight: 120, objectFit: 'cover' }} />}
          <label>Veces por semana: {form.freqPerWeek}</label>
          <input type="range" min="1" max="7" value={form.freqPerWeek} onChange={e => set('freqPerWeek', +e.target.value)} />
          <label>Semanas: {form.weeks}</label>
          <input type="range" min="1" max="8" value={form.weeks} onChange={e => set('weeks', +e.target.value)} />
          <button disabled={!form.title || !form.sponsor || !form.prize || busy} onClick={async () => {
            setBusy(true)
            const { error } = await db.insertQuest(profile.id, form)
            setBusy(false)
            if (error) onNotify(error.message)
            else { setForm(null); onNotify('Reto publicado'); onChanged() }
          }}>Publicar reto</button>
          <div className="spacer" />
          <button className="sec" onClick={() => setForm(null)}>Cancelar</button>
        </div>
      )}

      <h2>Portadas de la tienda</h2>
      {banners.map(b => (
        <div key={b.id} className="card flat row">
          <div style={{ width: 78, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            <img src={b.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="grow"><b>{b.name || 'Banner'}</b><div className="muted small">🪙 {b.price}</div></div>
          <button className="mini sec" onClick={async () => { await db.deleteStoreItem(b.id); onChanged() }}>Quitar</button>
        </div>
      ))}
      <div className="card">
        <label>Nombre del banner</label>
        <input value={bform.name} onChange={e => setBform(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Verano MBIG" />
        <label>Precio (monedas)</label>
        <input type="number" value={bform.price} onChange={e => setBform(f => ({ ...f, price: +e.target.value }))} />
        <label>Imagen del banner</label>
        <input type="file" accept="image/*" onChange={async e => {
          const f = e.target.files?.[0]
          if (f) { const img = await resizePhoto(f, 800); setBform(b => ({ ...b, image: img })) }
        }} />
        {bform.image && <img src={bform.image} alt="" style={{ width: '100%', borderRadius: 14, marginBottom: 8, maxHeight: 120, objectFit: 'cover' }} />}
        <button disabled={!bform.image || busy} onClick={async () => {
          setBusy(true)
          const { error } = await db.insertStoreItem({ kind: 'banner', name: bform.name || null, image_url: bform.image, price: bform.price || 100 })
          setBusy(false)
          if (error) onNotify(error.message)
          else { setBform({ name: '', price: 120, image: null }); onNotify('Banner creado'); onChanged() }
        }}>Crear banner</button>
      </div>

      <h2>Usuarios ({adminData?.users.length || 0})</h2>
      {!adminData && <p className="muted">Cargando…</p>}
      {adminData?.users.map(u => (
        <div key={u.id} className="card flat row">
          <div className="grow">
            <b>{u.name}</b>
            <div className="muted small">
              {u.xp} XP · {u.goals} misiones · {u.completed} completadas · racha máx {u.bestStreak}
              {u.interests.length > 0 && ` · ${u.interests.join(', ')}`}
            </div>
          </div>
        </div>
      ))}

      <h2>Canjes (todos los usuarios)</h2>
      {!adminData && <p className="muted">Cargando…</p>}
      {adminData?.redemptions.length === 0 && <p className="muted">Aún no hay canjes generados.</p>}
      {adminData?.redemptions.map(r => (
        <div key={r.id} className="card flat row">
          <div className="grow">
            <b className="code" style={{ fontSize: 18, letterSpacing: 3 }}>{r.redeemCode}</b>
            <div className="muted small">{r.prize} · {r.sponsor} · {r.userName}</div>
          </div>
          {r.redeemed
            ? <span className="chip ok">Usado ✔</span>
            : <button className="mini" onClick={async () => {
                await db.markRedeemed(r.id)
                setAdminData(await db.fetchAdminData())
              }}>Marcar usado</button>}
        </div>
      ))}
    </>
  )
}
