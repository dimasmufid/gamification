# Repository Guidelines

This Next.js 16 + TypeScript frontend powers the game dashboard experience. Follow the practices below to keep contributions predictable and review-friendly.

## Project Structure & Module Organization
- `src/app/` hosts the App Router entry points; `layout.tsx` wires shared providers and metadata while `page.tsx` composes the dashboard views. Global styles and Tailwind layers live in `src/app/globals.css`.
- `src/components/ui/` contains Radix-based primitives and shared widgets. Co-locate component-specific helpers in the same folder to keep imports simple.
- `src/lib/` gathers pure utilities such as data formatters or API helpers; keep them side-effect free to simplify reuse and testing.
- `public/` stores static assets referenced with absolute `/` paths. Update favicons or manifest assets here.
- Repo-level configs (`eslint.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `components.json`) are single sources of truth; keep changes scoped and documented in PRs.

## Build, Test, and Development Commands
- `npm install` — install dependencies; prefer npm because `package-lock.json` is committed.
- `npm run dev` — start the dev server on `http://localhost:3000` with hot reload.
- `npm run build` — create an optimized production bundle; run before every release PR.
- `npm run start` — serve the last build locally to verify production behavior.
- `npm run lint` — execute ESLint with the Next.js shareable config and TypeScript rules.

## Coding Style & Naming Conventions
- Use TypeScript-only modules (`.ts`/`.tsx`); enable strict typings when adding tsconfig rules.
- React components are functional, PascalCase files (`ScoreCard.tsx`); hooks live either near callers or in `src/lib` and are prefixed with `use`.
- Prefer Tailwind utility classes defined in `globals.css`; keep custom tokens in CSS `@theme` blocks.
- Follow ESLint’s ordering (imports grouped, unused vars forbidden). Run `npm run lint -- --fix` before committing.

## Testing Guidelines
- A formal test harness is not yet committed, so new features should introduce Vitest + React Testing Library (unit/DOM) and Playwright for flows when applicable.
- Co-locate specs beside the code as `*.test.ts[x]`; describe behavior, not implementation.
- Target ≥80% coverage for logic-heavy utilities in `src/lib`, and cover visual states for each UI primitive.
- Run unit suites before linting is considered “green”; note results in your PR description.

## Commit & Pull Request Guidelines
- History currently uses short imperative summaries (e.g., `init`). Continue with present-tense lines, optionally with a Conventional Commit prefix (`feat: add leaderboard grid`).
- Keep commit scope focused (UI, lib, tooling) and include rationale in the body when touching configs.
- PRs should explain motivation, outline key changes, mention any new scripts/tests, and attach UI screenshots for visual tweaks.
- Link related issues, list manual verification steps, and ensure CI (lint/tests) output is pasted or attached.

## Security & Configuration Tips
- Never commit secrets; place runtime keys in `.env.local` and document required variables in the PR.
- Reset local state via `rm -rf .next` when switching branches to avoid cache-related bugs.

## Important Notes
Use bun instead npm