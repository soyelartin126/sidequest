// ---- Motor de juego: XP, niveles, rachas, tiers y objetos ----

export const XP_CHECKIN = 10
export const XP_GOAL_COMPLETE = 60
export const XP_QUEST_COMPLETE = 100

export const LEVELS = [
  { xp: 0, title: 'Novato' },
  { xp: 100, title: 'Aprendiz' },
  { xp: 250, title: 'Constante' },
  { xp: 500, title: 'Dedicado' },
  { xp: 900, title: 'Imparable' },
  { xp: 1500, title: 'Leyenda' },
]

export function levelFor(xp) {
  let i = 0
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++
  const cur = LEVELS[i]
  const next = LEVELS[i + 1] || null
  const progress = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1
  return { level: i + 1, title: cur.title, next, progress, xp }
}

export const dayKey = (d = new Date()) => {
  const x = new Date(d)
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset())
  return x.toISOString().slice(0, 10)
}

export function allCheckinDays(goals) {
  const days = new Set()
  goals.forEach(g => g.checkins.forEach(c => days.add(c.day)))
  return days
}

// racha global: dias consecutivos con >=1 check-in, terminando hoy o ayer
export function streak(goals) {
  const days = allCheckinDays(goals)
  if (days.size === 0) return 0
  let count = 0
  const cursor = new Date()
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(dayKey(cursor))) {
    count++
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

// semana actual (Lun-Dom) con estado por dia
export function weekDots(goals) {
  const days = allCheckinDays(goals)
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  return ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return { label, done: days.has(dayKey(d)), future: d > now }
  })
}

export const goalTarget = g => Math.max(1, Math.round(g.freqPerWeek * g.weeks))
export const goalDays = g => Math.round(g.weeks * 7)

export function canCheckinToday(g) {
  return g.status === 'active' && !g.checkins.some(c => c.day === dayKey())
}

export function makeRedeemCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

// ---- Tiers de dificultad (por duracion de la mision en dias) ----
export const TIERS = {
  facil: { name: 'Fácil', minDays: 1, maxDays: 3, rank: 1, color: '#2A9D8F' },
  medio: { name: 'Medio', minDays: 4, maxDays: 14, rank: 2, color: '#1E88E5' },
  dificil: { name: 'Difícil', minDays: 15, maxDays: 30, rank: 3, color: '#7C5CBF' },
  legendario: { name: 'Legendario', minDays: 31, maxDays: Infinity, rank: 4, color: '#E9A820' },
}

export function tierForDays(days) {
  for (const [id, t] of Object.entries(TIERS))
    if (days >= t.minDays && days <= t.maxDays) return { id, ...t }
  return { id: 'facil', ...TIERS.facil }
}

// ---- Catalogo de objetos ----
// kind 'loot': se eligen como recompensa al crear una mision.
//   Requisitos: tier de la mision >= tier del item, y meta de check-ins >= reqCheckins.
// kind 'logro': se desbloquean automaticamente por hitos.
export const ITEMS = [
  // ---- logros automaticos ----
  { id: 'gorra', name: 'Gorra de novato', slot: 'head', kind: 'logro', desc: 'Tu primer check-in.' },
  { id: 'llama', name: 'Llamita fiel', slot: 'pet', kind: 'logro', desc: '7 días de racha.' },
  { id: 'medalla', name: 'Medalla patrocinada', slot: 'chest', kind: 'logro', desc: 'Primer reto patrocinado completado.' },
  { id: 'trofeo', name: 'Trofeo dorado', slot: 'side', kind: 'logro', desc: '3 misiones completadas.' },
  // ---- FACIL (1-3 dias) ----
  { id: 'bandana', name: 'Bandana roja', slot: 'head', kind: 'loot', tier: 'facil', reqCheckins: 2, desc: 'Para partir con estilo.' },
  { id: 'gorro_hongo', name: 'Gorro hongo', slot: 'head', kind: 'loot', tier: 'facil', reqCheckins: 3, desc: 'Un clásico de los pixeles.' },
  { id: 'pocion', name: 'Poción de ánimo', slot: 'side', kind: 'loot', tier: 'facil', reqCheckins: 2, desc: '+10 motivación (efecto visual).' },
  { id: 'lentes', name: 'Lentes retro', slot: 'face', kind: 'loot', tier: 'facil', reqCheckins: 3, desc: 'Nadie te reconoce en el gym.' },
  // ---- MEDIO (4-14 dias) ----
  { id: 'escudo', name: 'Escudo de madera', slot: 'hand', kind: 'loot', tier: 'medio', reqCheckins: 6, desc: 'Bloquea excusas.' },
  { id: 'capa_azul', name: 'Capa azul', slot: 'back', kind: 'loot', tier: 'medio', reqCheckins: 9, desc: 'Los héroes parten por algo.' },
  { id: 'botas', name: 'Botas veloces', slot: 'feet', kind: 'loot', tier: 'medio', reqCheckins: 8, desc: '+2 velocidad al salir a trotar.' },
  { id: 'gato', name: 'Gato pixel', slot: 'pet', kind: 'loot', tier: 'medio', reqCheckins: 12, desc: 'Te acompaña, te juzga poco.' },
  // ---- DIFICIL (15-30 dias) ----
  { id: 'espada', name: 'Espada pixel', slot: 'hand', kind: 'loot', tier: 'dificil', reqCheckins: 14, desc: 'El arma del constante.' },
  { id: 'espada_fuego', name: 'Espada de fuego', slot: 'hand', kind: 'loot', tier: 'dificil', reqCheckins: 20, desc: 'Forjada en 20 check-ins.' },
  { id: 'casco', name: 'Casco de caballero', slot: 'head', kind: 'loot', tier: 'dificil', reqCheckins: 24, desc: 'Disciplina de acero.' },
  { id: 'capa', name: 'Capa morada', slot: 'back', kind: 'loot', tier: 'dificil', reqCheckins: 16, desc: 'Del club de los que no fallan.' },
  { id: 'buho', name: 'Búho sabio', slot: 'pet', kind: 'loot', tier: 'dificil', reqCheckins: 18, desc: 'Sabe que vas a llegar.' },
  // ---- LEGENDARIO (30+ dias) ----
  { id: 'alas', name: 'Alas pixel', slot: 'back', kind: 'loot', tier: 'legendario', reqCheckins: 31, desc: 'Un mes entero. Vuelas.' },
  { id: 'dragon', name: 'Dragón bebé', slot: 'pet', kind: 'loot', tier: 'legendario', reqCheckins: 40, desc: 'Solo para leyendas pacientes.' },
  { id: 'corona', name: 'Corona legendaria', slot: 'head', kind: 'loot', tier: 'legendario', reqCheckins: 45, desc: 'La constancia hecha corona.' },
  { id: 'aura', name: 'Aura dorada', slot: 'aura', kind: 'loot', tier: 'legendario', reqCheckins: 60, desc: 'Brillas. Literalmente.' },
]

export const itemById = id => ITEMS.find(i => i.id === id)

// duraciones disponibles al crear una mision
export const DURATIONS = [
  { label: '2 días', weeks: 2 / 7 },
  { label: '3 días', weeks: 3 / 7 },
  { label: '1 semana', weeks: 1 },
  { label: '2 semanas', weeks: 2 },
  { label: '3 semanas', weeks: 3 },
  { label: '4 semanas', weeks: 4 },
  { label: '6 semanas', weeks: 6 },
  { label: '8 semanas', weeks: 8 },
]

// items elegibles como recompensa para una mision (freq x semanas)
export function eligibleLoot(freqPerWeek, weeks, ownedIds) {
  const tier = tierForDays(Math.round(weeks * 7))
  const target = Math.max(1, Math.round(freqPerWeek * weeks))
  return ITEMS.filter(it =>
    it.kind === 'loot' &&
    !ownedIds.has(it.id) &&
    TIERS[it.tier].rank <= tier.rank &&
    it.reqCheckins <= target
  )
}

// todo lo que el jugador posee: logros automaticos + loot ganado
export function earnedItems(state) {
  const { goals, profile } = state
  const completed = goals.filter(g => g.status === 'completed')
  const ids = new Set(profile.items || [])
  if (goals.some(g => g.checkins.length > 0)) ids.add('gorra')
  if (streak(goals) >= 7 || (profile.bestStreak || 0) >= 7) ids.add('llama')
  if (completed.some(g => g.sponsor)) ids.add('medalla')
  if (completed.length >= 3) ids.add('trofeo')
  return ids
}
