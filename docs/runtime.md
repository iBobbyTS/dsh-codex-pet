# Runtime plugin

[Install and quick start](../README.en.md). Paths below are relative to the repository root.

## Features

- Renders Codex spritesheet atlases (8 columns × 192×208 cells):
  - **v1** (1536×1872, 9 rows) — auto-detected;
  - **v2** (1536×2288, 11 rows) — adds 16 mouse-tracking "look" cells.
- Draggable (position persists across restarts), wave-on-hover,
  jump-on-double-click.
- **Mouse tracking (v2 only, default on)**: the «桌宠» settings section
  has an **Eye tracking** toggle; the UI notes it applies to v2 atlases only
  (v1 has no look cells, so the toggle is inert for v1 pets).
- Live activity poses: idle / waiting / running / review, driven by the
  conversation state.
- Progress bubble showing the running tool name or the live model text tail.
- One **显示模型工作 / Model work** switch controls the thinking placeholder, streamed assistant output and running tool/command bubble together (default on). Legacy settings migrate to off only when both former switches were off.
- Optional right-click to hide the pet and all its bubbles for 10 seconds (default off). The former context menu is removed entirely; disabled means no right-click action.
- Visible viewport intersection clamping on drag, initial placement and resize; repaired saved positions persist automatically.
- Optional fixed-interval first-person LLM summaries, with a per-session journal
  shown when hovering the pet only while periodic summaries are enabled (including
  the empty-journal placeholder). Disabling summaries also closes any open journal.
  Automatic summaries observe only requests completed
  after selecting a session; they do not backfill historical conversations.
  Enabling it sends bounded excerpts of user, assistant, tool, and error
  content to the selected LLM and incurs that provider's usage/cost. Select a
  provider and model before enabling summaries. Cadence and bubble duration
  are configurable.
- Configurable completion, error and interruption voices, including per-track
  volume, bundled rotating takes and user-uploaded audio overrides.
- Zero per-pet code: the browser half is registry-driven from `/api/codex-pet/*`.

## DSH compatibility

DSH gates every profile plugin row on its `@deepseek-ai/dsh*` **peerDependencies**:
a peer range the running DSH version does not satisfy disables the **whole row**
(no pet, no settings section) with
`Plugin … is incompatible with dsh …: peerDependencies …`.

This plugin therefore declares only peers that exist across the DSH 0.2 line and
later, with open-ended ranges:

```json
"@deepseek-ai/dsh-client-ui-slots": ">=0.1.0-rc.6",
"@deepseek-ai/dsh-host-webserver": ">=0.1.0-rc.6"
```

These peer ranges admit later host versions; they are installation metadata, not a claim that every admitted host was tested. This fork has source-contract and automated checks for DSH **0.2.2-rc.1**. Legacy 0.1.x fallback code remains, without a new validation claim for that line. The obsolete
`@deepseek-ai/dsh-client-runtime` peer is *not* declared: DSH 0.2.0-rc.1 removed
that package, so declaring it (`^0.1.0-rc.6`, as 0.3.1 did) makes DSH disable the
row — which is exactly why the pet vanished on 0.2.0-rc.1.

The same upgrade also **retired the client runtime at runtime**, not just in the
manifest. On 0.1.x the pet overlay read the conversation from
`sessions.currentProvideInfo`; that bridge is gone in the 0.2 line, which would
leave the snapshot `null` and the bubble permanently blank (0.3.2 had this bug —
the pet appeared but never spoke). The overlay now reads the internal
`uiSession` service's main binding instead:

- `hooks.chat` → the live tail (`partial`, `runningCalls`) plus `turnEnds`;
  this is the target `dsh-client-ui-chat` registers, i.e. the streaming reply
  text and the "running: \<tool\>" bubble text;
- `hooks.trajectory` → the same fields plus `requests`, kept as a fallback when
  the chat hook is absent (its own `partial` only fills in once its target has
  accumulated chunks);
- `hooks.session` → `running`, `openState`;
- `uiSession.sessionStatus` for the selected binding key → `pendingInteraction` (approval, question, or plan review). `pendingSubmissions` are submission echoes, not requests for human input;
- `nodes` / `turnEnds` are rebuilt from the trajectory event nodes, keeping the
  done chime and the periodic summaries working. `ui-trajectory` pushes the
  **finalized node itself** into `eventNodes` (`{ kind: "user" | "assistant" |
  "tool-result", seq, turn, step, blocks, … }`), so that is the shape read here;
  the older `{ data: { kind, node } }` contribution wrapper is still accepted as
  a fallback. Reading only the wrapper is what made every summary claim the pet
  had done nothing (0.4.1 and earlier): the node array came out empty, so the
  summarizer received no instruction, no reply text and no tool calls.

`uiSession` is deliberately **not** listed in `inject`: it is an internal service
that older hosts never provide, and Cordis parks the entire plugin when a hard
dependency is missing. It is resolved lazily with `ctx.get("uiSession")` (plus a
short polling subscribe, because the service can arrive after the plugin loads),
and when it never shows up the overlay falls back to the legacy
`currentProvideInfo` path — so one build serves both hosts.

## Add a pet

A pet is a folder holding a `pet.json` manifest plus one atlas image. Drop it
into any source (later sources override earlier ones on id collision):

- built-in: `packages/dsh-codex-pet/assets/<pet>/`
- Codex pets: `~/.codex/pets/<pet>/` — read **in place**, nothing is copied;
  point `CODEX_HOME` elsewhere to use a different Codex home
- user: `~/.dsh/pets/<pet>/` (survives plugin updates)

Resolution order is **built-in → Codex → user**, so a pet you import
overrides the same id coming from Codex, which overrides the bundled example.
The settings surface groups the gallery by these three sources and puts a
`v1` / `v2` badge on every card.

`pet.json`:

```json
{
  "id": "nastya",
  "displayName": "娜斯佳",
  "description": "娜斯佳 Nastya — original character (CC BY-NC 4.0).",
  "spritesheetPath": "spritesheet.webp",
  "spriteVersionNumber": 2,
  "size": 120,
  "pin": "bottom-right"
}
```

Only `id` and `spritesheetPath` are required. `spriteVersionNumber` is
auto-detected from the image dimensions when omitted (1536×1872 = v1, nine
rows; 1536×2288 = v2, eleven rows); `size` (px width) and `pin` (`top-left` /
`bottom-right` / …) default to `120` and `bottom-right`.

### Reading local Codex pets

`GET /api/codex-pet/state` reports `codexPets: { enabled }` and
`codexPetsDir`, and `POST /api/codex-pet/set-config` accepts
`{ "codexPets": { "enabled": false } }` to stop reading them (the default is
`true`). Toggling the source rebuilds the registry immediately and re-seats a
selection that no longer exists, so the pet never points at a vanished atlas.
`resetAll()` puts the switch back to its default.

The browser half renders the picker as a gallery: each card shows the atlas's
first cell as a thumbnail, mounted only while the card is near the viewport
(`IntersectionObserver`, `rootMargin: 300px`) and unmounted once it scrolls
away — a decoded atlas is roughly 14 MB, so keeping a dozen of them alive would
stall the settings page.

**No manual editing needed**: in the DSH settings surface open the «桌宠»
section and click **导入桌宠 (webp / png / gif)** — the plugin writes the file
into `~/.dsh/pets/<name>/`, auto-detects the atlas version, and selects the new
pet. The pet id comes from the filename (`my-pet.webp` → `my-pet`); if that id
is already taken the plugin appends a `-2` / `-3` suffix instead of
overwriting the earlier pet (all Codex atlases are named `spritesheet.webp`,
so without this every import would clobber the previous one). Re-importing the
same id with the same typed display name updates that pet in place.

## Architecture

```
src/                  # TS edit sources; lib/ contains generated runtime JS/maps
├── index.js     host half: name/inject/apply, mounts service + routes
├── registry.js  scans assets/* + ~/.dsh/pets/*, normalizes Codex atlases
├── service.js   persisted selection + display config (~/.dsh/codex-pet.json)
├── routes.js    /api/codex-pet/* JSON API + /codex-pet/<id>/* assets
└── client.js    browser half: registry-driven overlay renderer
```

- **Host half** registers same-origin routes via the DSH web server
  (`ctx.webServer.register`), serving the pet list, state and atlas assets.
- **Browser half** fetches `/api/codex-pet/state`, renders the selected pet,
  mirrors drags back via `POST /api/codex-pet/set-config`, and seats a
  `settings.section` entry («桌宠») that edits the pet through the same API.
  It also carries the two recovery buttons (position / everything) under
  «还原 Reset», and re-seats the pet in place whenever the host bumps
  `display.layoutRev` — a dragged `left`/`top` outranks the pin, so clearing it
  changes none of the fields the pet is recreated for.
  Bubbles and the journal are absolutely positioned with no default
  coordinates, so the rule is **place first, show second**: a reveal
  reads the pet's live rect, falls back to the placement the controller recorded
  (`controller.box`, also used to seat the pet itself when a pin is empty or
  unknown), and otherwise keeps the element hidden while retrying every 100 ms
  for up to 1.2 s. An unplaced overlay would render at the host origin, i.e. the
  top-left corner of the screen.

### API

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/codex-pet/pets` | GET | pet registry (list of definitions) |
| `/api/codex-pet/state` | GET | selected pet, display config, `codexPets` switch + `codexPetsDir`, pet list with `source` / `spriteVersionNumber` |
| `/api/codex-pet/set-pet` | POST | `{ petId }` — switch pet |
| `/api/codex-pet/set-config` | POST | update display, `summary`, `sound`, or `{ codexPets: { enabled } }` |
| `/api/codex-pet/set-visible` | POST | `{ visible }` |
| `/api/codex-pet/reset-position` | POST | drop a dragged `left`/`top` so the pet is re-seated by its pin |
| `/api/codex-pet/reset-all` | POST | restore every setting to its default; pet choice and imported files stay |
| `/api/codex-pet/import?id=<filename>&name=<displayName>` | POST | raw image body — import a Codex atlas |
| `/api/codex-pet/models` | GET | available LLM providers and models for summaries |
| `/api/codex-pet/summarize` | POST | summarize one completed assistant-request batch |
| `/api/codex-pet/journal?session=<id>&limit=<n>` | GET | recent persisted summaries (`&all=1` returns all records for manual coverage checks) |
| `/api/codex-pet/sound?track=<id>` | POST | upload a raw audio override (8 MiB maximum) |
| `/api/codex-pet/reset-sound?track=<id>` | POST | remove an audio override |
| `/codex-pet-sound?track=<id>` | GET | stream the effective `done`, `error`, or `interrupt` track |
| `/codex-pet/<id>/<file>` | GET | pet.json + spritesheet assets |

Summary journals are stored under `~/.dsh/codex-pet-journal/`. Uploaded voice
overrides are stored under `~/.dsh/pets/sounds/` and survive plugin updates.


## Validation

Run `pnpm test` from the repository root. DSH 0.2.2-rc.1 was checked against source contracts and automated tests; these checks do not establish a real Desktop end-to-end result.

See [LEGAL](../LEGAL.md) for assets and [AGENTS](../AGENTS.md) for development boundaries.

## Development and delivery

Use Node 24.11.0, `pnpm@10.28.2`, and `pnpm install --frozen-lockfile` at the repository root. The pnpm workspace has one lockfile. `pnpm typecheck` separates Host and browser environments. `pnpm build:runtime` builds the nested runtime and generic exporter template without reading artwork/config.json or touching exported `lib/client.js`. `pnpm test` builds a temporary candidate and runs runtime, template and synthetic v1/v2 export checks. `pnpm check:dist` compares generated file sets and contents, packs the nested runtime, and tests clean installation/Host loading. `pnpm check` combines those checks.

Install `packages/dsh-codex-pet` or its packed `.tgz`; the root development package is not the runtime installation target. Both installation forms consume prebuilt files. `build.js` remains an explicit artwork/configuration exporter; its per-pet output removes the template's source-map URL. Installer scripts copy prebuilt runtime files and only runtime manifest fields into exported pets. After `pnpm check`, `pnpm test:installers /path/to/pwsh` exercises both PowerShell installers twice in a temporary DSH_HOME (also run by CI). macOS PowerShell 7.5.2 file-copy/patch checks passed; Windows and real Desktop interaction remain platform checks.
