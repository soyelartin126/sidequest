-- Piloto B2B ("equipos") + B2B2C ("retos publicos").
-- Aditivo y no destructivo: todas las columnas nuevas son nullable, ninguna
-- fila existente cambia de comportamiento. Ver plan en
-- /Users/martinortega/.claude/plans/parsed-fluttering-hennessy.md

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  contact_email text,
  billing_status text not null default 'trial'
    check (billing_status in ('trial','active','paused','cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

alter table groups add column if not exists business_id uuid references businesses(id) on delete set null;

alter table quests
  add column if not exists business_id uuid references businesses(id) on delete set null,
  add column if not exists comuna text[],
  add column if not exists capacity integer,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

alter table businesses enable row level security;

drop policy if exists "businesses_select" on businesses;
create policy "businesses_select" on businesses for select
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    or exists (
      select 1 from groups
      where groups.business_id = businesses.id
        and (groups.owner_id = auth.uid()
             or exists (select 1 from group_members
                        where group_id = groups.id and user_id = auth.uid()))
    )
  );

-- ---------------------------------------------------------------------
-- RLS: solo el dueno/admin del grupo (o un admin global, para retos
-- publicos con group_id null) puede insertar retos. Reconciliar con
-- policies existentes si ya hay algo similar antes de correr esto.
-- ---------------------------------------------------------------------
alter table quests enable row level security;

drop policy if exists "quests_insert_scoped" on quests;
create policy "quests_insert_scoped" on quests for insert
  with check (
    (group_id is null
       and exists (select 1 from profiles where id = auth.uid() and is_admin = true))
    or
    (group_id is not null and (
       exists (select 1 from groups where id = quests.group_id and owner_id = auth.uid())
       or exists (select 1 from group_members
                  where group_id = quests.group_id and user_id = auth.uid() and role = 'admin')
    ))
  );

-- refuerzo de privacidad: hoy cualquier usuario autenticado puede leer
-- quests.select('*') sin filtro (fetchState en supabase.js). Los retos
-- publicos (group_id null) los ve cualquiera; los de un grupo, solo sus
-- miembros.
drop policy if exists "quests_select_scoped" on quests;
create policy "quests_select_scoped" on quests for select
  using (
    group_id is null
    or exists (select 1 from group_members
               where group_id = quests.group_id and user_id = auth.uid())
    or exists (select 1 from groups where id = quests.group_id and owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- Lista de correos autorizados para grupos-empresa: el admin del grupo
-- decide quien puede sumarse al equipo (los retos internos ya quedan
-- protegidos solo con esto, porque se ven/toman siendo miembro del grupo).
-- ---------------------------------------------------------------------
create table if not exists company_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  email text not null,
  invited_at timestamptz not null default now(),
  joined_user_id uuid references profiles(id),
  unique (group_id, email)
);

alter table company_invites enable row level security;

drop policy if exists "company_invites_admin_all" on company_invites;
create policy "company_invites_admin_all" on company_invites for all
  using (
    exists (select 1 from groups where id = company_invites.group_id and owner_id = auth.uid())
    or exists (select 1 from group_members
               where group_id = company_invites.group_id and user_id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from groups where id = company_invites.group_id and owner_id = auth.uid())
    or exists (select 1 from group_members
               where group_id = company_invites.group_id and user_id = auth.uid() and role = 'admin')
  );

-- nueva funcion de union: si el grupo es de empresa (business_id no nulo),
-- solo deja unirse a correos previamente autorizados en company_invites.
-- Los grupos normales (familia/amigos) siguen funcionando exactamente igual
-- que hoy. No modifica join_group_by_code (la funcion vieja queda intacta
-- por si algo mas la usa); el cliente pasa a llamar esta version nueva.
create or replace function join_group_by_code_v2(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  g groups%rowtype;
  user_email text;
begin
  select * into g from groups where invite_code = code;
  if not found then
    raise exception 'invalid_code';
  end if;

  if g.business_id is not null then
    select email into user_email from auth.users where id = auth.uid();
    if user_email is null or not exists (
      select 1 from company_invites where group_id = g.id and lower(email) = lower(user_email)
    ) then
      raise exception 'not_invited';
    end if;
  end if;

  if not exists (select 1 from group_members where group_id = g.id and user_id = auth.uid()) then
    insert into group_members (group_id, user_id, role) values (g.id, auth.uid(), 'member');
  end if;

  update company_invites set joined_user_id = auth.uid()
  where group_id = g.id and lower(email) = lower(user_email);

  return g.id;
end;
$$;

-- conteo de cupos de un reto publico: goals solo deja ver las filas propias
-- de cada usuario (por eso el progreso de equipo en grupos funciona pero
-- esto no), asi que se necesita una funcion que devuelva solo el numero,
-- sin exponer quien se unio.
create or replace function quest_join_counts(quest_ids uuid[])
returns table(quest_id uuid, joined_count bigint)
language sql
security definer
set search_path = public
as $$
  select goals.quest_id, count(*) from goals
  where goals.quest_id = any(quest_ids)
  group by goals.quest_id;
$$;
