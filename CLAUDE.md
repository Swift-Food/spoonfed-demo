# Eden Caterers — Catering Ordering POC

Single-page demo: a B2B catering order travels customer → back office → invoice, one shared order object, nothing re-keyed. Client brand: **Eden Caterers** (sustainable London caterer). This file is the map; the full spec is `@specs/build-plan.md` and the task checklist is `@specs/tasks.md`.

## HARD RULES (do not violate)
- **No backend, no database, no auth provider, no localStorage.** All state lives in one in-memory Zustand store, seeded at startup; a "Reset demo" button re-seeds.
- **One shared `orders` array.** Customer views and back-office views read/mutate the *same* order. Never duplicate order state.
- **Snapshots are immutable.** Editing a Menu/Item must NOT change `nameSnapshot`/`unitPriceSnapshot`/`allergenSnapshot` on existing order lines.
- **Eden brand is mandatory.** All colour via Tailwind `eden.*` tokens (`tailwind.config.js`) — never hard-code hex. Serif headings (Cormorant Garamond), sans UI (Nunito Sans), flower logo + "Eden Caterers" wordmark. See spec §0.5.
- **Currency is GBP (£).** Money stored as numbers, formatted at the edge.
- **Out of scope:** group ordering, card payments. All accounts bill on account.

## STACK (locked — see spec §0)
React 18 + TypeScript (strict) · Vite · react-router-dom v6 · Zustand · Tailwind · lucide-react · date-fns · nanoid. Don't add libraries without strong reason.

## COMMANDS
```bash
npm run dev      # local dev
npm run build    # must pass to ship a phase
npm run lint     # eslint, must be clean
npm run test     # vitest (pure-function tests only)
npx tsc --noEmit # types must compile
```

## ARCHITECTURE POINTERS
- Entities/enums: `src/lib/types.ts` (spec §2). Business logic lives in **pure** functions in `src/lib/rules.ts` (spec §4) and `src/lib/stateMachine.ts` (spec §3) — these are the only things unit-tested.
- Store + all actions: `src/store/useStore.ts` (spec §6). Routes: `src/routes.tsx` (spec §5). Seed: `src/lib/seed.ts` (spec §7).

## WORKFLOW (spec-driven — see spec §11)
1. Plan mode first: read the relevant phase in `@specs/build-plan.md`, update `@specs/tasks.md`, get approval before coding.
2. Build phases 0→4 in order; keep the app runnable after each.
3. A phase is DONE only when the gates pass and you show the output: `tsc --noEmit`, `build`, `lint`, `test` all green, plus the phase's smoke check (spec §11.2).
4. After each phase, run an adversarial subagent review of the diff against `build-plan.md`; fix correctness gaps. Commit per phase.

If a rule here ever conflicts with the spec, the spec (`@specs/build-plan.md`) wins on detail; this file wins on the HARD RULES above.