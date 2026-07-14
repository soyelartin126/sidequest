# LevelApp (sidequest)

App de hábitos gamificada (antes "SideQuest"). React 18 + Vite SPA sin router,
backend Supabase (Postgres + Auth). Producción en **https://lvlapp.cl**
(dominio en Cloudflare DNS, no en NIC.cl), deploy automático en Vercel al
hacer push a `main`. Repo: `soyelartin126/sidequest`.

**Dueño: Martín Ortega — no técnico.** Prefiere español directo, quiere
pruebas reales (screenshots, verificación en navegador) en vez de solo
afirmaciones de que algo "debería funcionar". Antes de dar por terminada una
tarea con UI, levantar el dev server y probarla de verdad.

## Supabase

- Project ref: `vibhdvdnauopyqhoqspo`. Contraseña de DB: **no la tengo**.
- **Migraciones SQL**: las escribo como archivo en `supabase/migrations/`,
  pero las tiene que correr Martín pegándolas en el SQL Editor del dashboard.
  Nunca asumas que una migración ya corrió — pregunta o revisa el estado real.
- **El esquema base (`profiles`, `goals`, `quests`, `checkins`, `store_items`,
  `groups`, `group_members`) fue creado directo en Supabase Studio, nunca
  existió como migración.** Por eso `supabase/migrations/` solo tiene el
  historial reciente (a partir del modelo B2B), no el esquema completo.
- **Edge functions SÍ las despliego yo mismo**: el CLI de Supabase está
  autenticado (`supabase functions deploy <nombre>`). `RESEND_API_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_URL` ya son secrets del proyecto,
  disponibles en cualquier función nueva sin configurar nada.
- **Trampa de RLS ya pisada dos veces**: Supabase Studio permite crear
  políticas de seguridad que nunca quedan en el repo. Antes de escribir una
  migración nueva que toque una tabla existente, pedir a Martín un query de
  **solo lectura** (`select * from pg_policies where tablename in (...)`) y
  revisar qué ya existe. Además: policies PERMISSIVE del mismo comando se
  combinan con **OR**, no AND — una policy vieja permisiva puede anular una
  nueva restrictiva sin dar ningún error.
- Regla aprendida de eso: **probar los límites de seguridad de verdad**
  (insertar/leer con una cuenta sin permiso y confirmar que rebota) en vez de
  asumir que una policy nueva alcanza. Ver ejemplos de este patrón en
  `supabase/migrations/20260713170000_fix_groups_policies.sql` (bug real de
  `groups`) y `20260714010000_fix_checkins_group_visibility.sql` (bug real de
  `checkins`, encontrado probando el ranking con dos cuentas).

## Patrones establecidos

- **SECURITY DEFINER** para cualquier operación que necesite saltarse RLS de
  forma controlada (ej: admin de grupo actuando a nombre de otro usuario).
  Ejemplos: `join_group_by_code_v2`, `create_business_group`,
  `award_recognition`. Siempre validan permisos a mano adentro de la función
  antes de actuar.
- **Correo transaccional**: función Deno con `SUPABASE_SERVICE_ROLE_KEY` +
  `RESEND_API_KEY`, `from: 'LevelApp <hi@lvlapp.cl>'`. Ver
  `supabase/functions/remind-checkins/index.ts` como plantilla.
- **Edge function invocada desde el cliente** (no cron): reenviar el header
  `Authorization` del caller a un segundo cliente Supabase, usar
  `.auth.getUser()` para confirmar identidad, y re-consultar la fila
  relevante bajo las RLS normales del caller como chequeo de permiso (en vez
  de reinventar lógica de autorización). Ver `send-team-invite` y
  `notify-new-quest`.
- **Imágenes**: no hay Supabase Storage. `resizePhoto(file, maxSize)` en
  `utils.js` convierte cualquier imagen a un data-URL JPEG redimensionado
  client-side, se guarda directo en la columna `image_url`/`image`.
- **Deploy**: `npm run build` para verificar, `git push origin main`, Vercel
  hace el resto. Confirmar el hash del bundle en `lvlapp.cl` coincide con el
  build local antes de dar por hecho el despliegue.

## Estructura de archivos

Cada archivo es una pantalla o dominio, ninguno debería crecer más allá de
~300-350 líneas — si un archivo se acerca a eso, es momento de partirlo
(así se hizo con `App.jsx`: de 1127 líneas bajó a 278 sacando `Groups.jsx`,
`Home.jsx`, `Onboarding.jsx`, `AuthScreen.jsx`, `Quests.jsx`, `Store.jsx`).

| Archivo | Contiene |
|---|---|
| `App.jsx` | Componente raíz: sesión, estado global, routing por `tab`/`view`, `doCheckin` |
| `supabase.js` | Cliente Supabase + todos los mapeos fila↔estado y llamadas a la DB |
| `game.js` | Constantes y funciones puras de juego (XP, niveles, rachas, tiers, `goalProgress`/`goalTarget`) |
| `Home.jsx` | Pantalla "Inicio" |
| `Goals.jsx` | `GoalCard`, pantalla "Misiones", `NewGoal`, `GoalDetail` |
| `Groups.jsx` | Pantalla "Grupos" y `GroupDetail` (retos de equipo B2B, tipos de reto) |
| `Quests.jsx` | Pantalla "Premios" (retos de comercios externos), `Redeem`, `Credits` |
| `Store.jsx` | Tienda de monedas |
| `Onboarding.jsx` | Flujo de bienvenida para cuentas nuevas |
| `AuthScreen.jsx` | Login/registro/recuperar contraseña, incluye registro de empresa |
| `Profile.jsx` | Pantalla "Perfil" (skills, inventario, logros, ajustes) |
| `BusinessHome.jsx` | Pantalla "Empresa" (dueño de negocio ve sus equipos) |
| `Admin.jsx` | Panel de administración global |
| `Avatar.jsx` | Render del personaje LPC + sprites de ítems/mascota |
| `characterEngine.js` | Motor canvas de recoloreado de paletas LPC |
| `ui.jsx` | Componentes UI compartidos chicos (`Bar`, `IconGlyph`, `Backdrop`, etc.) |
| `utils.js` | `resizePhoto` |

## Cuentas de prueba (producción real, password `testing123` salvo nota)

- **Prueba Trigger** — la más antigua, tiene historial real de check-ins/racha.
- **`test-visual-check@example.com`** ("Test Visual") — pruebas de avatar.
- **`business-owner-test@example.com`** — dueño de "Panadería Ortega Test",
  equipos "Ventas" y "Diseño".
- **`empleado-test-b2b@example.com`** — cuenta sin privilegios, usada para
  pruebas negativas de permisos (confirmar que NO puede ver/tocar datos de
  otras empresas). También es miembro de "Empresa Test SA" y ahora también
  de "Ventas" (Panadería Ortega Test).
- `@example.com` es un dominio reservado sin bandeja real — no sirve para
  probar que un correo transaccional efectivamente llega. Para eso, pedir
  autorización explícita a Martín antes de usar un correo real suyo.

## Pendientes de limpieza conocidos (no urgentes)

- Fila de prueba `quests.id = 4ac66e37-ea98-4c47-8258-328c4d5a4076` ("TEST
  negative-check quest") — no se pudo borrar desde la app porque **no existe
  política de DELETE para retos de grupo** (los admins pueden crear/editar
  pero no borrar). Pendiente: agregar esa policy o borrar directo por SQL.
- Quest "Test intruso" en grupo "Empresa Test".
- Cuenta de prueba antigua `artincontacto+leveltest1@gmail.com`.

Ver también `ROADMAP.md` para el estado de las fases del proyecto.
