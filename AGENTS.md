# Development rules

## Purpose and boundaries

Provide Codex atlas pets in DSH's Web/Desktop client. `packages/dsh-codex-pet` owns the host/client runtime; the root `build.js` and `lib/client.template.js` own the optional per-pet exporter. Modify each supported consumer affected by a shared behavior change; do not build or install the exporter to validate the runtime.

- Activity and journal state belongs to the selected session. Subscribe to its binding/status; submission echoes are not pending human interactions.
- Keep model summaries opt-in and bounded. Preserve the user's pet files, selected pet, audio overrides, and placement when changing unrelated settings.
- Keep user artwork, conversation excerpts, journals, credentials, and machine-specific configuration out of commits. Preserve asset attribution and the separate code, sound, and character licenses.
- This fork's installation examples must resolve to this checkout. Preserve upstream credit without directing users to install upstream packages.

## Owners and checks

[README](README.en.md) is the human entry; [runtime](docs/runtime.md) owns settings/API and host integration; [exporter](docs/exporter.en.md) owns the optional exporter procedure. [LEGAL](LEGAL.md) owns asset licensing; [history](docs/CHANGELOG.md) is historical.

Use affected Node test files for runtime changes and `node verify-bundle.cjs` for exporter-template changes. Run `node build.js` only with intentionally supplied artwork. Check documentation links and both README languages after documentation changes. Publishing, pushing, and tags require the user's authorization.
