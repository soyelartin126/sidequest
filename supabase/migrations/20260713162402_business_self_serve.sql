-- Panel de empresa self-serve: una empresa se registra sola (sin que Martin
-- tenga que crear la fila a mano en Studio), puede tener varios equipos, y
-- su dueno es tambien un usuario normal que participa en los retos.
-- Ver plan en /Users/martinortega/.claude/plans/parsed-fluttering-hennessy.md

alter table businesses add column if not exists owner_id uuid references profiles(id);

drop policy if exists "businesses_select" on businesses;
create policy "businesses_select" on businesses for select
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    or businesses.owner_id = auth.uid()
    or exists (
      select 1 from groups
      where groups.business_id = businesses.id
        and (groups.owner_id = auth.uid()
             or exists (select 1 from group_members
                        where group_id = groups.id and user_id = auth.uid()))
    )
  );

drop policy if exists "businesses_insert_owner" on businesses;
create policy "businesses_insert_owner" on businesses for insert
  with check (owner_id = auth.uid());

drop policy if exists "businesses_update_owner" on businesses;
create policy "businesses_update_owner" on businesses for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- crea un equipo nuevo bajo una empresa propia (codigo de invitacion +
-- membresia admin) en una sola operacion atomica, verificando que quien
-- llama sea realmente el dueno de esa empresa.
create or replace function create_business_group(p_business_id uuid, p_name text, p_theme text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group_id uuid;
  gen_code text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  if not exists (select 1 from businesses where id = p_business_id and owner_id = auth.uid()) then
    raise exception 'not_owner';
  end if;

  loop
    gen_code := '';
    for i in 1..6 loop
      gen_code := gen_code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from groups where invite_code = gen_code);
  end loop;

  insert into groups (name, theme, owner_id, invite_code, business_id)
  values (p_name, p_theme, auth.uid(), gen_code, p_business_id)
  returning id into new_group_id;

  insert into group_members (group_id, user_id, role) values (new_group_id, auth.uid(), 'admin');
  return new_group_id;
end;
$$;

-- cierre de un hueco de suplantacion: groups no tenia RLS en absoluto, asi
-- que cualquiera podia forjar un insert crudo con el business_id de otra
-- empresa. Se activa RLS con policies permisivas (mismo comportamiento de
-- hoy) en select/update/delete, y solo se restringe insert.
alter table groups enable row level security;

drop policy if exists "groups_select_all" on groups;
create policy "groups_select_all" on groups for select using (true);

drop policy if exists "groups_update_all" on groups;
create policy "groups_update_all" on groups for update using (true) with check (true);

drop policy if exists "groups_delete_all" on groups;
create policy "groups_delete_all" on groups for delete using (true);

drop policy if exists "groups_insert_scoped" on groups;
create policy "groups_insert_scoped" on groups for insert
  with check (
    business_id is null
    or exists (select 1 from businesses where id = business_id and owner_id = auth.uid())
  );
