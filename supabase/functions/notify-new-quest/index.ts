import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const sbAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

Deno.serve(async req => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'missing_auth' }), { status: 401 })

  const { questId } = await req.json()
  if (!questId) return new Response(JSON.stringify({ error: 'missing_questId' }), { status: 400 })

  const sbCaller = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user } } = await sbCaller.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

  // "see quests" es a nivel de miembro, no de admin: se confirma aparte que
  // quien llama es admin del grupo antes de mandar el aviso masivo
  const { data: quest, error } = await sbCaller
    .from('quests')
    .select('id, title, prize, group_id, meta, groups(name)')
    .eq('id', questId)
    .single()
  if (error || !quest || !quest.group_id) return new Response(JSON.stringify({ error: 'not_found' }), { status: 403 })

  const { data: membership } = await sbCaller
    .from('group_members')
    .select('role')
    .eq('group_id', quest.group_id)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()
  const { data: ownedGroup } = await sbCaller
    .from('groups')
    .select('id')
    .eq('id', quest.group_id)
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!membership && !ownedGroup) return new Response(JSON.stringify({ error: 'not_admin' }), { status: 403 })

  const { data: members } = await sbAdmin
    .from('group_members')
    .select('user_id')
    .eq('group_id', quest.group_id)
  const groupName = quest.groups?.name || 'tu equipo'
  const icon = quest.meta?.icon || '🎯'

  let sent = 0
  for (const m of members || []) {
    const { data: userRes } = await sbAdmin.auth.admin.getUserById(m.user_id)
    const email = userRes?.user?.email
    if (!email) continue
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'LevelApp <hi@lvlapp.cl>',
        to: [email],
        subject: `Nuevo reto en ${groupName}`,
        html: `
          <div style="font-family: sans-serif; color: #16263F;">
            <h2>¡Nuevo reto en ${groupName}!</h2>
            <p><span style="font-size:22px;">${icon}</span> <b>${quest.title}</b></p>
            ${quest.prize ? `<p>Premio: ${quest.prize}</p>` : ''}
            <p style="margin-top: 24px;">
              <a href="https://lvlapp.cl" style="background: #F5811F; color: #ffffff; padding: 12px 24px;
                border-radius: 999px; text-decoration: none; font-weight: bold; display: inline-block;">
                Ver reto en LevelApp
              </a>
            </p>
          </div>
        `,
      }),
    })
    if (res.ok) sent++
  }

  return new Response(JSON.stringify({ sent, members: (members || []).length }), { status: 200 })
})
