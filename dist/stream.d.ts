import { Transform } from "node:stream";
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
export declare function createMaskStream(options?: MaskStreamOptions): Transform;
