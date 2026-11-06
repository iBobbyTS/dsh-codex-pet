# @signalight/dsh-codex-pet

Runtime package of the [iBobbyTS/dsh-codex-pet fork](https://github.com/iBobbyTS/dsh-codex-pet), derived from Signalight/codex-to-dsh-pet. It renders Codex v1/v2 spritesheet pets with activity bubbles, optional summaries, and scenario sounds.

From the fork checkout root, install this directory:

```sh
dsh plugin --profile web add "$PWD/packages/dsh-codex-pet"
```

Desktop users select this package directory in the application's plugin manager. No exporter or artwork build is required. Restart the Host, refresh the UI, then open Settings → 桌宠.

See the fork's [installation and usage guide](https://github.com/iBobbyTS/dsh-codex-pet/blob/main/README.en.md), [runtime reference](https://github.com/iBobbyTS/dsh-codex-pet/blob/main/docs/runtime.md), and [asset licenses](https://github.com/iBobbyTS/dsh-codex-pet/blob/main/LEGAL.md). The package name is retained for runtime resolution; an upstream npm install does not install this fork's changes.
