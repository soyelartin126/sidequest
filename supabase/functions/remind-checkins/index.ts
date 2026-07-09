import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Chile continental: UTC-4 (sin cambio de horario de verano actualmente)
function todayKeyChile() {
  const chile = new Date(Date.now() - 4 * 60 * 60 * 1000)
  return chile.toISOString().slice(0, 10)
}

Deno.serve(async () => {
  const today = todayKeyChile()

  const { data: goals, error } = await sb
    .from('goals')
    .select('user_id, title, checkins(day)')
    .eq('status', 'active')

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  const pendingByUser = new Map()
  for (const g of goals || []) {
    const doneToday = (g.checkins || []).some(c => c.day === today)
    if (doneToday) continue
    const list = pendingByUser.get(g.user_id) || []
    list.push(g.title)
    pendingByUser.set(g.user_id, list)
  }

  let sent = 0
  for (const [userId, titles] of pendingByUser) {
    const { data: userRes } = await sb.auth.admin.getUserById(userId)
    const email = userRes?.user?.email
    if (!email) continue

    const { data: profile } = await sb.from('profiles').select('name').eq('id', userId).single()
    const name = profile?.name || ''
    const items = titles.map(t => `<li>${t}</li>`).join('')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LevelApp <hi@lvlapp.cl>',
        to: [email],
        subject: '¿Registraste tus avances hoy?',
        html: `
          <div style="font-family: sans-serif; color: #16263F;">
            <h2>¿Registraste tus avances hoy?</h2>
            <p>Hola ${name}, todavía te falta el check-in de hoy en:</p>
            <ul>${items}</ul>
            <p>Entra a LevelApp antes de medianoche para no perder tu racha.</p>
            <p style="margin-top: 24px;">
              <a href="https://lvlapp.cl" style="background: #F5811F; color: #ffffff; padding: 12px 24px;
                border-radius: 999px; text-decoration: none; font-weight: bold; display: inline-block;">
                Abrir LevelApp
              </a>
            </p>
          </div>
        `,
      }),
    })
    if (res.ok) sent++
  }

  return new Response(JSON.stringify({ sent, users: pendingByUser.size }), { status: 200 })
})
