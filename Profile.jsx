import { useState } from 'react'
import Avatar, {
  Pet, PET_COLORS, CoverThumb, COVERS, ItemSprite,
  SKINS, HAIRS, SHIRTS, PANTS, SHOES, EYES, HAIR_STYLES, BODY_SHAPES,
} from './Avatar.jsx'
import { Bar } from './ui.jsx'
import { BACKGROUNDS, TIERS, ITEMS, SKILLS, skillLevel, skillStreak } from './game.js'

export function SkillCard({ skill, xp, streakDays }) {
  const { level, progress } = skillLevel(xp)
  return (
    <div className="skill-card">
      <div className="skill-ico">{skill.emoji}</div>
      <b>{skill.name}</b>
      <div className="muted small">Nivel {level}</div>
      <Bar frac={progress} />
      {streakDays > 0 && <div className="skill-streak">🔥 {streakDays} días</div>}
    </div>
  )
}

function Profile({ profile, lvl, earned, goals, mood = 'happy', banners = [], theme = 'light', onToggleTheme, onAvatar, onEquip, onAdmin, onLogout }) {
  const [editing, setEditing] = useState(false)
  const completed = goals.filter(g => g.status === 'completed').length
  const petColor = profile.avatar?.petColor ?? PET_COLORS[0]
  const curBg = profile.avatar?.bg || 'niebla'
  const curCover = profile.avatar?.cover || COVERS[0].id
  const allSkills = [...SKILLS, ...(profile.avatar?.customSkills || [])]
  const Sw = ({ colors, k }) => (
    <div className="swatches">
      {colors.map(c => (
        <div key={c} className={'swatch' + (profile.avatar[k] === c ? ' sel' : '')}
          style={{ background: c }} onClick={() => onAvatar({ ...profile.avatar, [k]: c })} />
      ))}
    </div>
  )
  return (
    <>
      <div className="card center">
        <div className="row" style={{ justifyContent: 'center' }}>
          <Avatar avatar={profile.avatar} equipped={profile.equipped} size={120} mood={mood} />
          <Pet color={petColor} size={70} mood={mood} name="Pixi" />
        </div>
        <h1>{profile.name}</h1>
        <span className="chip">Nivel {lvl.level} · {lvl.title}</span>
        <div className="muted small">
          {profile.xp} XP · mejor racha: {profile.bestStreak || 0} días · {completed} misiones completadas
        </div>
        <div className="spacer" />
        <button className="sec mini" onClick={() => setEditing(e => !e)}>
          {editing ? 'Listo' : '✏️ Editar personaje'}
        </button>
      </div>

      {editing && (
        <div className="card">
          <label>Forma</label>
          <div className="swatches">
            {BODY_SHAPES.map(b => (
              <div key={b.id} title={b.name}
                className={'hair-opt' + ((profile.avatar?.body || 'a') === b.id ? ' sel' : '')}
                onClick={() => onAvatar({ ...profile.avatar, body: b.id })}>
                <Avatar avatar={{ ...profile.avatar, body: b.id }} size={42} mood="happy" />
              </div>
            ))}
          </div>
          <label>Piel</label><Sw colors={SKINS} k="skin" />
          <label>Peinado</label>
          <div className="swatches">
            {HAIR_STYLES.map(h => (
              <div key={h.id} title={h.name}
                className={'hair-opt' + ((profile.avatar?.hairStyle || 'clasico') === h.id ? ' sel' : '')}
                onClick={() => onAvatar({ ...profile.avatar, hairStyle: h.id })}>
                <Avatar avatar={{ ...profile.avatar, hairStyle: h.id }} size={42} mood="happy" />
              </div>
            ))}
          </div>
          <label>Pelo</label><Sw colors={HAIRS} k="hair" />
          <label>Ojos</label><Sw colors={EYES} k="eye" />
          <label>Polera</label><Sw colors={SHIRTS} k="shirt" />
          <label>Pantalón</label><Sw colors={PANTS} k="pants" />
          <label>Zapatos</label><Sw colors={SHOES} k="shoes" />
          <label>Color de tu mascota</label>
          <div className="swatches">
            {PET_COLORS.map(c => (
              <div key={c} className={'swatch' + (petColor === c ? ' sel' : '')}
                style={{ background: c }} onClick={() => onAvatar({ ...profile.avatar, petColor: c })} />
            ))}
          </div>
        </div>
      )}

      <h2>Skills</h2>
      <p className="muted small">Suben cuando haces check-in en misiones que las tengan asociadas.</p>
      <div className="skills-grid">
        {allSkills.map(s => (
          <SkillCard key={s.id} skill={s}
            xp={profile.avatar?.skills?.[s.id] || 0}
            streakDays={skillStreak(goals, s.id)} />
        ))}
      </div>

      <h2>Portada</h2>
      <div className="card">
        <p className="muted small">La imagen de portada de tu inicio. Se desbloquean subiendo de nivel.</p>
        <div className="bgs">
          {COVERS.map(c => {
            const locked = lvl.level < c.minLevel && !(profile.avatar?.ownedCovers || []).includes(c.id)
            return (
              <div key={c.id} className={'cover-opt' + (curCover === c.id ? ' sel' : '') + (locked ? ' locked' : '')}
                onClick={() => !locked && onAvatar({ ...profile.avatar, cover: c.id })}>
                <div className="cover-thumb"><CoverThumb id={c.id} /></div>
                <div className="bg-nm">{locked ? `🔒 Nv ${c.minLevel}` : c.name}</div>
              </div>
            )
          })}
          {banners.filter(b => (profile.avatar?.ownedCovers || []).includes(b.id)).map(b => (
            <div key={b.id} className={'cover-opt' + (curCover === b.id ? ' sel' : '')}
              onClick={() => onAvatar({ ...profile.avatar, cover: b.id })}>
              <div className="cover-thumb"><CoverThumb image={b.image} /></div>
              <div className="bg-nm">{b.name || 'Banner'}</div>
            </div>
          ))}
        </div>
      </div>

      <h2>Fondo de la app</h2>
      <div className="card">
        <p className="muted small">3 gratis para todos. Los demás se desbloquean subiendo de nivel.</p>
        <div className="bgs">
          {BACKGROUNDS.map(b => {
            const locked = lvl.level < b.minLevel
            return (
              <div key={b.id} className={'bg-opt' + (curBg === b.id ? ' sel' : '') + (locked ? ' locked' : '')}
                onClick={() => !locked && onAvatar({ ...profile.avatar, bg: b.id })}>
                <div className="bg-swatch" style={{ background: b.css }} />
                <div className="bg-nm">{locked ? `🔒 Nv ${b.minLevel}` : b.name}</div>
              </div>
            )
          })}
        </div>
      </div>

      <h2>Inventario</h2>
      <p className="muted small">
        Toca un objeto desbloqueado para ponérselo a tu personaje. El botín se gana
        eligiéndolo al crear una misión; los logros se desbloquean solos.
      </p>
      {Object.entries(TIERS).map(([tid, tier]) => {
        const group = ITEMS.filter(it => it.kind === 'loot' && it.tier === tid)
        return (
          <div key={tid}>
            <h2 style={{ color: tier.color }}>{tier.name} <span className="muted small">
              ({tier.maxDays === Infinity ? `${tier.minDays}+ días` : `${tier.minDays}-${tier.maxDays} días`})</span></h2>
            <div className="items">
              {group.map(it => {
                const has = earned.has(it.id)
                const eq = profile.equipped?.[it.slot] === it.id
                return (
                  <div key={it.id} className={'item' + (has ? '' : ' locked') + (eq ? ' equipped' : '')}
                    title={it.desc} onClick={() => has && onEquip(it)}>
                    <ItemSprite id={it.id} />
                    <div className="nm">{it.name}</div>
                    {!has && <div className="muted small">🔒 {it.reqCheckins}✔</div>}
                    {eq && <div className="muted small">puesto</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <h2>Logros</h2>
      <div className="items">
        {ITEMS.filter(it => it.kind === 'logro').map(it => {
          const has = earned.has(it.id)
          const eq = profile.equipped?.[it.slot] === it.id
          return (
            <div key={it.id} className={'item' + (has ? '' : ' locked') + (eq ? ' equipped' : '')}
              title={it.desc} onClick={() => has && onEquip(it)}>
              <ItemSprite id={it.id} />
              <div className="nm">{it.name}</div>
              {!has && <div className="muted small">🔒</div>}
              {eq && <div className="muted small">puesto</div>}
            </div>
          )
        })}
      </div>

      <h2>Preferencias</h2>
      <div className="card">
        <div className="row">
          <div className="grow">
            <b>Modo oscuro</b>
            <div className="muted small">Cambia el tema de la app</div>
          </div>
          <button className={'toggle' + (theme === 'dark' ? ' on' : '')} role="switch"
            aria-checked={theme === 'dark'} aria-label="Modo oscuro" onClick={onToggleTheme}>
            <span className="knob" />
          </button>
        </div>
      </div>

      <h2>Cuenta</h2>
      <div className="card">
        {profile.isAdmin && (
          <>
            <button className="acc" onClick={onAdmin}>🛠 Panel de administración</button>
            <div className="spacer" />
          </>
        )}
        <button className="sec" onClick={onLogout}>Cerrar sesión</button>
      </div>
      <p className="muted small center">LevelApp v0.3 · sincronizado en la nube ☁️</p>
    </>
  )
}

export default Profile
