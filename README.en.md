# dsh-codex-pet

[中文](README.md) · English

Codex spritesheet pets for DSH Web UI and Desktop, with dragging, activity poses, progress bubbles, pet import, and local Codex pet discovery. Periodic model summaries and completion/error/interruption sounds are optional.

This repository forks [Signalight/codex-to-dsh-pet](https://github.com/Signalight/codex-to-dsh-pet). The instructions below install this fork. The runtime lives in `packages/dsh-codex-pet`; the root also contains an optional per-pet exporter.

## Compatibility

Verified: DSH 0.2.2-rc.1 (source review and automated checks); Desktop testing has not been completed.

## Install

Install DSH, Node.js, and pnpm for DSH plugin installation. Clone this fork:

```sh
git clone https://github.com/iBobbyTS/dsh-codex-pet.git
cd dsh-codex-pet
dsh plugin --profile web add "$PWD/packages/dsh-codex-pet"
```

The runtime uses source files and bundled artwork directly; do not run the root `build.js` for it. In Desktop, select `packages/dsh-codex-pet` in the application's plugin manager; the application owns the `desktop` profile. In Windows cmd, use the full directory path instead of `$PWD`.

Restart the DSH Host and refresh the page, then select or import a pet in Settings → 桌宠. To update, update this checkout and add the same directory to the same profile again. Avoid mixing it with the upstream version or an exported per-pet plugin.

## Use

- **Model work** controls the thinking placeholder, streamed text, and running-tool bubble together.
- Codex pets are read from `~/.codex/pets` by default; override with `CODEX_HOME` or disable the source in settings.
- Periodic summaries are off by default. Enabling them sends bounded conversation excerpts to the selected model and incurs model usage.
- Reset position repairs placement; reset all settings preserves the selected pet, imported files, and custom audio.

## Documentation

- [Runtime settings, compatibility, and API](docs/runtime.md)
- [Optional per-pet exporter](docs/exporter.en.md)
- [Development rules](AGENTS.md) · [History](docs/CHANGELOG.md)
- [Asset copyright and licensing](LEGAL.md) · [MIT code license](LICENSE)

The bundled example character atlas uses CC BY-NC 4.0; sound assets and code use MIT. Obtain the necessary rights for imported assets. See LEGAL.
