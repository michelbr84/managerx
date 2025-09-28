<<<<<<< Current (Your changes)
"# managerx" 
=======
# ManagerX Monorepo

Monorepo do jogo ManagerX (inspirado em CM 01/02) — IA-first.

## Stack

- TypeScript, pnpm workspaces
- Tauri + React (desktop), Vite
- SQLite + Drizzle
- ESLint (estrito) + Prettier
- Vitest
- Commitlint + Semantic Release
- Husky + lint-staged

## Estrutura

```
apps/desktop             # App desktop Tauri + React
packages/core-sim        # Motor de simulação determinístico
packages/db              # Acesso a dados (SQLite + drizzle)
packages/ui              # Componentes React + Tailwind
packages/content         # Dados fictícios (ligas, clubes)
```

## Requisitos

- Node >= 20, pnpm >= 9
- Rust toolchain (para Tauri)
- SQLite3 (runtime)

## Primeiros passos

```bash
pnpm i
pnpm -w build
pnpm dev
```

## Scripts

- `pnpm -w lint` / `format` / `typecheck` / `test` / `build`
- `pnpm dev` roda `apps/desktop`

## CI

- `ci`: lint, typecheck, test, build (Windows/macOS/Linux)
- `release`: semantic-release na branch main
- `canary`: build diário com artefatos

## Notas

- Seeds e testes “golden” placeholders estão nos pacotes.
- Zero warnings de lint são exigidos no CI.
>>>>>>> Incoming (Background Agent changes)
