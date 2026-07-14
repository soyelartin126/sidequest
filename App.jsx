import { useEffect, useRef, useState } from 'react'
import * as db from './supabase.js'
import Admin from './Admin.jsx'
import Profile from './Profile.jsx'
import BusinessHome from './BusinessHome.jsx'
import { Onboarding } from './Onboarding.jsx'
import { AuthScreen, ResetPassword } from './AuthScreen.jsx'
import { Home } from './Home.jsx'
import { Quests, Redeem, Credits } from './Quests.jsx'
import { Store } from './Store.jsx'
import { Goals, NewGoal, GoalDetail } from './Goals.jsx'
import { Groups, GroupDetail } from './Groups.jsx'
import { IconGlyph, Backdrop } from './ui.jsx'
import { resizePhoto } from './utils.js'
import {
  levelFor, streak, goalTarget, goalProgress, canCheckinToday, dayKey,
  makeRedeemCode, ITEMS, earnedItems,
  XP_CHECKIN, XP_GOAL_COMPLETE, XP_QUEST_COMPLETE,
  applyShields, addShield, backgroundStyle,
  COIN_CHECKIN, COIN_GOAL, COIN_QUEST, WELCOME_COINS,
  SKILL_XP_PER_CHECKIN, SKILL_STREAK_MILESTONE, SKILL_STREAK_BONUS_COINS, skillStreak, SKILLS,
} from './game.js'

// animo del personaje/mascota segun estado del jugador
function moodOf(goals, stk, bestStreak) {
  if (stk === 0 && (bestStreak || 0) > 0) return 'sad'
  if (goals.some(g => canCheckinToday(g))) return 'neutral'
  return 'happy'
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = cargando
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('home')
  const [view, setView] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef()
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('sq-theme') || 'dark' } catch { return 'dark' }
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
  if (!session) return <AuthScreen onNotify={notify} toast={toast} theme={theme} />
  if (!data) return <div className="app center"><div className="logo">LevelApp</div><p className="muted">Cargando tu aventura…</p></div>

  const { profile, goals, quests, groups, banners = [], myBusinesses = [] } = data
  const lvl = levelFor(profile.xp)
  const stk = streak(goals, profile.avatar?.frozenDays || [])
  const earned = earnedItems(data)
  const pendingRedeem = goals.filter(g => g.redeemCode && !g.redeemed)
  const mood = moodOf(goals, stk, profile.bestStreak)
  const appStyle = backgroundStyle(theme === 'dark')

  const needsOnb = !onbDone && !profile.avatar?.onboarded && goals.length === 0
  if (needsOnb) return (
    <div className="app">
      <Backdrop style={appStyle} />
      {toast && <div className="toast">{toast}</div>}
      <Onboarding profile={profile} onFinish={async (interests, chosen) => {
        setOnbDone(true)
        for (const g of chosen) await db.insertGoal(profile.id, g)
        await db.saveProfile({ ...profile, avatar: { ...profile.avatar, onboarded: true, interests, coins: (profile.avatar?.coins || 0) + WELCOME_COINS } })
        refresh()
      }} />
    </div>
  )

  const doCheckin = async (goal, note, photoFile, value) => {
    if (!canCheckinToday(goal)) return
    const photo = photoFile ? await resizePhoto(photoFile) : null
    await db.insertCheckin(profile.id, goal.id, { day: dayKey(), note, photo, value })
    const p = { ...profile, xp: profile.xp + XP_CHECKIN }
    p.avatar = { ...(profile.avatar || {}), coins: (profile.avatar?.coins || 0) + COIN_CHECKIN }
    const patchedGoals = goals.map(x => x.id === goal.id
      ? { ...x, checkins: [...x.checkins, { day: dayKey(), note, photo, value }] } : x)
    const skillMilestones = []
    if (goal.skills?.length > 0) {
      const skillsXp = { ...(p.avatar.skills || {}) }
      goal.skills.forEach(sid => {
        skillsXp[sid] = (skillsXp[sid] || 0) + SKILL_XP_PER_CHECKIN
        const days = skillStreak(patchedGoals, sid)
        if (days > 0 && days % SKILL_STREAK_MILESTONE === 0) skillMilestones.push({ sid, days })
      })
      p.avatar.skills = skillsXp
      if (skillMilestones.length > 0) p.avatar.coins = (p.avatar.coins || 0) + skillMilestones.length * SKILL_STREAK_BONUS_COINS
    }
    const willComplete = goalProgress(patchedGoals.find(x => x.id === goal.id)) >= goalTarget(goal)
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
      groups={groups}
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
      groups={groups}
      theme={theme} onToggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
      onAvatar={async av => { await db.saveProfile({ ...profile, avatar: av }); refresh() }}
      onEquip={async item => {
        const eq = { ...(profile.equipped || {}) }
        eq[item.slot] = eq[item.slot] === item.id ? undefined : item.id
        await db.saveProfile({ ...profile, equipped: eq }); refresh()
      }}
      onAdmin={() => setView({ name: 'admin' })}
      onCredits={() => setView({ name: 'credits' })}
      onLogout={() => db.signOut()} />,
    empresa: <BusinessHome businesses={myBusinesses} groups={groups} onNotify={notify}
      onOpenGroup={g => setView({ name: 'group', id: g.id })}
      onChanged={() => refresh()} />,
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
  } else if (view?.name === 'credits') {
    overlay = <Credits onBack={() => setView(null)} />
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
    <div className="app">
      <Backdrop style={appStyle} />
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
            ['groups', '👥', 'Grupos'],
            ...(myBusinesses.length > 0 ? [['empresa', '🏢', 'Empresa']] : []),
            ['profile', '👤', 'Perfil']].map(([id, ico, label]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
              <span className="ico"><IconGlyph icon={ico} size={28} /></span>{label}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
