import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createMaskStream, type MaskStreamOptions } from "./stream.js";

export interface ShellOptions extends MaskStreamOptions {}

/**
 * Spawns an interactive shell with all output masked.
 * The user's $SHELL is used (falls back to /bin/bash).
 * stdin is passed through; stdout/stderr are masked.
 * Returns the shell's exit code.
 */
export function startShell(options: ShellOptions = {}): Promise<number> {
  const salt = options.salt ?? randomBytes(16);
  const userShell = process.env["SHELL"] || "/bin/bash";

  return new Promise((resolve, reject) => {
    const child = spawn(userShell, ["-i"], {
      stdio: ["inherit", "pipe", "pipe"],
      env: process.env,
    });

    const stdoutMask = createMaskStream({ ...options, salt });
    const stderrMask = createMaskStream({ ...options, salt });

    child.stdout.pipe(stdoutMask).pipe(process.stdout);
    child.stderr.pipe(stderrMask).pipe(process.stderr);

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}
