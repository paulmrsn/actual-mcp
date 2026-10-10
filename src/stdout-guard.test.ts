import { describe, it, expect, afterEach, vi } from 'vitest';
import { redirectConsoleToStderr, restoreConsole } from './stdout-guard.js';

describe('stdout-guard', () => {
  afterEach(() => {
    restoreConsole();
    vi.restoreAllMocks();
  });

  it('sends console.log to stderr instead of stdout', () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    redirectConsoleToStderr();
    console.log('[Breadcrumb] loading budget');

    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).toHaveBeenCalledTimes(1);
    expect(stderr.mock.calls[0][0]).toContain('[Breadcrumb] loading budget');
  });

  it('also covers the other stdout-bound console methods', () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    redirectConsoleToStderr();
    console.info('Loaded spreadsheet');
    console.debug('Syncing since');
    console.dir({ got: 'messages' });

    expect(stdout).not.toHaveBeenCalled();
  });

  it('is idempotent and restores the original console', () => {
    const before = globalThis.console;

    redirectConsoleToStderr();
    const afterFirst = globalThis.console;
    redirectConsoleToStderr();

    expect(globalThis.console).toBe(afterFirst);
    expect(afterFirst).not.toBe(before);

    restoreConsole();
    expect(globalThis.console).toBe(before);

    // Reason: restoring twice must not clobber the console with a stale reference.
    restoreConsole();
    expect(globalThis.console).toBe(before);
  });
});
