# Hard Operational Rules for DSH Plugin Install, Effect, and Debugging

## Install and effect (required reading when modifying a bundle plugin)

1. **After modifying a plugin, you must reinstall it**:
   ```bash
   dsh plugin --profile <name> remove <package-name>
   dsh plugin --profile <name> add file:<path-to-plugin>
   ```
2. **You must fully restart the dsh web process** (not just refresh the page):
   - Verify: the PID from `lsof -i :<port> -P` **must change**;
   - Refreshing the page ≠ restarting — the old process still runs old code in memory; this is the #1 cause of "changes did not take effect".
3. **Hardlink inode separation pitfall**: `dsh plugin add` uses pnpm hardlinks; editing tools write atomically (write a temp file then rename), which **breaks the inode link**, leaving the profile copy on stale content. After editing files, always `remove + add` again.

## Diagnostic toolchain

1. **Probe runtime state with a dynamic plugin** (not the catalog):
   - Check existence with `ctx.get('<service name>')`; encode results into a tool description via `harness.registerTool`;
   - Read the description via `Tool.listTools` to obtain the real runtime state (console output is not visible; tool descriptions are).
2. **The Host Service catalog is a static compiled directory, not a runtime probe** — a service absent from the catalog does not mean it is unavailable at runtime.
3. **HTTP status code localization**:
   - `405` = fell to the SPA fallback (frontend-static returns 405 for non-GET/HEAD) → route/channel not registered;
   - `not found` text = hit the `/api` exclusive route's fallback (api transport returns not found for non-POST or unknown methods);
   - Compare GET/POST behavior and unknown-path behavior for the same request to distinguish "route does not exist" from "route exists but is intercepted".

## Known service-visibility pitfalls (bundle plugin ctx)

- `ctx.get("webServer")` in a bundle plugin ctx **may return undefined** → registration silently skipped (official plugins use the `inject: ["webServer"]` hard dependency, but it blocks non-web environments);
- The dynamic-plugin sandbox **has no `ctx.inject`** (framework internals are withheld);
- The `options` argument of `connection.rpc.handle` is **required** (internally reads `options.authority`; omitting it throws, swallowed by the effect → manifests as 405).

## Reserved prefixes (third-party plugins should not touch)

- `/api` — exclusive to `dsh-client-connection` (`API_PATH = "/api"`; `/api` and `/api/<anything>` all belong to it);
- `/plugins` — exclusive to `dsh-client-modules` (client bundle distribution).
