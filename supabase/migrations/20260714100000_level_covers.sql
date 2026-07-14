-- Portadas por nivel (pradera/bosque/playa/castillo/ciudad/noche) hoy son
-- dibujos vectoriales hechos en codigo (coverScene() en Avatar.jsx). Martin
-- quiere reemplazarlas por fotos reales que el sube desde el panel de admin,
-- sin volver a usar dibujos vectoriales. Esta tabla guarda la imagen (mismo
-- patron que store_items: sin Supabase Storage, se guarda un data-URL).
-- Mientras un id no tenga fila/imagen aca, el cliente sigue mostrando el
-- dibujo vectorial como respaldo (no rompe nada mientras Martin sube las 6).

create table if not exists level_covers (
  id text primary key,
  image_url text,
  updated_at timestamptz not null default now()
);

alter table level_covers enable row level security;

create policy "anyone reads level covers" on level_covers
  for select using (true);

create policy "admin manages level covers" on level_covers
  for all using (is_app_admin()) with check (is_app_admin());
