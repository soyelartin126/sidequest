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
  icon: r.meta?.icon || null, skills: r.meta?.skills || [],
  kind: r.kind || 'constancia', targetNumber: r.target_number ?? null, unitLabel: r.unit_label || '',
  awardedTo: r.awarded_to || null, awardedAt: r.awarded_at || null,
  checkins: (r.checkins || [])
    .sort((a, b) => a.day.localeCompare(b.day))
    .map(c => ({ day: c.day, note: c.note || '', photo: c.photo_url || null, value: c.value ?? null })),
})

const rowToQuest = r => ({
  id: r.id, title: r.title, sponsor: r.sponsor, prize: r.prize,
  image: r.image_url, freqPerWeek: r.freq_per_week, weeks: +r.weeks,
  active: r.active, groupId: r.group_id, createdBy: r.created_by,
  icon: r.meta?.icon || null, skills: r.meta?.skills || [],
  businessId: r.business_id, comuna: r.comuna || [], capacity: r.capacity ?? null,
  startsAt: r.starts_at, endsAt: r.ends_at,
  kind: r.kind || 'constancia', targetNumber: r.target_number ?? null, unitLabel: r.unit_label || '',
  awardedTo: r.awarded_to || null, awardedAt: r.awarded_at || null,
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
  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { name, phone, avatar } },
  })
  if (error) return { error }
  return { user: data.user, error: null }
}

// ---------- carga de estado ----------
export async function fetchState(userId) {
  const [p, g, q, gm, si, mb, lc] = await Promise.all([
    sb.from('profiles').select('*').eq('id', userId).single(),
    sb.from('goals').select('*, checkins(*)').eq('user_id', userId).order('created_at'),
    sb.from('quests').select('*').order('created_at'),
    sb.from('group_members').select('role, groups(*, businesses(id, name, logo_url))').eq('user_id', userId),
    sb.from('store_items').select('*').eq('active', true).order('created_at'),
    sb.from('businesses').select('id, name, logo_url').eq('owner_id', userId),
    sb.from('level_covers').select('id, image_url'),
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
      businessId: m.groups.businesses?.id || null,
      businessName: m.groups.businesses?.name || null,
      businessLogo: m.groups.businesses?.logo_url || null,
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
    banners: (si.data || []).filter(r => r.kind === 'banner').map(r => ({
      id: r.id, name: r.name, image: r.image_url, price: r.price,
    })),
    myBusinesses: (mb.data || []).map(b => ({ id: b.id, name: b.name, logo: b.logo_url })),
    levelCovers: Object.fromEntries((lc.data || []).filter(r => r.image_url).map(r => [r.id, r.image_url])),
  }
}

// ---------- tienda (banners gestionados por admin) ----------
export const insertStoreItem = row => sb.from('store_items').insert(row)
export const deleteStoreItem = id => sb.from('store_items').update({ active: false }).eq('id', id)

// ---------- portadas por nivel (foto real gestionada por admin, reemplaza el dibujo vectorial) ----------
export const upsertLevelCover = (id, imageUrl) =>
  sb.from('level_covers').upsert({ id, image_url: imageUrl })

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
  meta: { icon: g.icon || null, skills: g.skills || [] },
  kind: g.kind || 'constancia', target_number: g.targetNumber || null, unit_label: g.unitLabel || null,
}).select().single()

export const deleteGoal = id => sb.from('goals').delete().eq('id', id)

export const insertCheckin = (userId, goalId, c) => sb.from('checkins').insert({
  user_id: userId, goal_id: goalId, day: c.day, note: c.note || null, photo_url: c.photo || null,
  value: c.value ?? null,
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
  meta: { icon: q.icon || null, skills: q.skills || [] },
  business_id: q.businessId || null, comuna: q.comuna?.length ? q.comuna : null,
  capacity: q.capacity || null, starts_at: q.startsAt || null, ends_at: q.endsAt || null,
  kind: q.kind || 'constancia', target_number: q.targetNumber || null, unit_label: q.unitLabel || null,
}).select().single()

export const awardRecognition = (questId, userId) =>
  sb.rpc('award_recognition', { p_quest_id: questId, p_user_id: userId })

export const sendTeamInvite = inviteId =>
  sb.functions.invoke('send-team-invite', { body: { inviteId } })

export const notifyNewQuest = questId =>
  sb.functions.invoke('notify-new-quest', { body: { questId } })

export const setQuestActive = (id, active) => sb.from('quests').update({ active }).eq('id', id)

// ---------- empresas (B2B / B2B2C) ----------
export const fetchBusinesses = () => sb.from('businesses').select('id, name, logo_url').order('name')

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
  // buscar el grupo por codigo via rpc: los no-miembros no pueden hacer select
  // directo por RLS. v2 tambien exige correo autorizado si el grupo es de empresa.
  const { data, error } = await sb.rpc('join_group_by_code_v2', { code })
  if (error) return { error }
  return { groupId: data }
}

// ---------- panel de empresa (self-serve) ----------
export async function createBusiness(userId, name, contactEmail) {
  return sb.from('businesses').insert({ name, owner_id: userId, contact_email: contactEmail }).select().single()
}

export const updateBusinessLogo = (businessId, logoUrl) =>
  sb.from('businesses').update({ logo_url: logoUrl }).eq('id', businessId)

export const createBusinessGroup = (businessId, name, theme) =>
  sb.rpc('create_business_group', { p_business_id: businessId, p_name: name, p_theme: theme })

// ---------- equipo autorizado de un grupo-empresa ----------
export const fetchCompanyInvites = groupId => sb.from('company_invites')
  .select('id, email, invited_at, joined_user_id').eq('group_id', groupId).order('invited_at')

export const addCompanyInvite = (groupId, email) => sb.from('company_invites')
  .insert({ group_id: groupId, email: email.trim().toLowerCase() }).select()

export const removeCompanyInvite = id => sb.from('company_invites').delete().eq('id', id)

// cuantos ya se unieron a cada reto publico (para chequear cupos): goals
// solo deja ver las filas propias, asi que se usa una funcion que cuenta
// sin exponer quien se unio
export const fetchQuestJoinCounts = questIds => sb.rpc('quest_join_counts', { quest_ids: questIds })

// progreso de los miembros en los retos de un grupo
export const fetchQuestGoals = questIds => sb.from('goals')
  .select('user_id, quest_id, status, checkins(day, value)').in('quest_id', questIds)

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
