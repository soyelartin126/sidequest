import { useState } from 'react'
import Avatar from './Avatar.jsx'
import { IconGlyph } from './ui.jsx'
import { INTERESTS } from './game.js'

export function Onboarding({ profile, onFinish }) {
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
              <span className="how-ico"><IconGlyph icon={e} size={22} /></span>
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
            <IconGlyph icon={d.icon} size={22} />
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
