-- Boss Fights: un 4to kind de reto de grupo ('jefe'). Reutiliza casi todo
-- lo que ya existe: target_number = HP maximo del jefe, title/image_url =
-- nombre/arte del jefe, starts_at/ends_at = periodo del desafio,
-- freq_per_week (sin uso real hoy para ningun kind salvo constancia) pasa
-- a significar "segundos para esquivar" cuando kind='jefe' (mismo patron
-- ya usado de reaprovechar una columna existente con otro significado
-- segun el kind, ej. weeks como "dias de duracion" en reconocimiento).
-- El daño se calcula 100% en el cliente a partir de los checkins de cada
-- miembro (mismo dato que ya usa goalProgress) - no se duplica esa formula
-- aca porque no cruza ningun limite de seguridad, es solo para el mismo
-- equipo.

alter table quests drop constraint if exists quests_kind_check;
alter table quests add constraint quests_kind_check
  check (kind in ('constancia','numero','reconocimiento','jefe'));

alter table goals drop constraint if exists goals_kind_check;
alter table goals add constraint goals_kind_check
  check (kind in ('constancia','numero','reconocimiento','jefe'));

-- marca un jefe como derrotado y completa (con codigo de canje individual
-- si el reto tiene premio) el goal de cada miembro que participo. Mismo
-- patron SECURITY DEFINER que award_recognition: un miembro cualquiera no
-- puede completar el goal de otro con las reglas normales.
create or replace function defeat_boss(p_quest_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  q quests%rowtype;
  gid uuid;
  code text;
begin
  select * into q from quests where id = p_quest_id;
  if not found then raise exception 'quest_not_found'; end if;
  if q.kind is distinct from 'jefe' then raise exception 'wrong_kind'; end if;
  if q.awarded_at is not null then raise exception 'already_awarded'; end if;
  if q.group_id is null or not is_group_member(q.group_id) then
    raise exception 'not_a_member';
  end if;

  update quests set awarded_at = now() where id = p_quest_id;

  for gid in select id from goals where quest_id = p_quest_id and status = 'active' loop
    code := null;
    if q.prize is not null or q.image_url is not null then
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1+floor(random()*32)::int, 1), '')
        into code from generate_series(1,6);
    end if;
    update goals set status = 'completed', completed_at = now(), redeem_code = code where id = gid;
  end loop;
end;
$$;
