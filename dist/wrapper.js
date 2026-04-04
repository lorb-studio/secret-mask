import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createMaskStream } from "./stream.js";
/**
 * Spawns a child process and masks secrets in its stdout/stderr output.
 * Returns the child's exit code.
 */
export function wrapCommand(options) {
    const { command, args, ...streamOptions } = options;
    // Share a single salt so the same secret maps to the same phrase on both streams
    const salt = streamOptions.salt ?? randomBytes(16);
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: ["inherit", "pipe", "pipe"],
            shell: process.platform === "win32",
        });
        const stdoutMask = createMaskStream({ ...streamOptions, salt });
        const stderrMask = createMaskStream({ ...streamOptions, salt });
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
