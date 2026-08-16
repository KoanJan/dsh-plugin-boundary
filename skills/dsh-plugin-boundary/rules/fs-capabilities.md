# Official DSH API Filesystem Capability Boundaries

> Bottom line: **the official client API does not support IDE-style file browsing (files are invisible and content unreadable).** "Reading file content" is the responsibility of the agent tool layer (`read`/`write`/`edit`), not a design goal of the client API.

## All filesystem methods in the official HostApi

| Method | Capability | Limitation |
|---|---|---|
| `host.describe` | Snapshot: version/cwd/model, etc. | No file operations |
| `host.pickDirectory` | Native directory picker | Returns a single path; native capability |
| `host.listDirectory` | **List directory** | **Lists child directories only; files are skipped** |
| `host.createDirectory` | Create directory | Directories only |
| `host.openPath` | Open with the OS default app | Hands off to external program (Finder/Explorer/xdg-open) |

## Decisive facts

1. **`host.listDirectory` does not return files**:
   - `DirectoryListing.entries` type comment explicitly says **"Direct child directories"**;
   - browse implementation: `if (!dirent.isDirectory() && !dirent.isSymbolicLink()) continue;` — all non-directory entries are skipped;
2. **`DirectoryEntry` has only `name/path/hidden`** — no file size/type/content;
3. **The whole HostApi has no `readFile`/`readText`/`getContent`-style methods**.

## Implications

- Pure client can at most do "directory-tree browsing" (folders only); files are invisible and content unreadable;
- Reading file content (e.g., task-artifact JSON) **requires Host code** (bundle plugin custom channel, see `data-channels.md`);
- Or go through the agent: the model reads files with the `read` tool → content enters the conversation stream (but rendering it into UI depends on agent refresh, which costs tokens).

## Client-side services

- `ctx.workspaces.listDirectory(path)` → lists a directory (goes through the host `browse` capability, same rule: child directories only);
- No other client file-reading service (client Service catalog: layout/locale/sessions/slots/theme/timer/workspaces).
