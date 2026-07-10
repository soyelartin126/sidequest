import { useState } from 'react'
import { ItemSprite } from './Avatar.jsx'
import { Bar, TierBadge, IconGlyph } from './ui.jsx'
import {
  goalTarget, isPermanent, itemById, canCheckinToday, goalDays, XP_CHECKIN,
  ICONS, SKILLS, MAX_SKILLS_PER_GOAL, tierForDays, DURATIONS, TIERS, eligibleLoot,
} from './game.js'

export function GoalCard({ g, onClick }) {
  const t = goalTarget(g)
  const done = g.checkins.length
  const perm = isPermanent(g)
  const reward = g.rewardItem && itemById(g.rewardItem)
  return (
    <div className="card" onClick={onClick} style={{ cursor: 'pointer' }}>
      {g.image && <img src={g.image} alt="" style={{ width: '100%', borderRadius: 14, border: '1px solid #E6E9ED', marginBottom: 8, maxHeight: 110, objectFit: 'cover' }} />}
      <div className="row">
        {g.icon && <div className="goal-icon"><IconGlyph icon={g.icon} size={32} /></div>}
        <div className="grow">
          <h3>{g.title}</h3>
          {g.sponsor
            ? <div className="muted small">Patrocina: {g.sponsor}</div>
            : <div className="muted small">{g.questId ? 'Reto grupal · ' : 'Objetivo personal · '}
                {perm ? <span className="chip" style={{ background: '#3582DB', color: '#fff' }}>♾ Permanente</span> : <TierBadge weeks={g.weeks} />}</div>}
        </div>
        <b>{perm ? `${done} ♾` : `${done}/${t}`}</b>
      </div>
      <div className="spacer" />
      {!perm && <Bar frac={done / t} />}
      {g.skills?.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
          {g.skills.map(sid => {
            const s = SKILLS.find(x => x.id === sid)
            return s && <span key={sid} className="chip"><IconGlyph icon={s.emoji} size={14} /> {s.name}</span>
          })}
        </div>
      )}
      {g.prize && <div><span className="chip">🎁 {g.prize}</span></div>}
      {reward && <div><span className="chip"><ItemSprite id={reward.id} size={14} /> Botín: {reward.name}</span></div>}
      {canCheckinToday(g)
        ? <div><span className="chip ok">Check-in pendiente hoy</span></div>
        : g.status === 'active' && <div><span className="chip">✔ Hecho por hoy</span></div>}
    </div>
  )
}

// ---------- Misiones ----------
export function Goals({ goals, onGoal, onNew }) {
  const active = goals.filter(g => g.status === 'active')
  const completed = goals.filter(g => g.status === 'completed')
  return (
    <>
      <h1>Misiones</h1>
      <button onClick={onNew}>+ Nueva misión</button>
      <h2>Activas ({active.length})</h2>
      {active.length === 0 && <p className="muted">Nada por aquí todavía.</p>}
      {active.map(g => <GoalCard key={g.id} g={g} onClick={() => onGoal(g)} />)}
      <h2>Completadas ({completed.length})</h2>
      {completed.map(g => (
        <div key={g.id} className="card flat row" onClick={() => onGoal(g)} style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: 22 }}>🏅</span>
          <div className="grow">
            <b>{g.title}</b>
            <div className="muted small">{g.sponsor ? `Reto de ${g.sponsor}` : 'Objetivo personal'}</div>
          </div>
        </div>
      ))}
    </>
  )
}

export function NewGoal({ owned, customSkills = [], onAddSkill, onBack, onCreate }) {
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState(ICONS[0])
  const [skills, setSkills] = useState([])
  const allSkills = [...SKILLS, ...customSkills]
  const toggleSkill = id => setSkills(s => s.includes(id) ? s.filter(x => x !== id)
    : s.length < MAX_SKILLS_PER_GOAL ? [...s, id] : s)
  const [addingSkill, setAddingSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillIcon, setNewSkillIcon] = useState(ICONS[0])
  const [freq, setFreq] = useState(3)
  const [durIdx, setDurIdx] = useState(5)
  const weeks = DURATIONS[durIdx].weeks
  const permanent = weeks === 0
  const [reward, setReward] = useState(null)
  const [busy, setBusy] = useState(false)
  const tier = tierForDays(Math.round(weeks * 7))
  const loot = eligibleLoot(freq, weeks, owned)
  if (reward && !loot.some(it => it.id === reward)) setReward(null)
  return (
    <>
      <div className="topbar">
        <button className="sec mini" onClick={onBack}>← Volver</button>
        <h1>Nueva misión</h1>
      </div>
      <div className="card">
        <label>¿Qué quieres lograr?</label>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Ej: Ir al gym, leer 20 min, salir a trotar" maxLength={60} />
        <label>Ícono</label>
        <div className="icon-picker">
          {ICONS.map(ic => (
            <button key={ic} type="button" className={'icon-opt' + (icon === ic ? ' sel' : '')}
              onClick={() => setIcon(ic)}><IconGlyph icon={ic} size={20} /></button>
          ))}
        </div>
        <label>Skills que mejora (hasta {MAX_SKILLS_PER_GOAL})</label>
        <div className="interests">
          {allSkills.map(s => (
            <button key={s.id} type="button" className={'interest' + (skills.includes(s.id) ? ' on' : '')}
              onClick={() => toggleSkill(s.id)}><IconGlyph icon={s.emoji} size={16} /> {s.name}</button>
          ))}
          <button type="button" className="interest" onClick={() => setAddingSkill(a => !a)}>+ Crear mi skill</button>
        </div>
        {addingSkill && (
          <div className="card flat">
            <label>Nombre de tu skill</label>
            <input value={newSkillName} onChange={e => setNewSkillName(e.target.value)}
              placeholder="Ej: Fitness, Programación, Networking" maxLength={24} />
            <label>Ícono</label>
            <div className="icon-picker">
              {ICONS.map(ic => (
                <button key={ic} type="button" className={'icon-opt' + (newSkillIcon === ic ? ' sel' : '')}
                  onClick={() => setNewSkillIcon(ic)}><IconGlyph icon={ic} size={20} /></button>
              ))}
            </div>
            <button disabled={!newSkillName.trim()} onClick={() => {
              const skill = { id: crypto.randomUUID(), name: newSkillName.trim(), emoji: newSkillIcon }
              onAddSkill(skill)
              toggleSkill(skill.id)
              setNewSkillName(''); setAddingSkill(false)
            }}>Crear skill</button>
          </div>
        )}
        <label>Frecuencia: {freq === 7 ? 'Todos los días' : `${freq} veces por semana`}</label>
        <input type="range" min="1" max="7" value={freq} onChange={e => setFreq(+e.target.value)} />
        <label>Duración: {DURATIONS[durIdx].label}</label>
        <input type="range" min="0" max={DURATIONS.length - 1} value={durIdx} onChange={e => setDurIdx(+e.target.value)} />
        {permanent ? (
          <p className="muted small">
            ♾ Reto permanente · sin fecha de término · máximo 1 check-in por día. Suma XP y mantiene tu racha; no tiene premio de fin porque no termina.
          </p>
        ) : (
          <>
            <p className="muted small">
              Meta total: {Math.max(1, Math.round(freq * weeks))} check-ins · máximo 1 por día · dificultad:{' '}
              <span className="chip" style={{ background: tier.color, color: '#fff' }}>{tier.name}</span>
            </p>
            <div className="tier-legend">
              <p className="muted small" style={{ margin: '0 0 8px' }}>
                La dificultad depende de cuántos días dura tu misión: mientras más larga, más difícil y mejor es el botín que puedes ganar.
              </p>
              {Object.entries(TIERS).map(([id, t]) => (
                <div key={id} className="tier-row">
                  <span className="chip" style={{ background: t.color, color: '#fff', minWidth: 78, textAlign: 'center' }}>{t.name}</span>
                  <span className="muted small">{t.maxDays === Infinity ? `${t.minDays}+ días` : `${t.minDays}–${t.maxDays} días`}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {permanent ? (
        <div className="card">
          <p className="muted small">Los retos permanentes no tienen botín de fin: te motivan con XP diario y tu racha.</p>
          <button disabled={!title.trim() || busy} onClick={async () => {
            setBusy(true)
            await onCreate({ title: title.trim(), icon, skills, freqPerWeek: freq, weeks, rewardItem: null })
          }}>{busy ? 'Creando…' : 'Crear reto permanente'}</button>
        </div>
      ) : (
        <div className="card">
          <h3>Elige tu botín 🗡</h3>
          <p className="muted small">
            Completa la misión y ganas el objeto. Misiones más largas e intensas desbloquean mejor botín.
          </p>
          {loot.length === 0 && <p className="muted">Ya tienes todo el botín de este nivel. ¡Sube la duración o frecuencia!</p>}
          <div className="items">
            {loot.map(it => (
              <div key={it.id} className={'item' + (reward === it.id ? ' equipped' : '')}
                onClick={() => setReward(r => r === it.id ? null : it.id)}>
                <ItemSprite id={it.id} />
                <div className="nm">{it.name}</div>
                <div className="muted small" style={{ color: TIERS[it.tier].color, fontWeight: 700 }}>
                  {TIERS[it.tier].name} · {it.reqCheckins}✔
                </div>
              </div>
            ))}
          </div>
          <div className="spacer" />
          <button disabled={!title.trim() || busy} onClick={async () => {
            setBusy(true)
            await onCreate({ title: title.trim(), icon, skills, freqPerWeek: freq, weeks, rewardItem: reward })
          }}>
            {busy ? 'Creando…' : reward ? `Crear misión (botín: ${itemById(reward).name})` : 'Crear misión sin botín'}
          </button>
        </div>
      )}
    </>
  )
}

export function GoalDetail({ goal: g, onBack, onCheckin, onRedeem, onDelete }) {
  const [note, setNote] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const t = goalTarget(g)
  const perm = isPermanent(g)
  const can = canCheckinToday(g)
  return (
    <>
      <div className="topbar">
        <button className="sec mini" onClick={onBack}>← Volver</button>
        <h1 style={{ fontSize: 18 }}>{g.title}</h1>
      </div>
      <div className="card">
        {g.sponsor && <span className="chip prim">Reto de {g.sponsor}</span>}
        {g.prize && <span className="chip">🎁 {g.prize}</span>}
        {perm && <span className="chip" style={{ background: '#3582DB', color: '#fff' }}>♾ Permanente</span>}
        <div className="spacer" />
        {perm ? (
          <div className="muted small">{g.checkins.length} check-ins · {g.freqPerWeek === 7 ? 'todos los días' : `${g.freqPerWeek}x por semana`} · sin fecha de término</div>
        ) : (
          <>
            <Bar frac={g.checkins.length / t} />
            <div className="muted small">{g.checkins.length} de {t} check-ins · {g.freqPerWeek}x por semana · {goalDays(g)} días</div>
          </>
        )}
      </div>

      {g.status === 'completed' ? (
        <div className="card center">
          <h3>🏆 ¡Misión completada!</h3>
          {g.redeemCode && !g.redeemed && <button className="acc" onClick={onRedeem}>Ver mi canje</button>}
          {g.redeemed && <p className="muted">Premio ya canjeado. ¡A por la próxima!</p>}
        </div>
      ) : (
        <div className="card">
          <h3>Check-in de hoy</h3>
          {can ? (
            <>
              <input value={note} onChange={e => setNote(e.target.value)}
                placeholder="Nota opcional (¿cómo te fue?)" maxLength={80} />
              <label className="muted small">Foto de evidencia (opcional)</label>
              <input type="file" accept="image/*" capture="environment"
                onChange={e => setFile(e.target.files?.[0] || null)} />
              <button disabled={busy} onClick={async () => {
                setBusy(true)
                await onCheckin(g, note, file)
                setNote(''); setFile(null); setBusy(false)
              }}>
                {busy ? 'Guardando…' : `✔ Reportar avance (+${XP_CHECKIN} XP)`}
              </button>
            </>
          ) : <p className="muted">Ya hiciste el check-in de hoy. Vuelve mañana 💪</p>}
        </div>
      )}

      <h2>Historial</h2>
      <div className="card flat">
        {g.checkins.length === 0 && <p className="muted">Aún no hay check-ins.</p>}
        {[...g.checkins].reverse().map((c, i) => (
          <div key={i} className="hist">
            {c.photo ? <img className="photo-thumb" src={c.photo} alt="" /> : <span style={{ fontSize: 20 }}>✔</span>}
            <div className="grow">
              <b>{c.day}</b>
              {c.note && <div className="muted small">{c.note}</div>}
            </div>
            <span className="muted small">+{XP_CHECKIN} XP</span>
          </div>
        ))}
      </div>
      {g.status === 'active' && (
        <button className="sec" onClick={() => confirm('¿Abandonar esta misión?') && onDelete()}>
          Abandonar misión
        </button>
      )}
    </>
  )
}
