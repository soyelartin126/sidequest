import { useState } from 'react'
import Avatar, {
  Pet, PET_COLORS, CoverThumb, COVERS, ItemSprite,
  GENDERS, SKIN_TONES, HAIR_STYLES, HAIR_COLORS,
} from './Avatar.jsx'
import { Bar, MiniBar, IconGlyph, CompanyBadge } from './ui.jsx'
import { TIERS, ITEMS, SKILLS, skillLevel, skillStreak } from './game.js'

export function SkillCard({ skill, xp, streakDays }) {
  const { level, progress } = skillLevel(xp)
  return (
    <div className="skill-card">
      <div className="skill-ico"><IconGlyph icon={skill.emoji} size={34} /></div>
      <b>{skill.name}</b>
      <div className="muted small">Nivel {level}</div>
      <MiniBar frac={progress} />
      {streakDays > 0 && <div className="skill-streak">🔥 {streakDays} días</div>}
    </div>
  )
}

function Profile({ profile, lvl, earned, goals, mood = 'happy', banners = [], groups = [], levelCovers = {}, theme = 'light', onToggleTheme, onAvatar, onEquip, onAdmin, onCredits, onLogout }) {
  const [editing, setEditing] = useState(false)
  const completed = goals.filter(g => g.status === 'completed').length
  const company = groups.find(g => g.businessName)
  const petColor = profile.avatar?.petColor ?? PET_COLORS[0]
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
  const RampSw = ({ options, k }) => (
    <div className="swatches">
      {options.map(o => (
        <div key={o.id} title={o.name}
          className={'swatch' + ((profile.avatar?.[k] || options[0].id) === o.id ? ' sel' : '')}
          style={{ background: o.ramp[3] }} onClick={() => onAvatar({ ...profile.avatar, [k]: o.id })} />
      ))}
    </div>
  )
  return (
    <>
      <div className="card center">
        <div className="row" style={{ justifyContent: 'center' }}>
          <Avatar avatar={profile.avatar} equipped={profile.equipped} size={120} />
          <Pet color={petColor} size={70} mood={mood} name="Pixi" />
        </div>
        <h1>{profile.name}</h1>
        <span className="chip">Nivel {lvl.level} · {lvl.title}</span>
        {company && <CompanyBadge name={company.businessName} logo={company.businessLogo} />}
        <div className="muted small">
          {profile.xp} XP · mejor racha: {profile.bestStreak || 0} días · {completed} misiones completadas
        </div>
        <div className="spacer" />
        <button className="sec mini" onClick={() => setEditing(e => !e)}>
          {editing ? 'Listo' : <><IconGlyph icon="✏️" size={16} /> Editar personaje</>}
        </button>
      </div>

      {editing && (
        <div className="card">
          <label>Forma</label>
          <div className="swatches">
            {GENDERS.map(g => (
              <div key={g.id} title={g.name}
                className={'hair-opt' + ((profile.avatar?.gender || 'm') === g.id ? ' sel' : '')}
                onClick={() => onAvatar({ ...profile.avatar, gender: g.id })}>
                <Avatar avatar={{ ...profile.avatar, gender: g.id }} size={42} />
              </div>
            ))}
          </div>
          <label>Piel</label><RampSw options={SKIN_TONES} k="skin" />
          <label>Peinado</label>
          <div className="swatches">
            {HAIR_STYLES.map(h => (
              <div key={h.id} title={h.name}
                className={'hair-opt' + ((profile.avatar?.hairStyle || 'none') === h.id ? ' sel' : '')}
                onClick={() => onAvatar({ ...profile.avatar, hairStyle: h.id })}>
                <Avatar avatar={{ ...profile.avatar, hairStyle: h.id }} size={42} />
              </div>
            ))}
          </div>
          <label>Color de pelo</label><RampSw options={HAIR_COLORS} k="hairColor" />
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
                <div className="cover-thumb"><CoverThumb id={c.id} image={levelCovers[c.id]} /></div>
                <div className="bg-nm">{locked ? <><IconGlyph icon="🔒" size={13} /> Nv {c.minLevel}</> : c.name}</div>
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
                    {!has && <div className="muted small"><IconGlyph icon="🔒" size={13} /> {it.reqCheckins}✔</div>}
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
              {!has && <div className="muted small"><IconGlyph icon="🔒" size={13} /></div>}
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
      <p className="muted small center">
        <button className="link-btn" onClick={onCredits}>Créditos del arte de personajes</button>
      </p>
    </>
  )
}

export default Profile
