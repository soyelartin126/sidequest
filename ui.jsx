import { useState } from 'react'
import { tierForDays, ICON_IMAGES } from './game.js'

// muestra la imagen pixel art del icono si existe, si no el emoji tal cual
export function IconGlyph({ icon, size = 24 }) {
  const img = ICON_IMAGES[icon]
  if (img) return <img src={img} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />
  return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>
}

// capa de fondo fijada al tamano de la pantalla (no al alto del contenido,
// que puede ser muy largo) para que la imagen no se vea "estirada"
export function Backdrop({ style }) {
  return <div style={{ position: 'fixed', inset: 0, zIndex: -1, ...style }} />
}

export function Bar({ frac }) {
  const total = 16
  const on = Math.round(Math.min(1, Math.max(0, frac)) * total)
  return (
    <div className="bar">
      {Array.from({ length: total }, (_, i) => <span key={i} className={i < on ? 'on' : ''} />)}
    </div>
  )
}

// barra de relleno continuo (en % del ancho) para espacios angostos como
// tarjetas en grilla, donde los 16 segmentos de ancho fijo de Bar no caben
export function MiniBar({ frac }) {
  const pct = Math.round(Math.min(1, Math.max(0, frac)) * 100)
  return (
    <div className="mini-bar">
      <div className="mini-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function TierBadge({ weeks }) {
  const tier = tierForDays(Math.round(weeks * 7))
  return <span className="chip" style={{ background: tier.color, color: '#fff' }}>{tier.name}</span>
}

// medallita de empresa: distintivo de que un grupo/usuario pertenece a una cuenta B2B
export function CompanyBadge({ name, logo, size = 16 }) {
  if (!name) return null
  return (
    <span className="chip company-badge" title={name}>
      {logo
        ? <img src={logo} alt="" style={{ width: size, height: size, objectFit: 'contain', borderRadius: 3 }} />
        : '🏢'}
      {name}
    </span>
  )
}

// input de contraseña con ojo para mostrar/ocultar
export function Pwd({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="pwd">
      <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} />
      <button type="button" className="pwd-eye" aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        onClick={() => setShow(s => !s)}>
        {show
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 002.8 2.8" /><path d="M9.9 4.3A9.6 9.6 0 0112 4c5.5 0 9 5.5 9 8a12 12 0 01-2.1 3.1M6.2 6.2C3.7 7.8 2 10 2 12c0 2.5 3.5 8 9 8 1 0 2-.2 2.9-.5" /></svg>
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>}
      </button>
    </div>
  )
}
