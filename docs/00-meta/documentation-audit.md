# Documentation audit — 17 October 2026

The repository contains **90 Markdown files** at the starting commit, including historical reports, legacy design proposals and BASIC source notes. This audit does not delete them.

| File group | Handling | Why |
| --- | --- | --- |
| Root README, TODO, CHANGELOG | Rewritten, originals archived verbatim | Authoritative current entry, execution queue and change record |
| `docs/00-meta/roadmap.md`, `status.md` | Rewritten, original roadmap archived | Separate future vision and verified operation |
| `docs/INDEX.md` | Rewritten | Current links instead of promised directories |
| `docs/README.md` | Legacy structure warning | Its folder/file listings include uncreated placeholders |
| `docs/reports/`, `docs/outdated/`, root `FEATURE_SUMMARY.md`, `IMPLEMENTATION_*.md` | Historical reference only | Old release claims and alternative UI flows are not active-game evidence |
| `docs/sourcecode Kaiser 2/` | Preserve without code edits | Historical BASIC sources and design history |
| `docs/04-domains/`, `docs/02-simulation-model/`, `docs/LIFE_SIMULATION*.md` | Domain or design reference, not an up-to-date release report | Many modules are not fully exposed in the current campaign |
| `CONTRIBUTING.md`, pull-request template | Correct CI instructions and document release gate | Watch-mode tests and deployment assumptions were stale |
| `SECURITY.md`, LICENSE | Keep policy and license | No evidence they should be rewritten wholesale |
| Deployment and operations guides | Add confirmed Pages-blocker and actual build commands | HTTPS release does not exist yet |

## Evidence and release standard

- Test results are tied to a specific Git commit, not the repository name.
- A TypeScript class alone does not prove a feature is accessible from the main-game UI.
- A GitHub merge is not deployment; Pages fails with an integration permission error.
- Old documentation is not silently removed or marked completed. Pending integration belongs to [TODO](../../TODO.md), broader ideas in the [preserved README backlog](../00-meta/backlog-from-readme.md).
- Documentation changes are reviewed with `npm run check`, `npx vitest run`, `npm run build`, `node scripts/verify-release-assets.mjs` and Chromium smoke.

## Future audit work

Review and refresh legacy domain/API/user guides individually alongside code changes. Perform a markdown-link checker across existing paths; separate archival links from active docs. Do not retroactively revise historical records to claim current completion.

## Dokumentationslink-Gate
Die zentralen, aktuellen Markdown-Dateien werden über `node scripts/verify-doc-links.mjs` gegen vorhandene Repository-Pfade geprüft. Historische Berichte mit älteren oder ausdrücklich geplanten Dateipfaden bleiben unberührt.
