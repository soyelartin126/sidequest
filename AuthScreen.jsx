import { useState } from 'react'
import * as db from './supabase.js'
import Avatar, { GENDERS, SKIN_TONES, HAIR_STYLES, HAIR_COLORS } from './Avatar.jsx'
import { Pwd, Backdrop } from './ui.jsx'
import { THEMES, backgroundStyle } from './game.js'

// ---------- Pantalla de nueva contraseña (tras el link de recuperación) ----------
export function ResetPassword({ toast, onNotify, onDone }) {
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

// ---------- Auth: login + registro con personaje ----------
export function AuthScreen({ onNotify, toast, theme }) {
  const [mode, setMode] = useState('login') // login | signup | signup2 | business_signup
  const [isBusiness, setIsBusiness] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', bizName: '', teamName: '' })
  const [avatar, setAvatar] = useState({ gender: 'm', skin: SKIN_TONES[0].id, hairStyle: 'none', hairColor: HAIR_COLORS[0].id })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const RampSw = ({ options, k }) => (
    <div className="swatches">
      {options.map(o => (
        <div key={o.id} title={o.name}
          className={'swatch' + ((avatar[k] || options[0].id) === o.id ? ' sel' : '')}
          style={{ background: o.ramp[3] }} onClick={() => setAvatar(a => ({ ...a, [k]: o.id }))} />
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
  const submitBusinessSignup = async () => {
    setBusy(true)
    const email = form.email.trim()
    const { user, error } = await db.signUp({
      email, password: form.password, name: form.name.trim(), phone: form.phone.trim(), avatar,
    })
    if (error) { setBusy(false); onNotify(error.message); return }
    const { data: biz, error: e2 } = await db.createBusiness(user.id, form.bizName.trim(), email)
    if (e2) { setBusy(false); onNotify('Cuenta creada, pero la empresa falló: ' + e2.message); return }
    const { error: e3 } = await db.createBusinessGroup(biz.id, form.teamName.trim() || 'Equipo principal', THEMES[1])
    setBusy(false)
    if (e3) onNotify('Empresa creada, pero el equipo falló: ' + e3.message)
  }
  return (
    <div className="app auth-bg">
      <Backdrop style={backgroundStyle(theme === 'dark')} />
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
          <button className="link-btn" onClick={() => { setIsBusiness(true); setMode('business_signup') }}>
            ¿Tienes una empresa? Regístrate aquí
          </button>
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
            onClick={() => { setIsBusiness(false); setMode('signup2') }}>
            Siguiente: tu personaje →
          </button>
          <div className="spacer" />
          <button className="sec" onClick={() => setMode('login')}>Ya tengo cuenta</button>
        </div>
      )}

      {mode === 'business_signup' && (
        <div className="card">
          <h1>Registra tu empresa</h1>
          <p className="muted small">Crea tu cuenta, tu primer equipo, y empieza a invitar a tu gente.</p>
          <label>Nombre de tu empresa</label>
          <input value={form.bizName} onChange={e => set('bizName', e.target.value)} placeholder="Ej: Panadería Ortega" maxLength={40} />
          <label>Nombre de tu primer equipo</label>
          <input value={form.teamName} onChange={e => set('teamName', e.target.value)} placeholder="Ej: Equipo principal" maxLength={30} />
          <label>Tu nombre</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Martín" maxLength={20} />
          <label>Correo</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" />
          <label>Teléfono (opcional)</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+56 9 …" />
          <label>Contraseña (mínimo 6 caracteres)</label>
          <Pwd value={form.password} onChange={e => set('password', e.target.value)} />
          <button disabled={!form.bizName.trim() || !form.name.trim() || !form.email.includes('@') || form.password.length < 6}
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
              {GENDERS.map(g => (
                <div key={g.id} title={g.name}
                  className={'hair-opt' + ((avatar.gender || 'm') === g.id ? ' sel' : '')}
                  onClick={() => setAvatar(a => ({ ...a, gender: g.id }))}>
                  <Avatar avatar={{ ...avatar, gender: g.id }} size={42} />
                </div>
              ))}
            </div>
            <label>Piel</label><RampSw options={SKIN_TONES} k="skin" />
            <label>Peinado</label>
            <div className="swatches">
              {HAIR_STYLES.map(h => (
                <div key={h.id} title={h.name}
                  className={'hair-opt' + ((avatar.hairStyle || 'none') === h.id ? ' sel' : '')}
                  onClick={() => setAvatar(a => ({ ...a, hairStyle: h.id }))}>
                  <Avatar avatar={{ ...avatar, hairStyle: h.id }} size={42} />
                </div>
              ))}
            </div>
            <label>Color de pelo</label><RampSw options={HAIR_COLORS} k="hairColor" />
            <button disabled={busy} onClick={isBusiness ? submitBusinessSignup : submitSignup}>
              {busy ? 'Creando cuenta…' : '¡Comenzar la aventura!'}
            </button>
            <div className="spacer" />
            <button className="sec" onClick={() => setMode(isBusiness ? 'business_signup' : 'signup')}>← Volver</button>
          </div>
        </>
      )}
    </div>
  )
}
