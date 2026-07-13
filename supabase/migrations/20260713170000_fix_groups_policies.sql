-- Correccion: groups ya tenia politicas propias desde antes (creadas
-- directo en Supabase Studio, nunca estuvieron en ningun archivo de este
-- repo, asi que no las vimos al planear la migracion anterior):
--   "create group" (INSERT, with_check: owner_id = auth.uid())
--   "members see group" (SELECT, using: is_group_member(id) OR owner_id = auth.uid())
--   "owner edits group" (UPDATE, using: owner_id = auth.uid())
--   "owner deletes group" (DELETE, using: owner_id = auth.uid())
--
-- Las policies PERMISSIVE de Postgres se combinan con OR, no con AND. Eso
-- significaba que "create group" (que no chequea business_id) seguia
-- permitiendo el insert forjado sin importar la policy nueva que agregamos.
-- Ademas, las policies "permisivas" que agregamos para select/update/delete
-- (pensando que no habia proteccion previa) en realidad AFLOJABAN lo que
-- ya estaba bien acotado por las 3 policies viejas de arriba.
--
-- Se elimina "create group" (reemplazada por groups_insert_scoped, que
-- hace lo mismo + el chequeo de business_id) y las 3 policies de mas que
-- agregamos, dejando la proteccion original intacta.
drop policy if exists "create group" on groups;
drop policy if exists "groups_select_all" on groups;
drop policy if exists "groups_update_all" on groups;
drop policy if exists "groups_delete_all" on groups;

drop policy if exists "groups_insert_scoped" on groups;
create policy "groups_insert_scoped" on groups for insert
  with check (
    owner_id = auth.uid()
    and (business_id is null
         or exists (select 1 from businesses where id = business_id and owner_id = auth.uid()))
  );
