import { type MaskStreamOptions } from "./stream.js";
export interface PipeOptions extends MaskStreamOptions {
}
/**
 * Reads stdin, masks secrets, writes to stdout.
 * For usage: `<command> | secret-mask`
 */
export declare function pipeStdin(options?: PipeOptions): Promise<number>;
