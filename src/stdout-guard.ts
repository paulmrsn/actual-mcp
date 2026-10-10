import { Console } from 'node:console';

let originalConsole: typeof globalThis.console | null = null;

/**
 * Route every `console.*` call to stderr.
 *
 * Reason: under the MCP stdio transport, stdout is the exclusive JSON-RPC channel —
 * StdioServerTransport writes framed JSON straight to `process.stdout`. But
 * `@actual-app/core`'s logger (`logger.info`/`logger.log`/`logger.debug`) calls
 * `console.log`/`console.debug`, and a few transitive deps call `console.log`
 * ungated by its `verboseMode` flag. Those plain-text lines interleave with the
 * protocol stream, so the client fails to parse them:
 *
 *   Unexpected token 'B', "[Breadcrumb"... is not valid JSON
 *   Unexpected token 'L', "Loaded spr"... is not valid JSON
 *
 * Swapping the global Console for one bound to stderr keeps those messages visible
 * for debugging while leaving stdout clean. It cannot corrupt the protocol because
 * the transport bypasses `console` entirely and writes to `process.stdout` directly.
 *
 * Idempotent — calling it more than once is a no-op.
 */
export function redirectConsoleToStderr(): void {
  if (originalConsole) return;
  originalConsole = globalThis.console;
  globalThis.console = new Console({ stdout: process.stderr, stderr: process.stderr });
}

/**
 * Restore the console captured by {@link redirectConsoleToStderr}.
 *
 * Primarily for tests; a no-op if the redirect was never applied.
 */
export function restoreConsole(): void {
  if (!originalConsole) return;
  globalThis.console = originalConsole;
  originalConsole = null;
}
