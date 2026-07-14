# Roadmap de LevelApp

Registro de fases y estado del proyecto. El detalle línea por línea de cada
cambio vive en `git log`; esto es el resumen de alto nivel para saber "dónde
vamos" sin tener que reconstruirlo de memoria en cada sesión.

## Fases grandes

- [x] **Fase 1 — Dominio propio**: `lvlapp.cl` conectado (DNS en Cloudflare),
  deploy automático en Vercel al pushear a `main`.
- [~] **Fase 2 — Correo real**: activado Resend para recordatorios de
  check-in, invitaciones de equipo y avisos de nuevo reto. Falta: flujo de
  verificación de correo al registrarse, trigger de creación de `profile`
  más robusto.
- [ ] **Fase 3 — PWA / App Store / Play Store**: sin empezar.

## Hecho

**Personaje y arte**
- Motor de personaje basado en la librería LPC (Liberated Pixel Cup), piezas
  recoloreables por paleta en vez de sprites procedurales.
- Objetos equipables con capas LPC reales (reemplazó ítems inventados).
- Animación idle sutil, tamaño y encuadre del personaje ajustados en Inicio.
- Modo oscuro por defecto + fondos ilustrados (bosque de noche/día).

**Progresión y misiones**
- Sistema de niveles, rachas, escudos de racha, monedas y tienda.
- Sistema de skills tipo RPG asociadas a cada misión, con racha por skill.
- Reto permanente (sin fecha de término) y frecuencia "todos los días".
- **Tipos de reto de grupo**: constancia (original), número/ranking (meta +
  unidad, tabla de posiciones real del equipo), reconocimiento (el admin
  premia manualmente a un integrante). Los tres con premio + imagen opcional.

**B2B / B2B2C**
- Modelo de negocio con `businesses` + `groups` con `business_id`.
- Retos públicos B2B2C con comuna/capacidad/fechas.
- Panel de empresa self-serve: registro de empresa, logo, múltiples equipos,
  "equipo autorizado" por correo con invitación + código.
- Medalla/badge de empresa visible en Inicio, Grupos y Perfil.
- Correos automáticos: invitación de equipo, nuevo reto publicado,
  recordatorio de check-in con progreso real (incluye retos de número).

**Cuenta y admin**
- Registro con onboarding (intereses → misiones sugeridas), recuperar
  contraseña, selector de forma de personaje.
- Panel super admin: métricas, usuarios, anuncios, banners de tienda.

**Orden del código** (2026-07-14)
- `App.jsx` bajó de 1127 a 278 líneas separando `Home.jsx`, `Onboarding.jsx`,
  `AuthScreen.jsx`, `Quests.jsx`, `Store.jsx`, `Groups.jsx` (antes ya se
  habían sacado `Profile.jsx`/`Goals.jsx`). Ningún archivo del proyecto
  supera ahora las ~350 líneas.
- Se agregó `CLAUDE.md` con el contexto que antes había que re-descubrir
  explorando el repo en cada sesión nueva (patrones, cuentas de prueba,
  trampas de RLS conocidas).

## Bugs reales encontrados y corregidos (vale la pena recordarlos)

- **`groups`**: políticas de Studio no versionadas coexistían con políticas
  nuevas y las anulaban (PERMISSIVE se combina con OR). Corregido en
  `20260713170000_fix_groups_policies.sql`.
- **`checkins`**: no existía ninguna policy que dejara a un admin/compañero
  de equipo ver los check-ins de otro miembro — el ranking de retos de
  número (y las barras de constancia que ya estaban en producción) mostraban
  0 para todos menos uno mismo. Corregido en
  `20260714010000_fix_checkins_group_visibility.sql`.

## Pendiente / ideas futuras

- Terminar Fase 2 (verificación de correo al registro).
- Empezar Fase 3 (PWA / empaquetado para tiendas).
- Agregar policy de DELETE para retos de grupo (hoy un admin no puede borrar
  un reto que creó, solo pausarlo/editarlo).
- Limpieza de datos de prueba — ver lista en `CLAUDE.md`.
