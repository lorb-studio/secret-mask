import { randomBytes } from "node:crypto";
import { createMaskStream, type MaskStreamOptions } from "./stream.js";

export interface PipeOptions extends MaskStreamOptions {}

/**
 * Reads stdin, masks secrets, writes to stdout.
 * For usage: `<command> | secret-mask`
 */
export function pipeStdin(options: PipeOptions = {}): Promise<number> {
  const salt = options.salt ?? randomBytes(16);

  return new Promise((resolve) => {
    const maskStream = createMaskStream({ ...options, salt });

    process.stdin
      .pipe(maskStream)
      .pipe(process.stdout);

    maskStream.on("end", () => {
      resolve(0);
    });

    process.stdin.on("error", (err) => {
      process.stderr.write(`secret-mask: stdin error: ${err.message}\n`);
      resolve(1);
    });

    maskStream.on("error", (err) => {
      process.stderr.write(`secret-mask: stream error: ${err.message}\n`);
      resolve(1);
    });
  });
}
