# Dynamic Plugins vs Bundle Plugins: Lifecycle and Visibility

## Dynamic Cordis plugins (cordis_define / cordis_run)

**Lifecycle: process memory, lost on restart (not persisted with the session)**
- `DynamicCordisRegistry` is explicitly labeled **"Process-local"** (`dsh-cordis-host-runner/lib/index.js`): `plugins` is an in-memory `Map`, with no serialization and no recovery hooks;
- Dynamic-plugin activity appearing in the session log is only a **tool-call record**, not plugin-definition persistence;
- After restart the registry is empty, `cordis_inspect_self` shows no plugins, and you **must `cordis_define` again**;
- "Plugin survives restart, enable it manually later" does **not hold under the current mechanism** — there is nothing to enable; definitions must be replayed.

**Visibility: agent (session) ownership**
- A plugin records the agent that created it, enforced by `owned(agent, pluginId)`;
- A plugin defined by session A is invisible and unmanageable from session B; but within the same process it exists in the registry (just without permission).

**Capability differences (vs bundle plugins)**
- Has documented Client↔Host RPC: `harness.handle` (Host) + `host.call` (Client), Package-private, bound by pluginId+packageId;
- Has an exclusive UI region: `tool.view.cordis` (key: 'self') — inside `cordis_run` cards only;
- **The ctx is a restricted sandbox**: no `ctx.inject` (framework internals are withheld), no `ctx.webServer`, etc. — only `ctx.get` on declared services, `ctx.on`, and `ctx.provide`;
- Probing trick: `harness.registerTool` encodes results into the tool description → read via `Tool.listTools` (use this when console output is not visible).

## Bundle plugins (cordis.patch.yml + `dsh.client` declaration)

**Lifecycle: mounted with the profile, survives restarts and sessions**
- Installed into `~/.dsh/profiles/<name>/node_modules` via `dsh plugin add`, listed in `dsh.profile.bundles`;
- Auto-activates on restart, independent of any session.

**Client UI distribution (official pipeline, verified working)**
- `package.json` declares `dsh.client` (platform: web) + `exports["./client"]` → `clientModules` scans loader entries → injects into `window.__DSH_BOOT__` → served at `/plugins/<id>/client.js`;
- **`exports` must also declare `"./package.json"`** — `clientModules` reads package declarations via `require.resolve('pkg/package.json')`; omitting it makes the scan throw and the entry never reach the boot graph (the direct cause of a missing sidebar entry).

**Client↔Host communication: no official channel**
- No `harness.handle`/`host.call` (those are dynamic-plugin exclusive);
- `@Remote` is build-time assembly, third-party cannot add it (see `data-channels.md`);
- Usable workarounds: bare `webServer` routes, custom `connection.rpc` channels (both have pitfalls, see `data-channels.md`).

## Quick comparison

| Dimension | Dynamic plugin | Bundle plugin |
|---|---|---|
| Survives restart | ❌ process memory, lost | ✅ auto-mounted with profile |
| Visible across sessions | ❌ agent-ownership isolation | ✅ global |
| Official Client↔Host RPC | ✅ harness.handle/host.call | ❌ none |
| Exclusive UI region | ✅ tool.view.cordis | ❌ (use generic slots) |
| Client distribution | session-local | ✅ `dsh.client` pipeline (official) |
| ctx completeness | restricted sandbox | relatively complete (but some service-visibility pitfalls) |
