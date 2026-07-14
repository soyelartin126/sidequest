import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const sbAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

Deno.serve(async req => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'missing_auth' }), { status: 401 })

  const { inviteId } = await req.json()
  if (!inviteId) return new Response(JSON.stringify({ error: 'missing_inviteId' }), { status: 400 })

  // cliente con el JWT de quien llama: la fila solo vuelve si el llamador
  // es admin/dueño del grupo (misma politica que ya protege company_invites)
  const sbCaller = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user } } = await sbCaller.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

  const { data: invite, error } = await sbCaller
    .from('company_invites')
    .select('id, email, group_id, groups(name, invite_code, businesses(name))')
    .eq('id', inviteId)
    .single()
  if (error || !invite) return new Response(JSON.stringify({ error: 'not_found_or_forbidden' }), { status: 403 })

  const groupName = invite.groups?.name || 'tu equipo'
  const bizName = invite.groups?.businesses?.name
  const code = invite.groups?.invite_code

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'LevelApp <hi@lvlapp.cl>',
      to: [invite.email],
      subject: `Te invitaron a ${groupName} en LevelApp`,
      html: `
        <div style="font-family: sans-serif; color: #16263F;">
          <h2>¡Te invitaron a un equipo en LevelApp!</h2>
          <p>${bizName ? `${bizName} te invitó a` : 'Te invitaron a'} unirte a <b>${groupName}</b>.</p>
          <p>Para unirte:</p>
          <ol style="font-size:15px;">
            <li>Crea tu cuenta o entra en <a href="https://lvlapp.cl">lvlapp.cl</a> con este mismo correo (${invite.email}).</li>
            <li>Ve a "Grupos" y elige "Unirme con código".</li>
            <li>Ingresa el código: <b style="font-size:20px; letter-spacing:3px;">${code}</b></li>
          </ol>
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

  return new Response(JSON.stringify({ sent: res.ok }), { status: 200 })
})
