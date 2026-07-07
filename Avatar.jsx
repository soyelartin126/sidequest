// Avatar pixel-art renderizado como SVG a partir de grillas de caracteres.
// s=piel e=ojo b=polera p=pantalon z=zapato .=vacio  (el pelo es capa aparte)

const BODY = [
  '..............',
  '..............',
  '..ssssssssss..',
  '..ssssssssss..',
  '..ssessse.ss..',
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

// ---- Peinados (capa de pelo, [fila, col]) ----
const hrow = (row, x0, x1) => Array.from({ length: x1 - x0 + 1 }, (_, i) => [row, x0 + i])
const HAIRSTYLES = {
  clasico: [...hrow(0, 4, 9), ...hrow(1, 3, 10), ...hrow(2, 2, 11), [3, 2], [3, 3], [4, 2]],
  corto: [...hrow(1, 4, 9), ...hrow(2, 3, 10), [3, 2], [3, 3], [3, 10], [3, 11]],
  largo: [...hrow(0, 4, 9), ...hrow(1, 3, 10), ...hrow(2, 2, 11), [3, 2], [3, 3], [3, 10], [3, 11],
    [4, 2], [4, 11], [5, 2], [5, 11], [6, 2], [6, 11], [7, 3], [7, 10]],
  afro: [...hrow(-1, 4, 9), ...hrow(0, 3, 10), ...hrow(1, 2, 11), ...hrow(2, 2, 11),
    [3, 2], [3, 11], [4, 2], [4, 11]],
  mono: [...hrow(-2, 6, 7), ...hrow(-1, 6, 7), ...hrow(0, 4, 9), ...hrow(1, 3, 10), ...hrow(2, 2, 11), [3, 2], [3, 3]],
  crestas: [[-1, 5], [-1, 7], [-1, 9], ...hrow(0, 5, 9), ...hrow(1, 6, 8), [2, 7]],
}
export const HAIR_STYLES = [
  { id: 'clasico', name: 'Clásico' }, { id: 'corto', name: 'Corto' },
  { id: 'largo', name: 'Largo' }, { id: 'afro', name: 'Afro' },
  { id: 'mono', name: 'Moño' }, { id: 'crestas', name: 'Crestas' },
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

export const SKINS = ['#FFDBAC', '#FFCC9C', '#F1B47E', '#E0A06E', '#C68B59', '#A9714B', '#8D5524', '#5C3A21']
export const HAIRS = ['#2B1B12', '#5D4037', '#8D5A2B', '#B8722C', '#D6A24C', '#E8B84B',
  '#9E9E9E', '#EDEDED', '#C0392B', '#7C5CBF', '#2E7D4F', '#1E88E5']
export const SHIRTS = ['#F5811F', '#E7420F', '#2A9D8F', '#3582DB', '#16263F', '#7C5CBF',
  '#D81B60', '#F2C14E', '#3F7D5A', '#6B7480']
export const PANTS = ['#2B3440', '#4A4A5A', '#3A5A8C', '#5C4433', '#2E7D4F', '#6B7480', '#7C5CBF']
export const SHOES = ['#6D4C41', '#2B3440', '#E7420F', '#3582DB', '#EDEDED', '#7C5CBF']
export const EYES = ['#3A2C2A', '#3F6BA5', '#2E7D4F', '#6D4C41', '#111111']

// boca segun el animo (color labios sobre piel solida, filas 5-6)
const MOUTH = '#8A4A3A'
const MOUTHS = {
  happy: [[5, 5], [5, 8], [6, 6], [6, 7]],   // sonrisa
  neutral: [[5, 5], [5, 6], [5, 7], [5, 8]], // linea recta
  sad: [[5, 6], [5, 7], [6, 5], [6, 8]],     // hacia abajo
}

export default function Avatar({ avatar, equipped = {}, size = 120, mood = 'happy' }) {
  const {
    skin = SKINS[0], hair = HAIRS[1], shirt = SHIRTS[0],
    hairStyle = 'clasico', pants = PANTS[0], shoes = SHOES[0], eye = EYES[0],
  } = avatar || {}
  const cmap = { s: skin, e: eye, b: shirt, p: pants, z: shoes }
  const cells = []
  BODY.forEach((row, y) => {
    row.split('').forEach((c, x) => {
      if (cmap[c]) cells.push(<rect key={`b${x}-${y}`} x={x} y={y + 2} width="1" height="1" fill={cmap[c]} />)
    })
  })
  ;(HAIRSTYLES[hairStyle] || HAIRSTYLES.clasico).forEach(([y, x], i) =>
    cells.push(<rect key={`h${i}`} x={x} y={y + 2} width="1" height="1" fill={hair} />))
  ;(MOUTHS[mood] || MOUTHS.happy).forEach(([y, x], i) =>
    cells.push(<rect key={`m${i}`} x={x} y={y + 2} width="1" height="1" fill={MOUTH} />))
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

// ---- Mascota compañera (slime pixel) que reacciona al animo ----
const PET_BODY = [
  '..bbbb..',
  '.bbbbbb.',
  'bbbbbbbb',
  'bbbbbbbb',
  'bbbbbbbb',
  '.bbbbbb.',
  '..bbbb..',
]
export const PET_COLORS = ['#F49A4B', '#7FBE7F', '#7CA9E6', '#C98BDB', '#F49AC2', '#FFC24D']
// ojos y boca por animo [fila, col]
const PET_FACE = {
  happy: { eyes: [[2, 2], [2, 5]], mouth: [[4, 2], [4, 5], [5, 3], [5, 4]] },
  neutral: { eyes: [[2, 2], [2, 5]], mouth: [[4, 3], [4, 4]] },
  sad: { eyes: [[2, 2], [2, 5]], mouth: [[5, 2], [5, 5], [4, 3], [4, 4]] },
}

export function Pet({ color = PET_COLORS[0], size = 64, mood = 'happy', name }) {
  const face = PET_FACE[mood] || PET_FACE.happy
  const cells = []
  PET_BODY.forEach((row, y) => row.split('').forEach((c, x) => {
    if (c === 'b') cells.push(<rect key={`p${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />)
  }))
  face.eyes.forEach(([y, x], i) => cells.push(<rect key={`e${i}`} x={x} y={y} width="1" height="1" fill="#2A2A2A" />))
  face.mouth.forEach(([y, x], i) => cells.push(<rect key={`pm${i}`} x={x} y={y} width="1" height="1" fill="#5A2A2A" />))
  return (
    <div className={'pet' + (mood === 'happy' ? ' bob' : '') + (mood === 'sad' ? ' droop' : '')}
      style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 8 7" width={size} height={size * 7 / 8} shapeRendering="crispEdges" aria-label="mascota">
        {cells}
      </svg>
      {name && <div className="pet-name">{name}</div>}
    </div>
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

// ---- Portadas (cover banner) desbloqueables por nivel ----
export const COVERS = [
  { id: 'pradera', name: 'Pradera', minLevel: 1 },
  { id: 'bosque', name: 'Bosque', minLevel: 1 },
  { id: 'playa', name: 'Playa', minLevel: 3 },
  { id: 'castillo', name: 'Castillo', minLevel: 4 },
  { id: 'ciudad', name: 'Ciudad', minLevel: 5 },
  { id: 'noche', name: 'Noche', minLevel: 6 },
]
export const coverById = id => COVERS.find(c => c.id === id) || COVERS[0]

const pine = (x, base, h, k = '') => (
  <g key={'p' + x + k}>
    <rect x={x - 2} y={base - 4} width="4" height="8" fill="#7A5230" />
    <polygon points={`${x},${base - h} ${x - 14},${base} ${x + 14},${base}`} fill="#2E7D4F" />
    <polygon points={`${x},${base - h - 8} ${x - 10},${base - h + 14} ${x + 10},${base - h + 14}`} fill="#379159" />
  </g>
)

function coverScene(id) {
  switch (id) {
    case 'bosque':
      return (<>
        <rect width="300" height="140" fill="#CDEAF4" />
        <circle cx="252" cy="30" r="14" fill="#FBCB3B" />
        <ellipse cx="150" cy="150" rx="220" ry="70" fill="#8FC46A" />
        <rect y="100" width="300" height="40" fill="#6FA84A" />
        {pine(35, 108, 52)}{pine(90, 112, 62, 'b')}{pine(150, 106, 48, 'c')}
        {pine(210, 112, 60, 'd')}{pine(266, 108, 50, 'e')}
      </>)
    case 'playa':
      return (<>
        <rect width="300" height="140" fill="#BFE8F6" />
        <circle cx="58" cy="34" r="15" fill="#FBCB3B" />
        <rect y="72" width="300" height="34" fill="#4FB4D8" />
        <rect y="72" width="300" height="5" fill="#83CFE6" />
        <rect y="104" width="300" height="36" fill="#F3E1B0" />
        <rect y="104" width="300" height="6" fill="#EAD199" />
        <rect x="236" y="58" width="6" height="50" rx="3" fill="#A9714B" />
        <ellipse cx="239" cy="56" rx="24" ry="8" fill="#3E9B5B" />
        <ellipse cx="224" cy="60" rx="20" ry="7" fill="#369053" transform="rotate(-18 224 60)" />
        <ellipse cx="256" cy="60" rx="20" ry="7" fill="#369053" transform="rotate(18 256 60)" />
      </>)
    case 'castillo':
      return (<>
        <rect width="300" height="140" fill="#CFE0F5" />
        <circle cx="250" cy="32" r="14" fill="#FBCB3B" />
        <ellipse cx="150" cy="175" rx="230" ry="85" fill="#7FB55A" />
        <rect x="112" y="66" width="76" height="54" fill="#9AA6BC" />
        <rect x="96" y="52" width="22" height="68" fill="#8B98AE" />
        <rect x="182" y="52" width="22" height="68" fill="#8B98AE" />
        <rect x="96" y="48" width="6" height="6" fill="#8B98AE" /><rect x="108" y="48" width="6" height="6" fill="#8B98AE" />
        <rect x="182" y="48" width="6" height="6" fill="#8B98AE" /><rect x="194" y="48" width="6" height="6" fill="#8B98AE" />
        <rect x="140" y="96" width="20" height="24" rx="10" fill="#5C4433" />
        <rect x="205" y="34" width="3" height="20" fill="#5C4433" />
        <polygon points="208,34 208,44 222,39" fill="#E7420F" />
      </>)
    case 'ciudad':
      return (<>
        <rect width="300" height="140" fill="#F7CE8E" />
        <circle cx="150" cy="52" r="24" fill="#F9A94B" />
        <rect x="20" y="70" width="34" height="70" fill="#3A4A63" />
        <rect x="66" y="52" width="30" height="88" fill="#31405A" />
        <rect x="108" y="82" width="36" height="58" fill="#3A4A63" />
        <rect x="156" y="60" width="30" height="80" fill="#31405A" />
        <rect x="198" y="44" width="32" height="96" fill="#3A4A63" />
        <rect x="242" y="74" width="36" height="66" fill="#31405A" />
        <g fill="#F7CE8E">
          <rect x="30" y="80" width="5" height="5" /><rect x="42" y="80" width="5" height="5" />
          <rect x="30" y="94" width="5" height="5" /><rect x="42" y="94" width="5" height="5" />
          <rect x="208" y="56" width="5" height="5" /><rect x="218" y="56" width="5" height="5" />
          <rect x="208" y="72" width="5" height="5" /><rect x="218" y="72" width="5" height="5" />
          <rect x="252" y="86" width="5" height="5" /><rect x="264" y="86" width="5" height="5" />
        </g>
        <rect y="128" width="300" height="12" fill="#2A3648" />
      </>)
    case 'noche':
      return (<>
        <rect width="300" height="140" fill="#1C2B45" />
        <circle cx="242" cy="38" r="15" fill="#EDE9D0" />
        <g fill="#FFFFFF">
          <rect x="40" y="26" width="3" height="3" /><rect x="90" y="18" width="2" height="2" />
          <rect x="140" y="34" width="3" height="3" /><rect x="70" y="52" width="2" height="2" />
          <rect x="180" y="22" width="2" height="2" /><rect x="120" y="14" width="2" height="2" />
          <rect x="205" y="60" width="2" height="2" /><rect x="30" y="70" width="2" height="2" />
        </g>
        <polygon points="0,140 70,74 140,140" fill="#16263F" />
        <polygon points="110,140 190,66 270,140" fill="#101F36" />
        <rect y="126" width="300" height="14" fill="#0F1B30" />
      </>)
    default:
      return (<>
        <rect width="300" height="140" fill="#BFE6F5" />
        <circle cx="248" cy="36" r="18" fill="#FBCB3B" />
        <ellipse cx="70" cy="152" rx="150" ry="62" fill="#A7D07C" />
        <ellipse cx="240" cy="160" rx="150" ry="58" fill="#7FB55A" />
        <rect y="122" width="300" height="18" fill="#7FB55A" />
      </>)
  }
}

export function Cover({ id = COVERS[0].id, image, greeting, sub }) {
  return (
    <div className="cover">
      {image
        ? <img className="cover-svg" src={image} alt="" style={{ objectFit: 'cover' }} />
        : <svg viewBox="0 0 300 140" preserveAspectRatio="xMidYMid slice" className="cover-svg" aria-hidden="true">
            {coverScene(id)}
          </svg>}
      <div className="cover-scrim" />
      {greeting && (
        <div className="cover-text">
          <div className="cover-hi">{greeting}</div>
          {sub && <div className="cover-sub">{sub}</div>}
        </div>
      )}
    </div>
  )
}

export function CoverThumb({ id, image }) {
  if (image) return <img className="cover-thumb-svg" src={image} alt="" style={{ objectFit: 'cover' }} />
  return (
    <svg viewBox="0 0 300 140" preserveAspectRatio="xMidYMid slice" className="cover-thumb-svg" aria-hidden="true">
      {coverScene(id)}
    </svg>
  )
}
