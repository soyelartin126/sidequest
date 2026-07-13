// Motor de personaje: compone y recolorea en tiempo real (via canvas) las
// plantillas pixel art en public/character/templates/. Piezas originales de
// Liberated Pixel Cup (ver creditos), recoloreadas con sus propias paletas
// via intercambio de indice de color (no aproximacion).
//
// Reemplazable por diseno propio despues: basta con cambiar los PNG en
// templates/ (mismo tamano 64x64 y misma plantilla de colores) sin tocar
// este archivo, o ajustar SKIN_TONES/HAIR_COLORS si el nuevo arte no usa
// paleta indexada.

// plantilla base "light" (piel) y "orange" (pelo) en la que vienen las piezas
const SKIN_TEMPLATE = [[0x27,0x19,0x20],[0x99,0x42,0x3c],[0xcc,0x86,0x65],[0xe4,0xa4,0x7c],[0xf9,0xd5,0xba],[0xfa,0xec,0xe7]]
const HAIR_TEMPLATE = [[0x26,0x0d,0x14],[0x6a,0x11,0x08],[0xa4,0x26,0x00],[0xbf,0x40,0x00],[0xe5,0x56,0x00],[0xff,0x8a,0x00]]

// ventana de recorte sobre el lienzo de trabajo de 64x64 (deja algo de aire
// para gorros/alas sin recortarlos, pero saca el margen muerto del resto)
const CROP = { x: 8, y: 2, w: 48, h: 62 }
export const AVATAR_ASPECT = CROP.h / CROP.w

export const SKIN_TONES = [
  { id: 'light', name: 'Clara', ramp: ['#271920', '#99423c', '#cc8665', '#e4a47c', '#f9d5ba', '#faece7'] },
  { id: 'amber', name: 'Ámbar', ramp: ['#281716', '#9e3e37', '#d28144', '#ea9f54', '#fdd082', '#fbe7a4'] },
  { id: 'olive', name: 'Oliva', ramp: ['#271920', '#442725', '#7f4c31', '#ae6b3f', '#d38b59', '#e4a47c'] },
  { id: 'taupe', name: 'Topo', ramp: ['#271920', '#503734', '#785946', '#936849', '#ba8454', '#c7935f'] },
  { id: 'bronze', name: 'Bronce', ramp: ['#1a1213', '#442725', '#644133', '#7f4c31', '#ae6b3f', '#d38b59'] },
  { id: 'brown', name: 'Café', ramp: ['#120e10', '#412b29', '#5f4539', '#76513a', '#9c663e', '#b8773f'] },
  { id: 'black', name: 'Oscura', ramp: ['#000000', '#1a1213', '#2e1f1c', '#442725', '#603429', '#7f4c31'] },
]

export const HAIR_COLORS = [
  { id: 'dark_brown', name: 'Castaño oscuro', ramp: ['#050100', '#160701', '#290e02', '#421603', '#5f1f04', '#792806'] },
  { id: 'black', name: 'Negro', ramp: ['#000000', '#080a0a', '#101414', '#1c2222', '#31313e', '#4a5057'] },
  { id: 'chestnut', name: 'Castaño', ramp: ['#200c0d', '#3a130e', '#63200b', '#81310a', '#b6550e', '#d28102'] },
  { id: 'light_brown', name: 'Castaño claro', ramp: ['#1a0e04', '#301b07', '#60350f', '#7d4513', '#ae682a', '#c88d58'] },
  { id: 'blonde', name: 'Rubio', ramp: ['#331313', '#552b15', '#ac5d1f', '#e09e2b', '#fccf56', '#ffe67d'] },
  { id: 'red', name: 'Rojo', ramp: ['#300000', '#870000', '#a40712', '#cb0000', '#e21414', '#f1583a'] },
  { id: 'gray', name: 'Gris', ramp: ['#0e0e0e', '#292929', '#4b4b4b', '#777777', '#aaaaaa', '#d9d9d9'] },
  { id: 'white', name: 'Blanco', ramp: ['#1d1d21', '#484e57', '#8b9498', '#b8bbbc', '#d8dcdc', '#ffffff'] },
]

export const HAIR_STYLES = [
  { id: 'none', name: 'Sin pelo' },
  { id: 'messy1', name: 'Corto desordenado' },
  { id: 'buzzcut', name: 'Corto parejo' },
  { id: 'long_messy', name: 'Media melena' },
  { id: 'long_straight', name: 'Larga lisa' },
  { id: 'bob', name: 'Bob' },
  { id: 'pixie', name: 'Pixie' },
]

export const GENDERS = [
  { id: 'm', name: 'Masculino' },
  { id: 'f', name: 'Femenino' },
]

// items equipables (tienda/logros) -> capa de imagen LPC mas parecida.
// slot debe calzar con item.slot en game.js (ITEMS)
const ITEM_LAYERS = {
  gorra: { slot: 'head', file: 'gorra' },
  bandana: { slot: 'head', file: 'bandana' },
  gorro_hongo: { slot: 'head', file: 'gorro_hongo' },
  casco: { slot: 'head', file: 'casco' },
  corona: { slot: 'head', file: 'corona' },
  lentes: { slot: 'face', file: 'lentes' },
  espada: { slot: 'hand', file: 'espada' },
  espada_fuego: { slot: 'hand', file: 'espada_fuego' },
  escudo: { slot: 'hand', file: 'escudo' },
  medalla: { slot: 'chest', file: 'medalla', gendered: true },
  botas: { slot: 'feet', file: 'botas' },
  capa: { slot: 'back', bgFile: 'capa_bg', fgFile: 'capa_fg' },
  capa_azul: { slot: 'back', bgFile: 'capa_azul_bg', fgFile: 'capa_azul_fg' },
  alas: { slot: 'back', bgFile: 'alas_bg', fgFile: 'alas_fg' },
  llama: { slot: 'chest', file: 'llama', gendered: true },
  trofeo: { slot: 'head', file: 'trofeo' },
  pocion: { slot: 'hand', file: 'pocion' },
  gato: { slot: 'face', file: 'gato' },
  buho: { slot: 'chest', file: 'buho', gendered: true },
  dragon: { slot: 'hand', file: 'dragon' },
  aura: { slot: 'head', file: 'aura' },
}

const hexToRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

const imageCache = new Map()
function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src)
  const p = new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
  imageCache.set(src, p)
  return p
}

function nearestIndex(r, g, b, template) {
  let best = 0, bestD = Infinity
  for (let i = 0; i < template.length; i++) {
    const [tr, tg, tb] = template[i]
    const d = (r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2
    if (d < bestD) { bestD = d; best = i }
  }
  return best
}

async function drawRecolored(ctx, src, template, targetRamp) {
  const img = await loadImage(src)
  const off = document.createElement('canvas')
  off.width = 64; off.height = 64
  const octx = off.getContext('2d')
  octx.drawImage(img, 0, 0)
  const data = octx.getImageData(0, 0, 64, 64)
  const targetRgb = targetRamp.map(hexToRgb)
  const px = data.data
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue
    const idx = nearestIndex(px[i], px[i + 1], px[i + 2], template)
    const [nr, ng, nb] = targetRgb[idx]
    px[i] = nr; px[i + 1] = ng; px[i + 2] = nb
  }
  octx.putImageData(data, 0, 0)
  ctx.drawImage(off, 0, 0)
}

async function drawPlain(ctx, src) {
  const img = await loadImage(src)
  ctx.drawImage(img, 0, 0)
}

const renderCache = new Map()
const I = '/character/items'

// dibuja el personaje en un canvas 64x64 y devuelve un data URL (con cache)
export async function renderCharacter({
  gender = 'm', skin = 'light', hairStyle = 'none', hairColor = 'dark_brown', equipped = {},
}) {
  const g = gender === 'f' ? 'f' : 'm'
  const eq = ['head', 'chest', 'face', 'hand', 'back', 'feet']
    .map(slot => equipped[slot]).filter(id => id && ITEM_LAYERS[id])
  const key = `${g}|${skin}|${hairStyle}|${hairColor}|${eq.join(',')}`
  if (renderCache.has(key)) return renderCache.get(key)

  const skinRamp = (SKIN_TONES.find(s => s.id === skin) || SKIN_TONES[0]).ramp
  const hairRamp = (HAIR_COLORS.find(h => h.id === hairColor) || HAIR_COLORS[0]).ramp
  const back = ITEM_LAYERS[equipped.back]
  const feetItem = ITEM_LAYERS[equipped.feet]
  const chestItem = ITEM_LAYERS[equipped.chest]
  const handItem = ITEM_LAYERS[equipped.hand]
  const headItem = ITEM_LAYERS[equipped.head]
  const faceItem = ITEM_LAYERS[equipped.face]

  const canvas = document.createElement('canvas')
  canvas.width = 64; canvas.height = 64
  const ctx = canvas.getContext('2d')
  const T = '/character/templates'

  if (back?.bgFile) await drawPlain(ctx, `${I}/${back.bgFile}.png`)
  await drawRecolored(ctx, `${T}/body_${g}.png`, SKIN_TEMPLATE, skinRamp)
  await drawPlain(ctx, `${T}/legs_${g}.png`)
  await drawPlain(ctx, feetItem ? `${I}/${feetItem.file}.png` : `${T}/feet_${g}.png`)
  await drawPlain(ctx, `${T}/torso_${g}.png`)
  await drawRecolored(ctx, `${T}/head_${g}.png`, SKIN_TEMPLATE, skinRamp)
  await drawPlain(ctx, `${T}/eyes_${g}.png`)
  if (hairStyle && hairStyle !== 'none') {
    await drawRecolored(ctx, `${T}/hair_${hairStyle}.png`, HAIR_TEMPLATE, hairRamp)
  }
  if (chestItem) await drawPlain(ctx, `${I}/${chestItem.file}_${g}.png`)
  if (handItem) await drawPlain(ctx, `${I}/${handItem.file}.png`)
  if (headItem) await drawPlain(ctx, `${I}/${headItem.file}.png`)
  if (faceItem) await drawPlain(ctx, `${I}/${faceItem.file}.png`)
  if (back?.fgFile) await drawPlain(ctx, `${I}/${back.fgFile}.png`)

  // recorta el margen vacio alrededor del personaje (el lienzo de 64x64 trae
  // aire de sobra por como vienen las plantillas LPC) para que se vea mas
  // grande dentro de su caja. Ventana fija (no por bbox real) para que la
  // posicion no salte segun el gorro/pelo equipado.
  const out = document.createElement('canvas')
  out.width = CROP.w; out.height = CROP.h
  out.getContext('2d').drawImage(canvas, CROP.x, CROP.y, CROP.w, CROP.h, 0, 0, CROP.w, CROP.h)

  const url = out.toDataURL()
  renderCache.set(key, url)
  return url
}
