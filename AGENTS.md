# Development rules

## Purpose and boundaries

Provide Codex atlas pets in DSH's Web/Desktop client. `packages/dsh-codex-pet` owns the host/client runtime; root `src/client.template.ts` owns the optional exporter template, and `build.js` explicitly injects artwork into its generated JS. Modify each supported consumer affected by a shared behavior change; do not build or install the exporter to validate the runtime.

- Activity and journal state belongs to the selected session. Subscribe to its binding/status; submission echoes are not pending human interactions.
- Keep model summaries opt-in and bounded. Preserve the user's pet files, selected pet, audio overrides, and placement when changing unrelated settings.
- Keep user artwork, conversation excerpts, journals, credentials, and machine-specific configuration out of commits. Preserve asset attribution and the separate code, sound, and character licenses.
- This fork's installation examples must resolve to this checkout. Preserve upstream credit without directing users to install upstream packages.

## Owners and checks

[README](README.en.md) is the human entry; [runtime](docs/runtime.md) owns settings/API and host integration; [exporter](docs/exporter.en.md) owns the optional exporter procedure. [LEGAL](LEGAL.md) owns asset licensing; [history](docs/CHANGELOG.md) is historical.

Use `pnpm test` for isolated candidate checks, including the runtime suites, generated template and synthetic exporter. Run `node build.js` only with intentionally supplied artwork. Check documentation links and both README languages after documentation changes. Publishing, pushing, and tags require the user's authorization.

Development/build/distribution follow [the parent standard](../docs/plugin-development.md). Edit TypeScript in root `src/` or the nested runtime `src/`; deliver generated generic `lib/` files with their source. User-specific exports remain ignored.
