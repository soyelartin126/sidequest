-- Tipos de reto: ademas de "constancia" (el unico que existia), se agregan
-- "numero" (meta numerica + ranking de equipo) y "reconocimiento" (premio
-- manual tipo "empleado del mes", sin seguimiento). Aditivo, no rompe nada
-- existente: kind default 'constancia' deja los retos actuales tal cual.
-- Ver plan en /Users/martinortega/.claude/plans/parsed-fluttering-hennessy.md

alter table quests
  add column if not exists kind text not null default 'constancia'
    check (kind in ('constancia','numero','reconocimiento')),
  add column if not exists target_number numeric,
  add column if not exists unit_label text,
  add column if not exists awarded_to uuid references profiles(id),
  add column if not exists awarded_at timestamptz;

alter table goals
  add column if not exists kind text not null default 'constancia'
    check (kind in ('constancia','numero','reconocimiento')),
  add column if not exists target_number numeric,
  add column if not exists unit_label text,
  add column if not exists awarded_to uuid references profiles(id),
  add column if not exists awarded_at timestamptz;

alter table checkins add column if not exists value numeric;

-- asigna un reto de reconocimiento a un integrante del equipo. Ningun admin
-- de grupo puede insertar un goal a nombre de otra persona con las reglas
-- normales (goals solo se administra "cada quien lo suyo"), asi que esto
-- necesita SECURITY DEFINER, mismo patron que join_group_by_code_v2 /
-- create_business_group. Crea el goal ya completado (con premio y codigo
-- de canje si corresponde), reutilizando gratis la pantalla de canje y el
-- aviso de "mision completada" que ya existen para avisarle al ganador.
create or replace function award_recognition(p_quest_id uuid, p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  q quests%rowtype;
  is_admin boolean;
  new_goal_id uuid;
  code text;
begin
  select * into q from quests where id = p_quest_id;
  if not found then raise exception 'quest_not_found'; end if;
  if q.kind is distinct from 'reconocimiento' then raise exception 'wrong_kind'; end if;
  if q.awarded_to is not null then raise exception 'already_awarded'; end if;

  select exists(select 1 from groups where id = q.group_id and owner_id = auth.uid())
      or exists(select 1 from group_members where group_id = q.group_id and user_id = auth.uid() and role = 'admin')
  into is_admin;
  if not is_admin then raise exception 'not_admin'; end if;
  if not exists (select 1 from group_members where group_id = q.group_id and user_id = p_user_id) then
    raise exception 'not_a_member';
  end if;

  update quests set awarded_to = p_user_id, awarded_at = now() where id = p_quest_id;

  if q.prize is not null or q.image_url is not null then
    select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1+floor(random()*32)::int, 1), '')
      into code from generate_series(1,6);
  end if;

  insert into goals (user_id, title, prize, image_url, quest_id, kind, freq_per_week, weeks,
                      status, completed_at, redeem_code, awarded_to, awarded_at, meta)
  values (p_user_id, q.title, q.prize, q.image_url, q.id, 'reconocimiento', 1, 0,
          'completed', now(), code, p_user_id, now(), jsonb_build_object('icon', q.meta->>'icon'))
  returning id into new_goal_id;
  return new_goal_id;
end;
$$;
