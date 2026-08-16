# Skill: DSH Plugin Development Boundaries (dsh-plugin-boundary)

> **Distilled on**: 2026-08-17
> **Verified against DSH version**: 0.1.0-rc.6 (the `@deepseek-ai/dsh` CLI and all bundled `@deepseek-ai/dsh-*` packages)
> **Version note**: The boundary conclusions below hold as verified on 0.1.0-rc.6. They may change after a DSH upgrade; re-verify the critical rules against the current version before relying on them (especially `rules/data-channels.md` and `rules/fs-capabilities.md`).

**Purpose**: Before developing a DSH (DeepSeek Harness) plugin, **establish the capability boundaries first**, to avoid iterating on paths the platform does not support. This skill provides empirically verified boundary rules: which channels are officially supported, which are undocumented workarounds, and which are physically impossible.

**When to load**: Before designing any DSH plugin (bundle plugin or dynamic plugin), planning Client↔Host communication, planning UI, reading filesystem content, or judging plugin cross-restart behavior.

**Rule files**:
- `rules/data-channels.md` — Client↔Host data channel landscape: official channels, undocumented workarounds, impossible paths
- `rules/fs-capabilities.md` — Official API filesystem capability boundaries (whether IDE-style file viewing is possible)
- `rules/dynamic-vs-bundle.md` — Lifecycle/persistence/visibility differences between dynamic and bundle plugins
- `rules/plugin-lifecycle.md` — Hard operational rules for plugin install, effect, and debugging

**Usage points**:
1. **Read `rules/data-channels.md` first**: determine whether the communication you need falls into "officially supported / undocumented workaround / impossible", then decide whether to invest.
2. **Distinguish three kinds of facts**: official documentation > source-comment statements > undocumented-but-works. Only the first two are safe as long-term dependencies.
3. **Remember three hard constraints**: ① reading disk file content requires Host code (official API has no file reading); ② official `@Remote` is build-time assembly, third-party bundle plugins cannot add it at runtime; ③ dynamic plugin registry lives in process memory and is lost on restart.
4. **Prefer empirical evidence when debugging**: the Host Service catalog is a **static compiled directory, not a runtime probe**; use a dynamic-plugin probe (`harness.registerTool` encoding results into the tool description) to read the real runtime state.
5. **After modifying a bundle plugin, you must `dsh plugin remove + add` and fully restart** (hardlink inode separation is a recurring pitfall; the PID must change).

**Relationship to the `cordis-plugin-development` skill**: the latter covers "how to write a dynamic Cordis plugin" (mechanism details); this skill covers "which boundaries are set by the platform" (trade-off judgment). Read both before designing — read this skill's rule files first to set direction, then implement per the former.
