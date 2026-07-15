// ---- Compartir progreso como imagen (canvas nativo, sin backend ni libs) ----
import { renderCharacter } from './characterEngine.js'

const STORY = { w: 1080, h: 1920 } // Instagram Story (9:16)
const SQUARE = { w: 1080, h: 1080 } // WhatsApp / feed

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function drawCard(canvas, { avatar = {}, equipped = {}, level, title, streak, extra }) {
  const ctx = canvas.getContext('2d')
  const { width: w, height: h } = canvas

  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#16263F')
  bg.addColorStop(1, '#0B1220')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const avatarSrc = await renderCharacter({
    gender: avatar.gender || 'm', skin: avatar.skin || 'light',
    hairStyle: avatar.hairStyle || 'none', hairColor: avatar.hairColor || 'dark_brown',
    equipped,
  })
  const img = await loadImage(avatarSrc)
  const targetW = w * 0.42
  const targetH = targetW * (img.height / img.width)
  ctx.imageSmoothingEnabled = false // nitido, es pixel art
  ctx.drawImage(img, (w - targetW) / 2, h * 0.16, targetW, targetH)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${Math.round(w * 0.06)}px sans-serif`
  ctx.fillText(`Nivel ${level} · ${title}`, w / 2, h * 0.62)

  ctx.fillStyle = '#F5811F'
  ctx.font = `${Math.round(w * 0.045)}px sans-serif`
  ctx.fillText(`🔥 Racha de ${streak} ${streak === 1 ? 'día' : 'días'}`, w / 2, h * 0.68)

  if (extra) {
    ctx.fillStyle = '#cbd5e1'
    ctx.font = `${Math.round(w * 0.038)}px sans-serif`
    ctx.fillText(extra, w / 2, h * 0.735)
  }

  ctx.globalAlpha = 0.55
  ctx.fillStyle = '#9fb4d8'
  ctx.font = `${Math.round(w * 0.03)}px sans-serif`
  ctx.fillText('LevelApp · lvlapp.cl', w / 2, h * 0.95)
  ctx.globalAlpha = 1
}

// devuelve un Blob PNG listo para compartir/descargar
export async function generateShareCard({ avatar, equipped, level, title, streak, extra, square = false }) {
  const size = square ? SQUARE : STORY
  const canvas = document.createElement('canvas')
  canvas.width = size.w
  canvas.height = size.h
  await drawCard(canvas, { avatar, equipped, level, title, streak, extra })
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'))
}

// intenta compartir nativo (Web Share API); si no esta disponible, descarga
export async function shareCard(blob, { title = 'Mi progreso en LevelApp', text = '' } = {}) {
  const file = new File([blob], 'levelapp.png', { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title, text })
    return true
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'levelapp.png'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return false
}
