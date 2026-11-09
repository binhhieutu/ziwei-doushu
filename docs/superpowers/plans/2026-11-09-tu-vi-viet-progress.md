# Execution ledger — Tử Vi Việt

Design approved on 2026-11-09: “Duyệt, cứ triển khai và tự quyết chi tiết”.

## Delivery and ownership

- Fork: https://github.com/binhhieutu/ziwei-doushu; local branch `codex/viet-hoa-ai`, base `7922285d947b36610e7e31c232d8f1e2a0d0871d`.
- Fresh isolated clone; no pre-existing user code edits. Four disjoint implementation lanes (calendar, AI, UI, public pages); root owns integration, docs, configuration, CI and E2E.
- Tasks 1–4 implemented. Chinese engine keys/defaults retained. New Vietnamese adapter and UI are active; original Heming source retained in `components/legacy/HemingPage.tsx` for two upstream source-extraction regressions. New active routes have behavioral tests.
- Local Node24.22.1 used because system Node23 is outside the supported range. No global runtime or gateway/account configuration changed.
- `.env.local` is ignored; reused the existing 9Router key without displaying it. No birth/conversation persistence or inherited analytics. No push/deployment performed.

## Tests and review

- TDD covered calendar/calendar divergence, validation, origin checks, provider context, streaming/cancel/timeout, budgets, form assumptions, period changes and UI reset.
- Root RED→GREEN fixes: dictionary prototype lookup, blocked localStorage, duplicate Hóa prefix. Review RED→GREEN fixes: original physical clock for solar terms, shared selected-period context, heming follow-up chronology, invalid year drafts, and light-theme contrast.
- Live browser exposed Next internal request-host normalization (`127.0.0.1` public vs `localhost` internal). New actual-Next E2E reproduced 403 before the fix. Explicit configured site origin now defines the accepted browser origin; foreign origins remain rejected and invalid configuration fails closed. Post-fix real-route E2E passes.
- Correctness review: 3 P2 + 1 P3 findings fixed, delta review clean. Calendar review: 1 P2 fixed, delta clean. Security review and two focused security deltas: no unresolved P0–P2 findings.
- Independent calendar reviewer compared 720 normal lunar fixtures to installed iztro (stars/mutagens, stems, palaces/body and decade ranges), all matched. This proves compatibility for those fixtures, not independent astronomical or predictive accuracy.

## Final local gates — 2026-11-09

- `tsc --noEmit`: PASS.
- Original 22 upstream regression scripts: PASS, including 768-chart integrity sample and final large pattern/decade checks.
- Vitest: 13 files, **183 tests PASS**. Coverage: **97.73% statements, 93.37% branches, 93.79% functions, 98.68% lines**.
- Coverage scope: `lib/vietnam`, `lib/ai`, `lib/i18n`, `components/vietnam`, ThemeProvider and API routes; not the whole upstream engine/corpus. All four configured thresholds >=80%.
- Production Next build: PASS; 39 prerendered pages. Build does not contact the AI provider.
- Playwright: **12/12 PASS**, desktop and mobile production app. Includes actual-route origin check (no provider call), Vietnamese Tết2007, 12 palaces, time view payload, explicit AI only, two charts, retry/cancel, unknown-hour requirement, search XSS, no horizontal overflow, and measured text contrast in both themes.
- `npm audit --audit-level=moderate --json`: **0 vulnerabilities** at verification time.
- CI configured with Node24, pinned action commits and the same check commands; remote CI has not run because this branch has not been pushed.
- Live 9Router/browser smoke: PASS (HTTP200, terminal DONE, correct selected year2027, no UI errors, no mobile overflow). Used only fictitious birth data and a short Vietnamese question. Gateway ends with explicit finish_reason:stop and EOF without DONE; normalized this confirmed termination while retaining visible errors for genuine truncation/filtering and late provider faults. Security delta review clean. Screenshots/logs saved outside Git under `I:/codex_work_space/outputs/tu-vi-viet-20261109`.

## Operating limits

Fixed modern UTC+7 and approximate apparent solar correction; no historical-zone reconstruction. Original Chinese corpus remains labelled original text. AI limits are per process; deployment across instances needs shared budget/access controls. Local preview: `http://127.0.0.1:3018`.
