# @koanjan/dsh-plugin-boundary

DSH (DeepSeek Harness) plugin development boundary skill plugin.

Packages the platform's capability boundary rules into a single loadable skill, for trade-off decisions before developing a plugin: which channels are officially supported, which are undocumented workarounds, and which are physically impossible.

## Features

Registers 1 skill via `ctx.skills.registerProvider`:

| Skill | Content |
|---|---|
| `dsh-plugin-boundary` | Client↔Host data channel landscape, official API filesystem limits, dynamic vs bundle plugin lifecycle, install/effect/debug hard rules |

A skill = `SKILL.md` (purpose / when to load / usage points) + `rules/*.md` (boundary rule bodies).

> Version note: the boundary conclusions are verified against DSH 0.1.0-rc.6; re-verify critical rules against the current version after a DSH upgrade.

## Install

Requires [pnpm](https://pnpm.io/) (the official dependency of `dsh plugin`).

### From a local directory

```bash
dsh plugin --profile web add file:/path/to/dsh-plugin-boundary
```

### From the npm registry (after publishing)

```bash
dsh plugin --profile web add @koanjan/dsh-plugin-boundary
```

After install, **restart DSH**; the `dsh-plugin-boundary` skill should appear in the skill catalog of new sessions.

## Development

```
dsh-plugin-boundary/
├── package.json        # Package manifest; dsh.bundle.patch declares this package as a profile bundle layer
├── cordis.patch.yml    # Patch layer: inserts the plugin row into the profile composition
├── lib/index.js        # Plugin body: skills.registerProvider provides the skill
└── skills/             # Skill resources (plain markdown, shipped with the package)
    └── dsh-plugin-boundary/
        ├── SKILL.md
        └── rules/
```

- Modifying skill content: edit `skills/dsh-plugin-boundary/SKILL.md` and `rules/*.md` directly, then reinstall (`remove` + `add`) and restart DSH.
- Modifying provider logic: edit `lib/index.js`, then reinstall the same way.

## License

MIT
