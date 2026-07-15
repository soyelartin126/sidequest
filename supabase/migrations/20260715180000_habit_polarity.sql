-- Habitos "a dejar" (dejar de fumar, no comprar comida chatarra, etc.)
-- ademas de los "a hacer" que ya existian. Es un eje distinto de `kind`
-- (kind = como se mide el progreso; polarity = que se busca lograr), asi
-- que va en una columna aparte. Aditivo: default 'hacer' deja todo lo
-- existente exactamente igual. Se agrega en goals y quests por la misma
-- razon que las columnas anteriores (kind, target_number, etc.) se
-- agregaron a ambas tablas a la vez -- aunque esta primera version solo
-- se expone en misiones personales (goals), no en retos de grupo.

alter table goals
  add column if not exists polarity text not null default 'hacer'
    check (polarity in ('hacer','evitar'));

alter table quests
  add column if not exists polarity text not null default 'hacer'
    check (polarity in ('hacer','evitar'));
