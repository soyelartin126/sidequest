import React, { useEffect, useRef, useState } from 'react'
import Avatar, { ItemSprite, PixelCode, Pet, PET_COLORS, Cover, CoverThumb, COVERS, coverById, SKINS, HAIRS, SHIRTS, BODY_SHAPES } from './Avatar.jsx'
import * as db from './supabase.js'
import Admin from './Admin.jsx'
import Profile from './Profile.jsx'
import { GoalCard, Goals, NewGoal, GoalDetail } from './Goals.jsx'
import { Bar, Pwd } from './ui.jsx'
import { resizePhoto } from './utils.js'
import {
  levelFor, streak, weekDots, goalTarget, canCheckinToday, dayKey,
  makeRedeemCode, ITEMS, earnedItems, itemById, isPermanent,
  XP_CHECKIN, XP_GOAL_COMPLETE, XP_QUEST_COMPLETE,
  applyShields, addShield, SHIELD_CAP, bgById, backgroundStyle, INTERESTS,
  COIN_CHECKIN, COIN_GOAL, COIN_QUEST, WELCOME_COINS, itemPrice, COVER_PRICE,
  SKILL_XP_PER_CHECKIN, SKILL_STREAK_MILESTONE, SKILL_STREAK_BONUS_COINS, skillStreak, SKILLS,
} from './game.js'

// animo del personaje/mascota segun estado del jugador
function moodOf(goals, stk, bestStreak) {
  if (stk === 0 && (bestStreak || 0) > 0) return 'sad'
  if (goals.some(g => canCheckinToday(g))) return 'neutral'
  return 'happy'
}

const THEMES = ['Familia', 'Trabajo', 'Amigos', 'Estudio', 'Deporte', 'Otro']

// ---------- Onboarding: bienvenida + intereses + misiones sugeridas ----------
function Onboarding({ profile, onFinish }) {
  const [step, setStep] = useState(0)
  const [sel, setSel] = useState([])
  const [picked, setPicked] = useState([])
  const [busy, setBusy] = useState(false)
  const toggleSel = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const isPicked = d => picked.some(p => p.title === d.title)
  const pick = d => setPicked(p => isPicked(d) ? p.filter(x => x.title !== d.title) : [...p, d])
  const ideas = INTERESTS.filter(i => sel.includes(i.id)).flatMap(i => i.ideas.map(d => ({ ...d, cat: i.name, icon: i.emoji })))
  const how = [
    ['🎯', 'Crea misiones', 'objetivos con frecuencia y duración'],
    ['✔️', 'Reporta cada día', 'un check-in diario mantiene tu racha'],
    ['🔥', 'Racha y escudos', 'no la pierdas; los escudos te protegen'],
    ['🗡', 'Gana XP y botín', 'sube de nivel y viste tu personaje'],
    ['🎁', 'Premios reales', 'canjea retos de comercios locales'],
  ]

  if (step === 0) return (
    <>
      <div className="logo">LevelApp</div>
      <div className="card center">
        <Avatar avatar={profile.avatar} equipped={profile.equipped} size={92} />
        <h1>¡Hola, {profile.name}!</h1>
        <p className="muted">Así funciona LevelApp</p>
        <div className="how">
          {how.map(([e, t, d]) => (
            <div key={t} className="how-row">
              <span className="how-ico">{e}</span>
              <div><b>{t}</b><div className="muted small">{d}</div></div>
            </div>
          ))}
        </div>
        <div className="spacer" />
        <button onClick={() => setStep(1)}>Siguiente</button>
      </div>
    </>
  )

  if (step === 1) return (
    <>
      <div className="logo">LevelApp</div>
      <div className="card">
        <h1>¿Qué quieres mejorar?</h1>
        <p className="muted small">Elige tus intereses y te sugiero misiones para empezar.</p>
        <div className="interests">
          {INTERESTS.map(i => (
            <button key={i.id} className={'interest' + (sel.includes(i.id) ? ' on' : '')}
              onClick={() => toggleSel(i.id)}>{i.emoji} {i.name}</button>
          ))}
        </div>
        <div className="spacer" />
        <button disabled={sel.length === 0} onClick={() => setStep(2)}>Ver sugerencias</button>
        <div className="spacer" />
        <button className="sec" onClick={() => onFinish([], [])}>Saltar por ahora</button>
      </div>
    </>
  )

  return (
    <>
      <div className="logo">LevelApp</div>
      <div className="card">
        <h1>Misiones sugeridas</h1>
        <p className="muted small">Toca las que quieras empezar. Después puedes editarlas o crear más.</p>
        {ideas.map((d, i) => (
          <div key={i} className={'suggest' + (isPicked(d) ? ' on' : '')} onClick={() => pick(d)}>
            <span style={{ fontSize: 22 }}>{d.icon}</span>
            <div className="grow">
              <b>{d.title}</b>
              <div className="muted small">{d.cat} · {d.freqPerWeek}x/sem · {d.weeks} sem</div>
            </div>
            <span className="suggest-check">{isPicked(d) ? '✔' : '+'}</span>
          </div>
        ))}
        <div className="spacer" />
        <button disabled={busy} onClick={async () => {
          setBusy(true)
          const chosen = picked.map(d => ({ title: d.title, icon: d.icon, freqPerWeek: d.freqPerWeek, weeks: d.weeks }))
          await onFinish(sel, chosen)
        }}>
          {busy ? 'Creando…' : picked.length ? `Empezar con ${picked.length} ${picked.length > 1 ? 'misiones' : 'misión'}` : 'Empezar sin misiones'}
        </button>
        <div className="spacer" />
        <button className="sec" onClick={() => setStep(1)}>← Volver</button>
      </div>
    </>
  )
}

// ---------- Pantalla de nueva contraseña (tras el link de recuperación) ----------
function ResetPassword({ toast, onNotify, onDone }) {
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <div className="app">
      {toast && <div className="toast">{toast}</div>}
      <div className="logo">LevelApp</div>
      <div className="card">
        <h1>Nueva contraseña</h1>
        <p className="muted small">Elige una contraseña nueva para tu cuenta.</p>
        <label>Nueva contraseña (mínimo 6)</label>
        <Pwd value={pw} onChange={e => setPw(e.target.value)} />
        <button disabled={busy || pw.length < 6} onClick={async () => {
          setBusy(true)
          const { error } = await db.updatePassword(pw)
          setBusy(false)
          if (error) onNotify(error.message)
          else onDone()
        }}>{busy ? 'Guardando…' : 'Guardar contraseña'}</button>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = cargando
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('home')
  const [view, setView] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef()
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('sq-theme') || 'light' } catch { return 'light' }
  })
  const [onbDone, setOnbDone] = useState(false)
  const [recovery, setRecovery] = useState(false)
  const [levelUp, setLevelUp] = useState(null)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('sq-theme', theme) } catch { /* noop */ }
  }, [theme])

  const notify = msg => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    db.getSession().then(setSession)
    const { data: sub } = db.onAuthChange((s, event) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const refresh = async (announce = false) => {
    if (!session?.user) return
    const before = data ? earnedItems(data) : null
    const next = await db.fetchState(session.user.id)
    if (next.error) { notify('Error de conexión: ' + next.error.message); return }
    // escudos de racha: tapan automaticamente los dias perdidos si alcanzan
    const sh = applyShields(next.goals, next.profile.avatar || {})
    if (sh.used > 0) {
      const p = { ...next.profile, avatar: sh.avatar }
      await db.saveProfile(p)
      next.profile = p
      setTimeout(() => notify(`🛡 Escudo de racha usado · tu racha sigue viva`), 700)
    }
    if (announce && before) {
      const after = earnedItems(next)
      const nuevos = [...after].filter(id => !before.has(id))
      if (nuevos.length) {
        const names = nuevos.map(id => ITEMS.find(i => i.id === id)?.name).join(', ')
        setTimeout(() => notify(`¡Objeto desbloqueado! ${names}`), 500)
      }
    }
    setData(next)
  }

  useEffect(() => { if (session?.user) refresh() }, [session?.user?.id])

  if (recovery) return <ResetPassword toast={toast} onNotify={notify}
    onDone={() => { setRecovery(false); notify('Contraseña actualizada'); }} />
  if (session === undefined) return <div className="app center"><div className="logo">LevelApp</div><p className="muted">Cargando…</p></div>
  if (!session) return <AuthScreen onNotify={notify} toast={toast} />
  if (!data) return <div className="app center"><div className="logo">LevelApp</div><p className="muted">Cargando tu aventura…</p></div>

  const { profile, goals, quests, groups, banners = [] } = data
  const lvl = levelFor(profile.xp)
  const stk = streak(goals, profile.avatar?.frozenDays || [])
  const earned = earnedItems(data)
  const pendingRedeem = goals.filter(g => g.redeemCode && !g.redeemed)
  const mood = moodOf(goals, stk, profile.bestStreak)
  const bg = bgById(profile.avatar?.bg)
  const appStyle = backgroundStyle(bg, theme === 'dark')

  const needsOnb = !onbDone && !profile.avatar?.onboarded && goals.length === 0
  if (needsOnb) return (
    <div className="app" style={appStyle}>
      {toast && <div className="toast">{toast}</div>}
      <Onboarding profile={profile} onFinish={async (interests, chosen) => {
        setOnbDone(true)
        for (const g of chosen) await db.insertGoal(profile.id, g)
        await db.saveProfile({ ...profile, avatar: { ...profile.avatar, onboarded: true, interests, coins: (profile.avatar?.coins || 0) + WELCOME_COINS } })
        refresh()
      }} />
    </div>
  )

  const doCheckin = async (goal, note, photoFile) => {
    if (!canCheckinToday(goal)) return
    const photo = photoFile ? await resizePhoto(photoFile) : null
    await db.insertCheckin(profile.id, goal.id, { day: dayKey(), note, photo })
    const p = { ...profile, xp: profile.xp + XP_CHECKIN }
    p.avatar = { ...(profile.avatar || {}), coins: (profile.avatar?.coins || 0) + COIN_CHECKIN }
    const skillMilestones = []
    if (goal.skills?.length > 0) {
      const skillsXp = { ...(p.avatar.skills || {}) }
      const patchedGoals = goals.map(x => x.id === goal.id
        ? { ...x, checkins: [...x.checkins, { day: dayKey(), note, photo }] } : x)
      goal.skills.forEach(sid => {
        skillsXp[sid] = (skillsXp[sid] || 0) + SKILL_XP_PER_CHECKIN
        const days = skillStreak(patchedGoals, sid)
        if (days > 0 && days % SKILL_STREAK_MILESTONE === 0) skillMilestones.push({ sid, days })
      })
      p.avatar.skills = skillsXp
      if (skillMilestones.length > 0) p.avatar.coins = (p.avatar.coins || 0) + skillMilestones.length * SKILL_STREAK_BONUS_COINS
    }
    const willComplete = goal.checkins.length + 1 >= goalTarget(goal)
    if (willComplete) {
      p.xp += goal.sponsor ? XP_QUEST_COMPLETE : XP_GOAL_COMPLETE
      if (goal.rewardItem && !p.items.includes(goal.rewardItem)) p.items = [...p.items, goal.rewardItem]
      const beforeSh = p.avatar.shields ?? 1
      p.avatar = addShield(p.avatar)
      p.avatar.coins = (p.avatar.coins || 0) + (goal.sponsor ? COIN_QUEST : COIN_GOAL)
      await db.completeGoal({ ...goal, redeemCode: goal.sponsor ? makeRedeemCode() : null })
      notify(goal.sponsor ? `¡Reto completado! Tienes un canje en ${goal.sponsor}` : '¡Misión completada!')
      if (p.avatar.shields > beforeSh) setTimeout(() => notify('🛡 +1 escudo de racha'), 1400)
    } else {
      notify(`Check-in listo · +${XP_CHECKIN} XP · +${COIN_CHECKIN} 🪙`)
    }
    if (skillMilestones.length > 0) {
      const allSkills = [...SKILLS, ...(profile.avatar?.customSkills || [])]
      skillMilestones.forEach((m, i) => {
        const s = allSkills.find(x => x.id === m.sid)
        setTimeout(() => notify(`🔥 Racha de ${m.days} días en ${s?.name || 'skill'} · +${SKILL_STREAK_BONUS_COINS} 🪙`), 1400 + i * 1400)
      })
    }
    const stNow = streak(goals) + 1
    p.bestStreak = Math.max(p.bestStreak || 0, stNow)
    await db.saveProfile(p)
    if (levelFor(p.xp).level > levelFor(profile.xp).level) setTimeout(() => setLevelUp(levelFor(p.xp)), 900)
    await refresh(true)
  }

  const screens = {
    home: <Home profile={profile} lvl={lvl} stk={stk} goals={goals} mood={mood} banners={banners}
      pendingRedeem={pendingRedeem}
      onGoal={g => setView({ name: 'goal', id: g.id })}
      onRedeem={g => setView({ name: 'redeem', id: g.id })}
      onStore={() => setView({ name: 'store' })}
      onNew={() => setView({ name: 'newGoal' })} />,
    goals: <Goals goals={goals}
      onGoal={g => setView({ name: 'goal', id: g.id })}
      onNew={() => setView({ name: 'newGoal' })} />,
    quests: <Quests quests={quests.filter(q => !q.groupId)} goals={goals} pendingRedeem={pendingRedeem}
      onJoin={async q => {
        await db.insertGoal(profile.id, { ...q, questId: q.id })
        notify(`Te uniste al reto de ${q.sponsor}`)
        await refresh(); setTab('home')
      }}
      onRedeem={g => setView({ name: 'redeem', id: g.id })} />,
    groups: <Groups groups={groups} profile={profile} onNotify={notify}
      onOpen={g => setView({ name: 'group', id: g.id })}
      onChanged={() => refresh()} />,
    profile: <Profile profile={profile} lvl={lvl} earned={earned} goals={goals} mood={mood} banners={banners}
      theme={theme} onToggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
      onAvatar={async av => { await db.saveProfile({ ...profile, avatar: av }); refresh() }}
      onEquip={async item => {
        const eq = { ...(profile.equipped || {}) }
        eq[item.slot] = eq[item.slot] === item.id ? undefined : item.id
        await db.saveProfile({ ...profile, equipped: eq }); refresh()
      }}
      onAdmin={() => setView({ name: 'admin' })}
      onLogout={() => db.signOut()} />,
  }

  let overlay = null
  if (view?.name === 'newGoal') {
    overlay = <NewGoal owned={earned} customSkills={profile.avatar?.customSkills || []}
      onAddSkill={async skill => {
        const list = [...(profile.avatar?.customSkills || []), skill]
        await db.saveProfile({ ...profile, avatar: { ...profile.avatar, customSkills: list } })
        refresh()
      }}
      onBack={() => setView(null)} onCreate={async g => {
      await db.insertGoal(profile.id, g)
      notify('¡Nueva misión creada!')
      setView(null); refresh()
    }} />
  } else if (view?.name === 'goal') {
    const g = goals.find(x => x.id === view.id)
    overlay = g && <GoalDetail goal={g} onBack={() => setView(null)}
      onCheckin={doCheckin}
      onRedeem={() => setView({ name: 'redeem', id: g.id })}
      onDelete={async () => { await db.deleteGoal(g.id); setView(null); refresh() }} />
  } else if (view?.name === 'redeem') {
    const g = goals.find(x => x.id === view.id)
    overlay = g && <Redeem goal={g} onBack={() => setView(null)} />
  } else if (view?.name === 'group') {
    const g = groups.find(x => x.id === view.id)
    overlay = g && <GroupDetail group={g} profile={profile} goals={goals}
      quests={quests.filter(q => q.groupId === g.id)}
      onBack={() => setView(null)} onNotify={notify} onChanged={() => refresh()} />
  } else if (view?.name === 'admin') {
    overlay = <Admin quests={quests.filter(q => !q.groupId)} profile={profile} banners={banners}
      onBack={() => setView(null)} onNotify={notify} onChanged={() => refresh()} />
  } else if (view?.name === 'store') {
    overlay = <Store profile={profile} lvl={lvl} earned={earned} banners={banners} onBack={() => setView(null)}
      onBuy={async (kind, id, price) => {
        const coins = profile.avatar?.coins || 0
        if (coins < price) { notify('No te alcanzan las monedas'); return }
        const av = { ...(profile.avatar || {}), coins: coins - price }
        const p = { ...profile, avatar: av }
        if (kind === 'item') { if (!p.items.includes(id)) p.items = [...p.items, id] }
        else if (kind === 'cover') { av.ownedCovers = [...(av.ownedCovers || []), id] }
        await db.saveProfile(p)
        notify('¡Comprado! 🎉'); refresh()
      }} />
  }

  return (
    <div className="app" style={appStyle}>
      {toast && <div className="toast">{toast}</div>}
      {levelUp && (
        <div className="modal-bg" onClick={() => setLevelUp(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 46 }}>🎉</div>
            <h1>¡Subiste de nivel!</h1>
            <div><span className="chip prim" style={{ fontSize: 15 }}>Nivel {levelUp.level} · {levelUp.title}</span></div>
            <p className="muted small">¡Sigue así! Cada check-in te acerca al siguiente nivel.</p>
            <button onClick={() => setLevelUp(null)}>¡Genial!</button>
          </div>
        </div>
      )}
      {overlay || screens[tab]}
      {!overlay && (
        <nav className="nav">
          {[['home', '🏠', 'Inicio'], ['goals', '⚔️', 'Misiones'], ['quests', '🎁', 'Premios'],
            ['groups', '👥', 'Grupos'], ['profile', '👤', 'Perfil']].map(([id, ico, label]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
              <span className="ico">{ico}</span>{label}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

// ---------- Auth: login + registro con personaje ----------
function AuthScreen({ onNotify, toast }) {
  const [mode, setMode] = useState('login') // login | signup | signup2
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })
  const [avatar, setAvatar] = useState({ skin: SKINS[0], hair: HAIRS[0], shirt: SHIRTS[0] })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const Sw = ({ colors, k }) => (
    <div className="swatches">
      {colors.map(c => (
        <div key={c} className={'swatch' + (avatar[k] === c ? ' sel' : '')}
          style={{ background: c }} onClick={() => setAvatar(a => ({ ...a, [k]: c }))} />
      ))}
    </div>
  )
  const submitLogin = async () => {
    setBusy(true)
    const { error } = await db.signIn(form.email.trim(), form.password)
    setBusy(false)
    if (error) onNotify(error.message.includes('Invalid') ? 'Correo o contraseña incorrectos' : error.message)
  }
  const submitSignup = async () => {
    setBusy(true)
    const { error } = await db.signUp({
      email: form.email.trim(), password: form.password,
      name: form.name.trim(), phone: form.phone.trim(), avatar,
    })
    setBusy(false)
    if (error) onNotify(error.message)
  }
  return (
    <div className="app auth-bg" style={backgroundStyle(bgById('bosque'), false)}>
      {toast && <div className="toast">{toast}</div>}
      <div className="logo">LevelApp</div>
      <div className="tagline">Gamifica tu vida · cumple objetivos · gana premios reales</div>

      {mode === 'login' && (
        <div className="card">
          <h1>Entrar</h1>
          <label>Correo</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" />
          <label>Contraseña</label>
          <Pwd value={form.password} onChange={e => set('password', e.target.value)} />
          <button disabled={busy || !form.email || !form.password} onClick={submitLogin}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
          <div className="spacer" />
          <button className="sec" onClick={() => setMode('signup')}>Crear cuenta nueva</button>
          <button className="link-btn" onClick={() => setMode('forgot')}>¿Olvidaste tu contraseña?</button>
        </div>
      )}

      {mode === 'forgot' && (
        <div className="card">
          <h1>Recuperar contraseña</h1>
          <p className="muted small">Te enviaremos un enlace a tu correo para crear una nueva contraseña.</p>
          <label>Correo</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" />
          <button disabled={busy || !form.email.includes('@')} onClick={async () => {
            setBusy(true)
            const { error } = await db.resetPassword(form.email)
            setBusy(false)
            onNotify(error ? error.message : 'Si el correo existe, te enviamos un enlace')
            if (!error) setMode('login')
          }}>{busy ? 'Enviando…' : 'Enviar enlace'}</button>
          <div className="spacer" />
          <button className="sec" onClick={() => setMode('login')}>← Volver</button>
        </div>
      )}

      {mode === 'signup' && (
        <div className="card">
          <h1>Crear cuenta</h1>
          <label>Tu nombre</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Martín" maxLength={20} />
          <label>Correo</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" />
          <label>Teléfono (opcional)</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+56 9 …" />
          <label>Contraseña (mínimo 6 caracteres)</label>
          <Pwd value={form.password} onChange={e => set('password', e.target.value)} />
          <button disabled={!form.name.trim() || !form.email.includes('@') || form.password.length < 6}
            onClick={() => setMode('signup2')}>
            Siguiente: tu personaje →
          </button>
          <div className="spacer" />
          <button className="sec" onClick={() => setMode('login')}>Ya tengo cuenta</button>
        </div>
      )}

      {mode === 'signup2' && (
        <>
          <div className="card center">
            <Avatar avatar={avatar} size={110} />
            <h1>Crea tu personaje</h1>
          </div>
          <div className="card">
            <label>Forma</label>
            <div className="swatches">
              {BODY_SHAPES.map(b => (
                <div key={b.id} title={b.name}
                  className={'hair-opt' + ((avatar.body || 'a') === b.id ? ' sel' : '')}
                  onClick={() => setAvatar(a => ({ ...a, body: b.id }))}>
                  <Avatar avatar={{ ...avatar, body: b.id }} size={42} />
                </div>
              ))}
            </div>
            <label>Piel</label><Sw colors={SKINS} k="skin" />
            <label>Pelo</label><Sw colors={HAIRS} k="hair" />
            <label>Polera</label><Sw colors={SHIRTS} k="shirt" />
            <button disabled={busy} onClick={submitSignup}>
              {busy ? 'Creando cuenta…' : '¡Comenzar la aventura!'}
            </button>
            <div className="spacer" />
            <button className="sec" onClick={() => setMode('signup')}>← Volver</button>
          </div>
        </>
      )}
    </div>
  )
}

// ---------- Inicio ----------
function Home({ profile, lvl, stk, goals, mood = 'happy', banners = [], pendingRedeem, onGoal, onRedeem, onNew, onStore }) {
  const active = goals.filter(g => g.status === 'active')
  const dots = weekDots(goals)
  const shields = profile.avatar?.shields ?? 1
  const coins = profile.avatar?.coins || 0
  const petColor = profile.avatar?.petColor ?? PET_COLORS[0]
  const coverBanner = banners.find(b => b.id === profile.avatar?.cover)
  return (
    <>
      <Cover id={coverById(profile.avatar?.cover).id} image={coverBanner?.image} greeting={`Hola, ${profile.name}`} sub="Gamifica tu vida" />

      <div className="card row lift">
        <Avatar avatar={profile.avatar} equipped={profile.equipped} size={84} mood={mood} />
        <div className="grow">
          <h1>{profile.name}</h1>
          <span className="chip">Nivel {lvl.level} · {lvl.title}</span>
          <div className="spacer" />
          <Bar frac={lvl.progress} />
          <div className="muted small">
            {lvl.next ? `${profile.xp} / ${lvl.next.xp} XP` : `${profile.xp} XP · nivel máximo`}
          </div>
        </div>
      </div>

      <div className="coinbar">
        <span className="chip" style={{ background: '#FFF0D6', color: '#8A5A00', fontSize: 14 }}>🪙 {coins} monedas</span>
        <button className="mini acc" onClick={onStore}>🛍 Tienda</button>
      </div>

      <div className="card">
        <div className="row">
          <span style={{ fontSize: 30 }}>🔥</span>
          <div className="grow">
            <h3>Racha: {stk} {stk === 1 ? 'día' : 'días'}</h3>
            <div className="dots">
              {dots.map((d, i) => (
                <div key={i} className={'dot' + (d.done ? ' on' : '') + (d.future ? ' future' : '')}>{d.label}</div>
              ))}
            </div>
            <div className="shields" title="Los escudos protegen tu racha si te saltas un día">
              {Array.from({ length: SHIELD_CAP }, (_, i) => (
                <span key={i} className={'shield-ico' + (i < shields ? '' : ' spent')}>🛡</span>
              ))}
              <span className="muted small">{shields}/{SHIELD_CAP} escudos</span>
            </div>
          </div>
          <Pet color={petColor} size={62} mood={mood} name="Pixi" />
        </div>
      </div>

      {pendingRedeem.map(g => (
        <div key={g.id} className="banner row" onClick={() => onRedeem(g)} style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: 28 }}>🏆</span>
          <div className="grow">
            <b>¡Tienes un canje disponible!</b>
            <div className="muted small">{g.prize} · {g.sponsor} — toca para ver tu código</div>
          </div>
        </div>
      ))}

      <h2>Misiones activas</h2>
      {active.length === 0 && (
        <div className="card center">
          <p className="muted">Sin misiones activas. ¡Crea tu primer objetivo!</p>
          <button onClick={onNew}>+ Nueva misión</button>
        </div>
      )}
      {active.map(g => <GoalCard key={g.id} g={g} onClick={() => onGoal(g)} />)}
      {active.length > 0 && <button className="sec" onClick={onNew}>+ Nueva misión</button>}
    </>
  )
}

// ---------- Premios / retos de empresas ----------
function Quests({ quests, goals, pendingRedeem, onJoin, onRedeem }) {
  const joined = new Set(goals.map(g => g.questId).filter(Boolean))
  const activeQuests = quests.filter(q => q.active)
  const [busy, setBusy] = useState(false)
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
        return (
          <div key={q.id} className="card">
            {q.image && <img src={q.image} alt={q.sponsor}
              style={{ width: '100%', borderRadius: 14, border: '1px solid #E6E9ED', marginBottom: 8, maxHeight: 130, objectFit: 'cover' }} />}
            <h3>{q.icon && <span>{q.icon} </span>}{q.title}</h3>
            <div className="muted small">Patrocina: {q.sponsor} · {q.freqPerWeek}x/semana · {q.weeks} semanas</div>
            <div className="spacer" />
            <span className="chip">🎁 {q.prize}</span>
            <div className="spacer" />
            <button disabled={already || busy} onClick={async () => { setBusy(true); await onJoin(q); setBusy(false) }}>
              {already ? 'Ya estás en este reto' : '¡Acepto el reto!'}
            </button>
          </div>
        )
      })}
    </>
  )
}

function Redeem({ goal: g, onBack }) {
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

// ---------- Grupos ----------
function Groups({ groups, profile, onOpen, onNotify, onChanged }) {
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
          <span style={{ fontSize: 26 }}>👥</span>
          <div className="grow">
            <h3>{g.name}</h3>
            <div className="muted small">{g.theme} · {g.members.length} {g.members.length === 1 ? 'miembro' : 'miembros'}</div>
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
            if (error) onNotify('Código no válido')
            else { onNotify('¡Bienvenido al grupo!'); setMode(null); setCode(''); onChanged() }
          }}>Unirme</button>
          <div className="spacer" />
          <button className="sec" onClick={() => setMode(null)}>Cancelar</button>
        </div>
      )}
    </>
  )
}

function GroupDetail({ group: g, profile, goals, quests, onBack, onNotify, onChanged }) {
  const isAdmin = g.myRole === 'admin' || g.ownerId === profile.id
  const joined = new Set(goals.map(x => x.questId).filter(Boolean))
  const [form, setForm] = useState(null)
  const [progress, setProgress] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const ids = quests.map(q => q.id)
    if (ids.length === 0) { setProgress({}); return }
    db.fetchQuestGoals(ids).then(({ data }) => {
      const by = {}
      for (const row of data || []) {
        by[row.quest_id] = by[row.quest_id] || []
        by[row.quest_id].push({ userId: row.user_id, count: (row.checkins || []).length, status: row.status })
      }
      setProgress(by)
    })
  }, [quests.length])

  const nameOf = id => g.members.find(m => m.id === id)?.name || '—'

  return (
    <>
      <div className="topbar">
        <button className="sec mini" onClick={onBack}>← Volver</button>
        <h1>{g.name}</h1>
      </div>

      <div className="card">
        <div className="muted small">Tema: {g.theme} · Código de invitación:</div>
        <div className="code" style={{ fontSize: 22, letterSpacing: 4 }}>{g.inviteCode}</div>
        <div className="muted small">Compártelo para que se unan al grupo.</div>
      </div>

      <h2>Miembros ({g.members.length})</h2>
      <div className="card flat">
        {g.members.map(m => (
          <div key={m.id} className="hist">
            <span style={{ fontSize: 18 }}>👤</span>
            <div className="grow"><b>{m.name}</b></div>
            {m.role === 'admin' && <span className="chip">admin</span>}
          </div>
        ))}
      </div>

      <h2>Retos del grupo</h2>
      {quests.length === 0 && <p className="muted">Aún no hay retos. {isAdmin ? 'Crea el primero.' : 'El admin puede crearlos.'}</p>}
      {quests.filter(q => q.active).map(q => {
        const rows = (progress?.[q.id] || [])
        const target = Math.max(1, Math.round(q.freqPerWeek * q.weeks))
        return (
          <div key={q.id} className="card">
            <h3>{q.title}</h3>
            <div className="muted small">{q.freqPerWeek}x/semana · {q.weeks} semanas · meta {target} check-ins</div>
            <div className="spacer" />
            {rows.length === 0 && <p className="muted small">Nadie se ha unido todavía.</p>}
            {rows.map((r, i) => (
              <div key={i} className="hist">
                <div className="grow"><b>{nameOf(r.userId)}</b></div>
                <div style={{ width: 130 }}><Bar frac={r.count / target} /></div>
                <span className="muted small">{r.status === 'completed' ? '🏆' : `${r.count}/${target}`}</span>
              </div>
            ))}
            <div className="spacer" />
            <button disabled={joined.has(q.id) || busy} onClick={async () => {
              setBusy(true)
              await db.insertGoal(profile.id, { title: q.title, icon: q.icon, freqPerWeek: q.freqPerWeek, weeks: q.weeks, questId: q.id })
              setBusy(false); onNotify('¡Te uniste al reto del grupo!'); onChanged()
            }}>
              {joined.has(q.id) ? 'Ya estás en este reto' : 'Unirme al reto'}
            </button>
          </div>
        )
      })}

      {isAdmin && !form && <button onClick={() => setForm({ title: '', freqPerWeek: 3, weeks: 2 })}>+ Nuevo reto del grupo</button>}
      {form && (
        <div className="card">
          <h3>Nuevo reto para {g.name}</h3>
          <label>Título</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej: Todos al gym 3x esta semana" maxLength={60} />
          <label>Veces por semana: {form.freqPerWeek}</label>
          <input type="range" min="1" max="7" value={form.freqPerWeek} onChange={e => set('freqPerWeek', +e.target.value)} />
          <label>Semanas: {form.weeks}</label>
          <input type="range" min="1" max="8" value={form.weeks} onChange={e => set('weeks', +e.target.value)} />
          <button disabled={!form.title.trim() || busy} onClick={async () => {
            setBusy(true)
            const { error } = await db.insertQuest(profile.id, { ...form, groupId: g.id })
            setBusy(false)
            if (error) onNotify(error.message)
            else { onNotify('¡Reto publicado al grupo!'); setForm(null); onChanged() }
          }}>Publicar reto</button>
          <div className="spacer" />
          <button className="sec" onClick={() => setForm(null)}>Cancelar</button>
        </div>
      )}
    </>
  )
}

// ---------- Tienda (comprar con monedas) ----------
function Store({ profile, lvl, earned, banners = [], onBack, onBuy }) {
  const coins = profile.avatar?.coins || 0
  const ownedCovers = profile.avatar?.ownedCovers || []
  const loot = ITEMS.filter(it => it.kind === 'loot')
  return (
    <>
      <div className="topbar">
        <button className="sec mini" onClick={onBack}>← Volver</button>
        <h1>Tienda</h1>
      </div>
      <div className="card center">
        <div style={{ fontSize: 28, fontWeight: 800, color: '#8A5A00' }}>🪙 {coins}</div>
        <div className="muted small">Ganas monedas con cada check-in y misión completada</div>
      </div>

      <h2>Objetos</h2>
      <div className="items">
        {loot.map(it => {
          const owned = earned.has(it.id)
          const price = itemPrice(it)
          return (
            <div key={it.id} className="item">
              <ItemSprite id={it.id} />
              <div className="nm">{it.name}</div>
              {owned
                ? <div className="muted small">✔ Tienes</div>
                : <button className="mini" style={{ marginTop: 6 }} disabled={coins < price}
                    onClick={() => onBuy('item', it.id, price)}>🪙 {price}</button>}
            </div>
          )
        })}
      </div>

      <h2>Portadas</h2>
      <div className="bgs">
        {COVERS.map(c => {
          const avail = lvl.level >= c.minLevel || ownedCovers.includes(c.id)
          return (
            <div key={c.id} className="cover-opt">
              <div className="cover-thumb"><CoverThumb id={c.id} /></div>
              {avail
                ? <div className="bg-nm">{lvl.level >= c.minLevel ? `Nv ${c.minLevel}` : 'Comprada ✔'}</div>
                : <button className="mini" style={{ marginTop: 4, padding: '5px 8px', fontSize: 11, width: '100%' }}
                    disabled={coins < COVER_PRICE} onClick={() => onBuy('cover', c.id, COVER_PRICE)}>🪙 {COVER_PRICE}</button>}
            </div>
          )
        })}
        {banners.map(b => {
          const owned = ownedCovers.includes(b.id)
          return (
            <div key={b.id} className="cover-opt">
              <div className="cover-thumb"><CoverThumb image={b.image} /></div>
              {owned
                ? <div className="bg-nm">Comprada ✔</div>
                : <button className="mini" style={{ marginTop: 4, padding: '5px 8px', fontSize: 11, width: '100%' }}
                    disabled={coins < b.price} onClick={() => onBuy('cover', b.id, b.price)}>🪙 {b.price}</button>}
            </div>
          )
        })}
      </div>
      <p className="muted small">Las portadas también se desbloquean gratis al subir de nivel; aquí puedes comprarlas antes.</p>
    </>
  )
}

