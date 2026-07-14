import { ItemSprite, CoverThumb, COVERS } from './Avatar.jsx'
import { ITEMS, itemPrice, COVER_PRICE } from './game.js'

// ---------- Tienda (comprar con monedas) ----------
export function Store({ profile, lvl, earned, banners = [], onBack, onBuy }) {
  const coins = profile.avatar?.coins || 0
  const ownedCovers = profile.avatar?.ownedCovers || []
  const loot = ITEMS.filter(it => it.kind === 'loot')
  return (
    <>
      <div className="topbar">
        <button className="sec mini" onClick={onBack}>← Volver</button>
        <h1>Tienda</h1>
      </div>
      <div className="card center">
        <div style={{ fontSize: 28, fontWeight: 800, color: '#8A5A00' }}>🪙 {coins}</div>
        <div className="muted small">Ganas monedas con cada check-in y misión completada</div>
      </div>

      <h2>Objetos</h2>
      <div className="items">
        {loot.map(it => {
          const owned = earned.has(it.id)
          const price = itemPrice(it)
          return (
            <div key={it.id} className="item">
              <ItemSprite id={it.id} />
              <div className="nm">{it.name}</div>
              {owned
                ? <div className="muted small">✔ Tienes</div>
                : <button className="mini" style={{ marginTop: 6 }} disabled={coins < price}
                    onClick={() => onBuy('item', it.id, price)}>🪙 {price}</button>}
            </div>
          )
        })}
      </div>

      <h2>Portadas</h2>
      <div className="bgs">
        {COVERS.map(c => {
          const avail = lvl.level >= c.minLevel || ownedCovers.includes(c.id)
          return (
            <div key={c.id} className="cover-opt">
              <div className="cover-thumb"><CoverThumb id={c.id} /></div>
              {avail
                ? <div className="bg-nm">{lvl.level >= c.minLevel ? `Nv ${c.minLevel}` : 'Comprada ✔'}</div>
                : <button className="mini" style={{ marginTop: 4, padding: '5px 8px', fontSize: 11, width: '100%' }}
                    disabled={coins < COVER_PRICE} onClick={() => onBuy('cover', c.id, COVER_PRICE)}>🪙 {COVER_PRICE}</button>}
            </div>
          )
        })}
        {banners.map(b => {
          const owned = ownedCovers.includes(b.id)
          return (
            <div key={b.id} className="cover-opt">
              <div className="cover-thumb"><CoverThumb image={b.image} /></div>
              {owned
                ? <div className="bg-nm">Comprada ✔</div>
                : <button className="mini" style={{ marginTop: 4, padding: '5px 8px', fontSize: 11, width: '100%' }}
                    disabled={coins < b.price} onClick={() => onBuy('cover', b.id, b.price)}>🪙 {b.price}</button>}
            </div>
          )
        })}
      </div>
      <p className="muted small">Las portadas también se desbloquean gratis al subir de nivel; aquí puedes comprarlas antes.</p>
    </>
  )
}
