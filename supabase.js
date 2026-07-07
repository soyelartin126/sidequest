// ---- Capa de datos: Supabase (auth + base de datos) ----
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vibhdvdnauopyqhoqspo.supabase.co'
const SUPABASE_KEY = 'sb_publishable_LQe92Nv_dJrzyoxIVf-I5A_OVGcuu1z'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

// ---------- mapeos fila <-> estado de la app ----------
const rowToProfile = r => ({
  id: r.id, name: r.name, phone: r.phone || '',
  avatar: r.avatar || {}, equipped: r.equipped || {}, items: r.items || [],
  xp: r.xp, bestStreak: r.best_streak, isAdmin: r.is_admin,
})

const rowToGoal = r => ({
  id: r.id, title: r.title, sponsor: r.sponsor, prize: r.prize,
  image: r.image_url, freqPerWeek: r.freq_per_week, weeks: +r.weeks,
  rewardItem: r.reward_item, status: r.status, questId: r.quest_id,
  redeemCode: r.redeem_code, redeemed: r.redeemed, userId: r.user_id,
  checkins: (r.checkins || [])
    .sort((a, b) => a.day.localeCompare(b.day))
    .map(c => ({ day: c.day, note: c.note || '', photo: c.photo_url || null })),
})

const rowToQuest = r => ({
  id: r.id, title: r.title, sponsor: r.sponsor, prize: r.prize,
  image: r.image_url, freqPerWeek: r.freq_per_week, weeks: +r.weeks,
  active: r.active, groupId: r.group_id, createdBy: r.created_by,
})

// ---------- auth ----------
export const getSession = () => sb.auth.getSession().then(({ data }) => data.session)
export const onAuthChange = cb => sb.auth.onAuthStateChange((event, s) => cb(s, event))
export const signIn = (email, password) => sb.auth.signInWithPassword({ email, password })
export const signOut = () => sb.auth.signOut()
export const resetPassword = email =>
  sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
export const updatePassword = password => sb.auth.updateUser({ password })

export async function signUp({ email, password, name, phone, avatar }) {
  const { data, error } = await sb.auth.signUp({ email, password })
  if (error) return { error }
  const user = data.user
  const { error: e2 } = await sb.from('profiles').insert({
    id: user.id, name, phone, avatar, equipped: {}, items: [],
  })
  return { user, error: e2 }
}

// ---------- carga de estado ----------
export async function fetchState(userId) {
  const [p, g, q, gm] = await Promise.all([
    sb.from('profiles').select('*').eq('id', userId).single(),
    sb.from('goals').select('*, checkins(*)').eq('user_id', userId).order('created_at'),
    sb.from('quests').select('*').order('created_at'),
    sb.from('group_members').select('role, groups(*)').eq('user_id', userId),
  ])
  if (p.error) return { error: p.error }
  const groups = []
  for (const m of gm.data || []) {
    if (!m.groups) continue
    const { data: members } = await sb.from('group_members')
      .select('user_id, role, profiles(name)').eq('group_id', m.groups.id)
    groups.push({
      id: m.groups.id, name: m.groups.name, theme: m.groups.theme,
      inviteCode: m.groups.invite_code, ownerId: m.groups.owner_id, myRole: m.role,
      members: (members || []).map(x => ({
        id: x.user_id, role: x.role, name: x.profiles?.name || '—',
      })),
    })
  }
  return {
    profile: rowToProfile(p.data),
    goals: (g.data || []).map(rowToGoal),
    quests: (q.data || []).map(rowToQuest),
    groups,
  }
}

// ---------- escrituras ----------
// nota: is_admin NO se escribe desde el cliente (solo se controla en la BD).
export const saveProfile = p => sb.from('profiles').update({
  name: p.name, phone: p.phone, avatar: p.avatar, equipped: p.equipped,
  items: p.items, xp: p.xp, best_streak: p.bestStreak,
}).eq('id', p.id)

export const insertGoal = (userId, g) => sb.from('goals').insert({
  user_id: userId, title: g.title, sponsor: g.sponsor || null, prize: g.prize || null,
  image_url: g.image || null, freq_per_week: g.freqPerWeek, weeks: g.weeks,
  reward_item: g.rewardItem || null, quest_id: g.questId || null,
}).select().single()

export const deleteGoal = id => sb.from('goals').delete().eq('id', id)

export const insertCheckin = (userId, goalId, c) => sb.from('checkins').insert({
  user_id: userId, goal_id: goalId, day: c.day, note: c.note || null, photo_url: c.photo || null,
})

export const completeGoal = g => sb.from('goals').update({
  status: 'completed', completed_at: new Date().toISOString(),
  redeem_code: g.redeemCode || null,
}).eq('id', g.id)

export const markRedeemed = id => sb.from('goals').update({ redeemed: true }).eq('id', id)

export const insertQuest = (userId, q) => sb.from('quests').insert({
  title: q.title, sponsor: q.sponsor || null, prize: q.prize || null,
  image_url: q.image || null, freq_per_week: q.freqPerWeek, weeks: q.weeks,
  active: true, group_id: q.groupId || null, created_by: userId,
})

export const setQuestActive = (id, active) => sb.from('quests').update({ active }).eq('id', id)

// ---------- grupos ----------
const makeInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export async function createGroup(userId, name, theme) {
  const { data, error } = await sb.from('groups').insert({
    name, theme, owner_id: userId, invite_code: makeInviteCode(),
  }).select().single()
  if (error) return { error }
  const { error: e2 } = await sb.from('group_members').insert({
    group_id: data.id, user_id: userId, role: 'admin',
  })
  return { group: data, error: e2 }
}

export async function joinGroup(userId, code) {
  // buscar el grupo por codigo via rpc simple: los no-miembros no pueden hacer select,
  // asi que usamos una funcion? Para el MVP: select publico del codigo exacto
  const { data, error } = await sb.rpc('join_group_by_code', { code })
  if (error) return { error }
  return { groupId: data }
}

// progreso de los miembros en los retos de un grupo
export const fetchQuestGoals = questIds => sb.from('goals')
  .select('user_id, quest_id, status, checkins(day)').in('quest_id', questIds)

// ---------- admin (ve todo gracias a las policies) ----------
export async function fetchAdminData() {
  const [redemptionsQ, profilesQ, goalsQ] = await Promise.all([
    sb.from('goals').select('id, title, sponsor, prize, redeem_code, redeemed, user_id')
      .not('redeem_code', 'is', null).order('completed_at', { ascending: false }),
    sb.from('profiles').select('id, name, xp, best_streak, avatar'),
    sb.from('goals').select('user_id, status'),
  ])
  const profiles = profilesQ.data || []
  const goals = goalsQ.data || []
  const names = Object.fromEntries(profiles.map(u => [u.id, u.name]))
  const byUser = {}
  goals.forEach(g => { (byUser[g.user_id] = byUser[g.user_id] || []).push(g) })

  const users = profiles.map(u => {
    const gs = byUser[u.id] || []
    return {
      id: u.id, name: u.name, xp: u.xp, bestStreak: u.best_streak || 0,
      interests: (u.avatar && u.avatar.interests) || [],
      goals: gs.length, active: gs.filter(g => g.status === 'active').length,
      completed: gs.filter(g => g.status === 'completed').length,
    }
  }).sort((a, b) => b.xp - a.xp)

  const redemptions = (redemptionsQ.data || []).map(r => ({
    id: r.id, title: r.title, sponsor: r.sponsor, prize: r.prize,
    redeemCode: r.redeem_code, redeemed: r.redeemed, userName: names[r.user_id] || '—',
  }))

  return {
    users, redemptions, userCount: profiles.length,
    metrics: {
      totalUsers: profiles.length,
      activeUsers: users.filter(u => u.active > 0).length,
      goalsTotal: goals.length,
      goalsCompleted: goals.filter(g => g.status === 'completed').length,
      secondMission: users.filter(u => u.goals >= 2).length,
      redGen: redemptions.length,
      redUsed: redemptions.filter(r => r.redeemed).length,
    },
  }
}
