import { useState, useEffect, useRef } from 'react'
import * as db from './supabase.js'
import { Bar, IconGlyph } from './ui.jsx'
import { canCheckinToday, hitInfo, totalDamage, currentHp, HP_LOSS_BOSS_HIT } from './game.js'

// mientras la pantalla esta abierta, el jefe "ataca" cada cierto tiempo
// (con variacion para que no se sienta metronomico) y el boton de esquivar
// va cambiando de zona hasta que se acaba el tiempo o lo tocas
const DODGE_MIN_DELAY = 15000
const DODGE_MAX_DELAY = 25000
const DODGE_REPOSITION_MS = 1300
const POLL_MS = 20000
const randSpot = () => ({ x: 15 + Math.random() * 70, y: 12 + Math.random() * 55 })

export function BossFight({ group: g, quest: q, profile, myGoal, onBack, onCheckin, onNotify, onHpChange, onChanged }) {
  const [rows, setRows] = useState([])
  const [attacking, setAttacking] = useState(false)
  const [hitPopup, setHitPopup] = useState(null)
  const [shake, setShake] = useState(false)
  const [dodge, setDodge] = useState(null) // {x, y}
  const [dodgeLeft, setDodgeLeft] = useState(0)
  const tapRef = useRef(() => {})
  const defeatedRef = useRef(false)
  const nameOf = id => g.members.find(m => m.id === id)?.name || '—'

  const fetchProgress = () => {
    db.fetchQuestGoals([q.id]).then(({ data }) => {
      setRows((data || []).map(r => ({ userId: r.user_id, checkins: r.checkins || [] })))
    })
  }
  useEffect(() => {
    fetchProgress()
    const t = setInterval(fetchProgress, POLL_MS)
    return () => clearInterval(t)
  }, [q.id])

  const bossDamage = rows.reduce((sum, r) => sum + totalDamage(r.checkins.length), 0)
  const bossHp = Math.max(0, (q.targetNumber || 0) - bossDamage)
  const defeated = bossHp <= 0
  const ended = q.endsAt && new Date(q.endsAt).getTime() < Date.now()

  // avisa al servidor apenas se detecta el daño letal (una sola vez)
  useEffect(() => {
    if (defeated && !q.awardedAt && !defeatedRef.current) {
      defeatedRef.current = true
      db.defeatBoss(q.id).then(({ error }) => {
        if (!error) { onNotify('🏆 ¡Jefe derrotado! Recompensa para todo el equipo.'); onChanged() }
      })
    }
  }, [defeated, q.awardedAt])

  // contraataque del jefe: se repite mientras la pantalla este abierta
  useEffect(() => {
    if (defeated || q.awardedAt || ended) { setDodge(null); return }
    let cancelled = false
    let nextTimer, tickTimer, repoTimer
    const seconds = Math.max(1, q.freqPerWeek || 4)

    const scheduleNext = () => {
      if (cancelled) return
      const delay = DODGE_MIN_DELAY + Math.random() * (DODGE_MAX_DELAY - DODGE_MIN_DELAY)
      nextTimer = setTimeout(startAttack, delay)
    }
    const endAttack = success => {
      clearInterval(tickTimer); clearInterval(repoTimer)
      setDodge(null)
      tapRef.current = () => {}
      if (!success) onHpChange(Math.max(0, currentHp(profile.avatar) - HP_LOSS_BOSS_HIT))
      scheduleNext()
    }
    const startAttack = () => {
      if (cancelled) return
      const deadline = Date.now() + seconds * 1000
      setDodge(randSpot())
      setDodgeLeft(seconds)
      repoTimer = setInterval(() => setDodge(d => d && randSpot()), DODGE_REPOSITION_MS)
      tickTimer = setInterval(() => {
        const left = deadline - Date.now()
        setDodgeLeft(Math.max(0, Math.ceil(left / 1000)))
        if (left <= 0) endAttack(false)
      }, 200)
      tapRef.current = () => endAttack(true)
    }
    scheduleNext()
    return () => {
      cancelled = true
      clearTimeout(nextTimer); clearInterval(tickTimer); clearInterval(repoTimer)
      tapRef.current = () => {}
    }
  }, [defeated, q.awardedAt, ended, q.id, q.freqPerWeek])

  const canAttack = myGoal && canCheckinToday(myGoal) && !defeated && !q.awardedAt && !ended
  const nextHit = hitInfo((myGoal?.checkins.length || 0) + 1)

  const handleAttack = async () => {
    if (!canAttack || attacking) return
    setAttacking(true)
    await onCheckin(myGoal, '', null, null)
    setHitPopup(nextHit)
    setShake(true)
    setTimeout(() => setShake(false), 400)
    setTimeout(() => setHitPopup(null), 1400)
    setAttacking(false)
    fetchProgress()
  }

  return (
    <>
      <div className="topbar">
        <button className="sec mini" onClick={onBack}>← Volver</button>
        <h1 style={{ fontSize: 18 }}>{q.title}</h1>
      </div>

      <div className="card center" style={{ position: 'relative', overflow: 'hidden', minHeight: 220 }}>
        {q.image
          ? <img src={q.image} alt="" className={shake ? 'boss-shake' : ''}
              style={{ width: '55%', maxWidth: 220, borderRadius: 14, margin: '0 auto' }} />
          : <div className={shake ? 'boss-shake' : ''} style={{ fontSize: 72 }}>👹</div>}
        {hitPopup && (
          <div style={{
            position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
            fontWeight: 800, fontSize: hitPopup.special ? 30 : 22,
            color: hitPopup.special ? '#F5811F' : '#fff',
          }}>
            -{hitPopup.damage}{hitPopup.special ? ' ¡ESPECIAL!' : ''}
          </div>
        )}
        {dodge && (
          <button className="acc" style={{ position: 'absolute', left: `${dodge.x}%`, top: `${dodge.y}%` }}
            onClick={() => tapRef.current()}>
            ¡Esquivar! ({dodgeLeft}s)
          </button>
        )}
      </div>

      <div className="card">
        {q.awardedAt ? (
          <div className="center">
            <h3>🏆 ¡Jefe derrotado!</h3>
            {q.prize && <p className="muted">{q.prize}</p>}
          </div>
        ) : ended ? (
          <p className="muted small">El desafío terminó sin derrotar al jefe. ¡Buen intento, equipo! 💪</p>
        ) : (
          <>
            <Bar frac={q.targetNumber ? bossHp / q.targetNumber : 0} />
            <div className="muted small">{bossHp}/{q.targetNumber} HP</div>
            <div className="spacer" />
            <button disabled={!canAttack || attacking} onClick={handleAttack}>
              {attacking ? 'Atacando…' : canAttack ? '⚔️ ¡Atacar!' : 'Ya atacaste hoy · vuelve mañana'}
            </button>
          </>
        )}
      </div>

      <h2>Contribución del equipo</h2>
      <div className="card flat">
        {rows.length === 0 && <p className="muted small">Nadie ha atacado todavía.</p>}
        {rows.map((r, i) => (
          <div key={i} className="hist">
            <IconGlyph icon="👤" size={18} />
            <div className="grow"><b>{nameOf(r.userId)}</b></div>
            <span className="muted small">{r.checkins.length} golpes</span>
          </div>
        ))}
      </div>
    </>
  )
}
