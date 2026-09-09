@AGENTS.md

## Notas específicas para Claude Code

- Este es un monorepo con pnpm workspaces (`backend/` y `frontend/`). No usar
  npm ni yarn — instalar siempre con `pnpm install` desde la raíz.
- Antes de generar código para cualquier módulo de fuente, releer la sección
  correspondiente en AGENTS.md (6.1 a 6.4) — cada fuente tiene su propio link
  oficial, formato de datos y particularidades (por ejemplo, el módulo de TSE
  nunca debe persistir datos personales).
- Si el cambio toca `backend/src/<fuente>/`, seguir el patrón de la sección 5
  de AGENTS.md (service, entity, controller, cron) para mantener los cuatro
  módulos consistentes entre sí.
