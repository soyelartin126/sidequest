// Avatar pixel-art renderizado como SVG a partir de grillas de caracteres.
// h=pelo s=piel e=ojo b=polera p=pantalon z=zapato .=vacio

const BODY = [
  '....hhhhhh....',
  '...hhhhhhhh...',
  '..hhhhhhhhhh..',
  '..hhssssssss..',
  '..hsessse.ss..',
  '...ssssssss...',
  '...ss.ss.ss...',
  '....ssssss....',
  '.....ssss.....',
  '...bbbbbbbb...',
  '..bbbbbbbbbb..',
  '.sbbbbbbbbbbs.',
  '.sbbbbbbbbbbs.',
  '...pppppppp...',
  '...pp....pp...',
  '...pp....pp...',
  '...zz....zz...',
]

// helpers para construir overlays [fila, col, color]
const strip = (row, x0, x1, c) => Array.from({ length: x1 - x0 + 1 }, (_, i) => [row, x0 + i, c])
const px = (row, col, c) => [[row, col, c]]

const OVERLAYS = {
  // ---- cabeza ----
  gorra: [...strip(0, 3, 10, '#F4511E'), ...strip(1, 2, 3, '#F4511E'), ...strip(1, 10, 12, '#F4511E')],
  bandana: [...strip(2, 2, 11, '#D62828'), ...px(3, 12, '#D62828'), ...px(4, 12, '#D62828')],
  gorro_hongo: [...strip(-1, 4, 9, '#E63946'), ...strip(0, 2, 11, '#E63946'),
    ...px(-1, 6, '#FFFFFF'), ...px(0, 4, '#FFFFFF'), ...px(0, 9, '#FFFFFF')],
  casco: [...strip(-1, 4, 9, '#8D99AE'), ...strip(0, 3, 10, '#8D99AE'), ...strip(1, 2, 3, '#8D99AE'),
    ...strip(1, 10, 11, '#8D99AE'), ...px(-2, 6, '#E63946'), ...px(-2, 7, '#E63946')],
  corona: [...px(-1, 4, '#FFC93C'), ...px(-1, 6, '#FFC93C'), ...px(-1, 8, '#FFC93C'), ...strip(0, 4, 8, '#FFC93C')],
  // ---- cara ----
  lentes: [...strip(4, 3, 5, '#3A2C2A'), ...strip(4, 7, 9, '#3A2C2A'), ...px(4, 6, '#3A2C2A')],
  // ---- mano ----
  espada: [...px(7, 13, '#B0BEC5'), ...px(8, 13, '#B0BEC5'), ...px(9, 13, '#B0BEC5'),
    ...px(10, 13, '#B0BEC5'), ...px(11, 12, '#8D6E63'), ...px(11, 13, '#FFC93C')],
  espada_fuego: [...px(6, 13, '#FFC93C'), ...px(7, 13, '#F4511E'), ...px(8, 13, '#F4511E'),
    ...px(9, 13, '#FFC93C'), ...px(10, 13, '#F4511E'), ...px(11, 12, '#8D6E63'), ...px(11, 13, '#FFC93C')],
  escudo: [...strip(8, 12, 13, '#8D6E63'), ...strip(9, 12, 13, '#8D6E63'),
    ...strip(10, 12, 13, '#8D6E63'), ...strip(11, 12, 13, '#8D6E63'), ...px(9, 12, '#FFC93C'), ...px(10, 13, '#FFC93C')],
  // ---- espalda ----
  capa: [...px(9, 1, '#7C5CBF'), ...px(10, 1, '#7C5CBF'), ...px(11, 0, '#7C5CBF'), ...px(12, 0, '#7C5CBF'),
    ...px(13, 0, '#7C5CBF'), ...px(13, 1, '#7C5CBF'), ...px(9, 2, '#7C5CBF'), ...px(10, 2, '#7C5CBF')],
  capa_azul: [...px(9, 1, '#1E88E5'), ...px(10, 1, '#1E88E5'), ...px(11, 0, '#1E88E5'), ...px(12, 0, '#1E88E5'),
    ...px(13, 0, '#1E88E5'), ...px(13, 1, '#1E88E5'), ...px(9, 2, '#1E88E5'), ...px(10, 2, '#1E88E5')],
  alas: [...px(8, 1, '#FFF8E7'), ...px(9, 0, '#FFF8E7'), ...px(9, 1, '#FFF8E7'), ...px(10, 0, '#FFF8E7'),
    ...px(10, 1, '#FFF8E7'), ...px(11, 1, '#FFF8E7'),
    ...px(8, 12, '#FFF8E7'), ...px(9, 12, '#FFF8E7'), ...px(9, 13, '#FFF8E7'), ...px(10, 12, '#FFF8E7'),
    ...px(10, 13, '#FFF8E7'), ...px(11, 12, '#FFF8E7')],
  // ---- pecho / pies / aura ----
  medalla: [...px(10, 6, '#FFC93C'), ...px(10, 7, '#FFC93C'), ...px(9, 6, '#F4511E')],
  botas: [...strip(16, 3, 4, '#F4511E'), ...strip(16, 9, 10, '#F4511E'), ...px(15, 3, '#F4511E'), ...px(15, 9, '#F4511E')],
  aura: [...px(1, 1, '#FFC93C'), ...px(4, 0, '#FFC93C'), ...px(8, 0, '#FFE28A'), ...px(12, 13, '#FFE28A'),
    ...px(2, 12, '#FFC93C'), ...px(6, 13, '#FFE28A'), ...px(14, 1, '#FFC93C'), ...px(-1, 11, '#FFE28A')],
  // ---- mascotas / lado ----
  llama: [...px(13, 12, '#FFC93C'), ...px(14, 12, '#F4511E'), ...px(15, 12, '#F4511E'),
    ...px(16, 12, '#4A2C2A'), ...px(14, 13, '#F4511E'), ...px(15, 13, '#FFC93C')],
  trofeo: [...px(14, 0, '#FFC93C'), ...px(15, 0, '#FFC93C'), ...px(15, 1, '#FFC93C'),
    ...px(16, 0, '#E9A820'), ...px(16, 1, '#E9A820')],
  pocion: [...px(14, 1, '#B565D8'), ...px(15, 0, '#B565D8'), ...px(15, 1, '#B565D8'),
    ...px(16, 0, '#8E44AD'), ...px(16, 1, '#8E44AD'), ...px(13, 1, '#8D6E63')],
  gato: [...px(13, 12, '#9E9E9E'), ...px(13, 13, '#9E9E9E'), ...px(14, 12, '#9E9E9E'), ...px(14, 13, '#9E9E9E'),
    ...px(15, 12, '#757575'), ...px(15, 13, '#757575'), ...px(16, 12, '#757575'), ...px(12, 12, '#9E9E9E'), ...px(12, 13, '#9E9E9E')],
  buho: [...px(13, 0, '#8D6E63'), ...px(13, 1, '#8D6E63'), ...px(14, 0, '#A1887F'), ...px(14, 1, '#A1887F'),
    ...px(15, 0, '#8D6E63'), ...px(15, 1, '#8D6E63'), ...px(16, 0, '#6D4C41'), ...px(16, 1, '#6D4C41'),
    ...px(14, 0, '#FFC93C')],
  dragon: [...px(12, 12, '#43A047'), ...px(12, 13, '#43A047'), ...px(13, 12, '#66BB6A'), ...px(13, 13, '#43A047'),
    ...px(14, 12, '#66BB6A'), ...px(14, 13, '#66BB6A'), ...px(15, 12, '#43A047'), ...px(15, 13, '#43A047'),
    ...px(16, 13, '#2E7D32'), ...px(11, 13, '#F4511E')],
}

export const SKINS = ['#FFCC9C', '#F1B47E', '#C68B59', '#8D5524']
export const HAIRS = ['#5D4037', '#212121', '#B8722C', '#E8B84B', '#9E9E9E', '#7C5CBF']
export const SHIRTS = ['#F4511E', '#2A9D8F', '#7C5CBF', '#1E88E5', '#D81B60', '#FFC93C']

export default function Avatar({ avatar, equipped = {}, size = 120 }) {
  const { skin = SKINS[0], hair = HAIRS[0], shirt = SHIRTS[0] } = avatar || {}
  const cmap = { h: hair, s: skin, e: '#3A2C2A', b: shirt, p: '#4A4A5A', z: '#6D4C41' }
  const cells = []
  BODY.forEach((row, y) => {
    row.split('').forEach((c, x) => {
      if (cmap[c]) cells.push(<rect key={`b${x}-${y}`} x={x} y={y + 2} width="1" height="1" fill={cmap[c]} />)
    })
  })
  Object.values(equipped).forEach(itemId => {
    const ov = OVERLAYS[itemId]
    if (ov) ov.forEach(([y, x, color], i) =>
      cells.push(<rect key={`o${itemId}-${i}`} x={x} y={y + 2} width="1" height="1" fill={color} />))
  })
  return (
    <svg viewBox="0 0 14 19" width={size} height={size * 19 / 14}
      shapeRendering="crispEdges" aria-label="avatar">
      {cells}
    </svg>
  )
}

// mini-sprite: dibuja las celdas del overlay del item, normalizadas
export function ItemSprite({ id, size = 44 }) {
  const ov = OVERLAYS[id]
  if (!ov) return null
  const ys = ov.map(c => c[0]), xs = ov.map(c => c[1])
  const y0 = Math.min(...ys), x0 = Math.min(...xs)
  const w = Math.max(...xs) - x0 + 1, h = Math.max(...ys) - y0 + 1
  const dim = Math.max(w, h)
  const ox = (dim - w) / 2, oy = (dim - h) / 2
  return (
    <svg viewBox={`0 0 ${dim} ${dim}`} width={size} height={size} shapeRendering="crispEdges">
      {ov.map(([y, x, c], i) => (
        <rect key={i} x={x - x0 + ox} y={y - y0 + oy} width="1" height="1" fill={c} />
      ))}
    </svg>
  )
}

// pseudo-QR pixel deterministico a partir del codigo (visual, el codigo es lo que vale)
export function PixelCode({ code, size = 140 }) {
  let seed = 0
  for (const ch of code) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  const N = 13
  const cells = []
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const corner = (x < 4 && y < 4) || (x >= N - 4 && y < 4) || (x < 4 && y >= N - 4)
      const on = corner ? (x % 3 !== 1 || y % 3 !== 1) : rand() > 0.55
      if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#3A2C2A" />)
    }
  return (
    <svg viewBox={`0 0 ${N} ${N}`} width={size} height={size} shapeRendering="crispEdges"
      style={{ background: '#fff', padding: 8, borderRadius: 8 }}>
      {cells}
    </svg>
  )
}
