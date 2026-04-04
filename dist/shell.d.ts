import { type MaskStreamOptions } from "./stream.js";
export interface ShellOptions extends MaskStreamOptions {
}
/**
 * Spawns an interactive shell with all output masked.
 * The user's $SHELL is used (falls back to /bin/bash).
 * stdin is passed through; stdout/stderr are masked.
 * Returns the shell's exit code.
 */
export declare function startShell(options?: ShellOptions): Promise<number>;
