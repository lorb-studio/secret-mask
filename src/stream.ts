import { Transform, type TransformCallback } from "node:stream";
import { SecretPatterns } from "./patterns.js";
import { PhraseMapper } from "./mapper.js";

export interface MaskStreamOptions {
  customPatterns?: RegExp[];
  salt?: Buffer;
}

/**
 * Transform stream that replaces detected secrets with playful phrases.
 * Processes text chunks in real-time with low latency.
 *
 * Handles partial matches at chunk boundaries by buffering a trailing
 * portion that could be the start of a secret pattern.
 */
export function createMaskStream(options: MaskStreamOptions = {}): Transform {
  const patterns = new SecretPatterns(options.customPatterns);
  const mapper = new PhraseMapper(options.salt);

  // Buffer to handle secrets split across chunk boundaries.
  // We hold back the tail of each chunk in case it's a partial secret.
  const MAX_BUFFER = 512;
  let pending = "";
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const stream = new Transform({
    encoding: "utf-8",
    decodeStrings: true,

    transform(chunk: Buffer, _encoding: string, callback: TransformCallback) {
      pending += chunk.toString("utf-8");

      // Clear any pending flush timer — new data arrived
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }

      // Process all but the last MAX_BUFFER chars (they might be partial secrets)
      if (pending.length <= MAX_BUFFER) {
        // Set a timer to flush short output (e.g. shell prompts) that would
        // otherwise sit in the buffer indefinitely
        flushTimer = setTimeout(() => {
          flushTimer = null;
          if (pending.length > 0) {
            const masked = patterns.mask(pending, (secret) => mapper.map(secret));
            pending = "";
            stream.push(masked);
          }
        }, 100);
        callback();
        return;
      }

      const safe = pending.length - MAX_BUFFER;
      // Find a newline boundary within the safe zone to avoid splitting mid-line
      let splitAt = pending.lastIndexOf("\n", safe);
      if (splitAt === -1) {
        // No newline found — split at the safe boundary
        splitAt = safe;
      } else {
        // Include the newline in the output
        splitAt += 1;
      }

      const toProcess = pending.slice(0, splitAt);
      pending = pending.slice(splitAt);

      const masked = patterns.mask(toProcess, (secret) => mapper.map(secret));
      callback(null, masked);
    },

    flush(callback: TransformCallback) {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      if (pending.length > 0) {
        const masked = patterns.mask(pending, (secret) => mapper.map(secret));
        callback(null, masked);
      } else {
        callback();
      }
      pending = "";
    },
  });

  return stream;
}
