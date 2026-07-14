-- Bug real encontrado probando el ranking de retos "numero" con dos cuentas:
-- checkins solo tenia la politica "own checkins" (cada quien ve las suyas).
-- goals ya deja ver la fila de otros miembros en un reto de grupo ("group
-- sees quest goals"), pero el join a checkins(day, value) volvia vacio para
-- cualquiera que no fuera el dueno del check-in, porque RLS se aplica por
-- separado a cada tabla del join. Esto afectaba tanto al ranking nuevo como
-- a las barras de progreso de retos "constancia" que ya estaban en
-- produccion (probablemente ya venian mostrando 0 para companeros de
-- equipo). Mismo patron que "group sees quest goals": solo lectura, scoped
-- a checkins de goals que pertenecen a un reto de un grupo del que el que
-- consulta es miembro.

create policy "group sees quest checkins" on checkins for select
using (
  exists (
    select 1 from goals g
    join quests q on q.id = g.quest_id
    where g.id = checkins.goal_id
      and q.group_id is not null
      and is_group_member(q.group_id)
  )
);
