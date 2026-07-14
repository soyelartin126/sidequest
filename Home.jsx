import { GoalCard } from './Goals.jsx'
import Avatar, { Cover, Pet, PET_COLORS, coverById } from './Avatar.jsx'
import { Bar, IconGlyph, CompanyBadge } from './ui.jsx'
import { weekDots, SHIELD_CAP } from './game.js'

export function Home({ profile, lvl, stk, goals, mood = 'happy', banners = [], groups = [], pendingRedeem, onGoal, onRedeem, onNew, onStore }) {
  const active = goals.filter(g => g.status === 'active')
  const dots = weekDots(goals)
  const shields = profile.avatar?.shields ?? 1
  const coins = profile.avatar?.coins || 0
  const petColor = profile.avatar?.petColor ?? PET_COLORS[0]
  const coverBanner = banners.find(b => b.id === profile.avatar?.cover)
  const company = groups.find(g => g.businessName)
  return (
    <>
      <Cover id={coverById(profile.avatar?.cover).id} image={coverBanner?.image} greeting={`Hola, ${profile.name}`} sub="Gamifica tu vida" />

      <div className="card row lift">
        <Avatar avatar={profile.avatar} equipped={profile.equipped} size={110} animate />
        <div className="grow">
          <h1>{profile.name}</h1>
          <span className="chip">Nivel {lvl.level} · {lvl.title}</span>
          {company && <CompanyBadge name={company.businessName} logo={company.businessLogo} />}
          <div className="spacer" />
          <Bar frac={lvl.progress} />
          <div className="muted small">
            {lvl.next ? `${profile.xp} / ${lvl.next.xp} XP` : `${profile.xp} XP · nivel máximo`}
          </div>
        </div>
      </div>

      <div className="coinbar">
        <span className="chip" style={{ background: '#FFF0D6', color: '#8A5A00', fontSize: 14 }}>🪙 {coins} monedas</span>
        <button className="mini acc" onClick={onStore}>🛍 Tienda</button>
      </div>

      <div className="card">
        <div className="row">
          <IconGlyph icon="🔥" size={30} />
          <div className="grow">
            <h3>Racha: {stk} {stk === 1 ? 'día' : 'días'}</h3>
            <div className="dots">
              {dots.map((d, i) => (
                <div key={i} className={'dot' + (d.done ? ' on' : '') + (d.future ? ' future' : '')}>{d.label}</div>
              ))}
            </div>
            <div className="shields" title="Los escudos protegen tu racha si te saltas un día">
              {Array.from({ length: SHIELD_CAP }, (_, i) => (
                <span key={i} className={'shield-ico' + (i < shields ? '' : ' spent')}>🛡</span>
              ))}
              <span className="muted small">{shields}/{SHIELD_CAP} escudos</span>
            </div>
          </div>
          <Pet color={petColor} size={62} mood={mood} name="Pixi" />
        </div>
      </div>

      {pendingRedeem.map(g => (
        <div key={g.id} className="banner row" onClick={() => onRedeem(g)} style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: 28 }}>🏆</span>
          <div className="grow">
            <b>¡Tienes un canje disponible!</b>
            <div className="muted small">{g.prize} · {g.sponsor} — toca para ver tu código</div>
          </div>
        </div>
      ))}

      <h2>Misiones activas</h2>
      {active.length === 0 && (
        <div className="card center">
          <p className="muted">Sin misiones activas. ¡Crea tu primer objetivo!</p>
          <button onClick={onNew}>+ Nueva misión</button>
        </div>
      )}
      {active.map(g => <GoalCard key={g.id} g={g} onClick={() => onGoal(g)} />)}
      {active.length > 0 && <button className="sec" onClick={onNew}>+ Nueva misión</button>}
    </>
  )
}
