import { type MaskStreamOptions } from "./stream.js";
export interface WrapperOptions extends MaskStreamOptions {
    command: string;
    args: string[];
}
/**
 * Spawns a child process and masks secrets in its stdout/stderr output.
 * Returns the child's exit code.
 */
export declare function wrapCommand(options: WrapperOptions): Promise<number>;
