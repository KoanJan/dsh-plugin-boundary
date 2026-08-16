# DSH Client↔Host Data Channel Landscape

> Bottom line: **DSH has no officially supported Client↔Host data channel for third-party bundle plugins.** Official channels are only open to build-time assembled capabilities; what third-party plugins can use are undocumented workarounds, not safe as long-term dependencies.

## 1. Official Channel: `@Remote` services (the only documented Client↔Host data channel)

**Mechanism** (official doc `docs/api-gateway.zh.md`):
- Business packages declare methods with `@Remote` / `@RemoteScope` → the build-time `dsh-typert-generator` generates `/remote` artifacts (`typert.remote-client.js`, etc.) → the Client composition explicitly assembles `@deepseek-ai/dsh-api-remotes` → calls go through `ctx.remote.<namespace>`;
- Underneath, calls use `connection.rpc.call('/api', '<namespace>/<method>', { args })`; the channel is **fixed as `/api`** — there is no "plugin-custom channel" concept.

**Availability to third-party bundle plugins: ❌ not available**
- "The Client does not discover decorators from a running Host, and Client Remote refuses to mount SRC descriptors lacking a strict codec";
- The capability set is explicitly selected at build time by the Client composition owner (`api-remotes` explicit assembly); bundle plugins cannot add to it at runtime.

## 2. Undocumented Workarounds (work, but not official contracts)

### 2.1 Custom `connection.rpc` channel
- Host: `ctx.get("connection").rpc.handle('/my-channel', handler, { authority: "loopback" | "trusted-host" })`;
- Client: `ctx.get("connection").rpc.call('/my-channel', endpoint, payload)` (automatic rpcId correlation/response validation).
- **Pitfall**: the third `options` argument of `handle` is **not optional** — `register()` reads `options.authority` directly; omitting it throws `Cannot read properties of undefined (reading 'authority')`, which the effect swallows silently → the channel is never registered (client sees HTTP 405 falling to the SPA fallback).
- **Risk**: dynamic plugins can register successfully at runtime; **bundle plugin rows may still get 405** (ctx differences). This capability is on no official documentation path and may break on DSH upgrades.

### 2.2 Bare `webServer` routes
- `ctx.get("webServer").register({ kind: "prefix", path: "/my-path", handler })`.
- **Official precedent exists**: `/api` (dsh-client-connection) and `/plugins` (dsh-client-modules) are registered this way — but those are official reserved prefixes, used by the DSH team itself.
- **Collision semantics**: registering an identical (kind, path) **throws explicitly** ("composition-level contract, a collision is a misconfiguration"); containment relationships rely on **longest-prefix-wins** (the longer prefix route wins), no collision.
- **Pitfall**: in a bundle plugin ctx, `ctx.get("webServer")` may return undefined → registration silently skipped. Official plugins use the `inject: ["webServer"]` hard dependency (but a hard dependency blocks the whole plugin in non-web environments).

## 3. Physically Impossible (pure client)

- **Reading file content**: official API has no `readFile`/`readText` (see `fs-capabilities.md`).
- **Collision-free channel**: DSH offers third-party plugins no "namespace-isolated" communication mechanism — `@Remote` is namespace-isolated by service name but third-party plugins cannot mount it; everything else lives in the global URL/global channel namespace.

## 4. Decision Guidance

| Need | Suggestion |
|---|---|
| Plugin needs to read data from Host (files, disk artifacts) | Read-only operations → the agent tool layer (`read`, etc.) is the official responsibility; real-time UI reading data → no official channel today, consider dropping the UI or filing an issue with DSH |
| Plugin needs to expose operations to the model | `tools.register` (bundle) or `harness.registerTool` (dynamic) — **officially supported**, use these first |
| Plugin needs skills | `skills.registerProvider` (bundle) — **officially supported** |
| Client↔Host bidirectional RPC | Dynamic plugin `harness.handle`/`host.call` is the documented Package-private RPC, but dynamic plugins only and not across restarts; bundle plugins have no official equivalent |
