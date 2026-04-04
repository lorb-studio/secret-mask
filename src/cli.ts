#!/usr/bin/env node

import { parseArgs } from "node:util";
import { wrapCommand } from "./wrapper.js";
import { pipeStdin } from "./pipe.js";
import { startShell } from "./shell.js";

function printHelp(): void {
  process.stdout.write(`secret-mask — Mask secrets in terminal output with playful phrases

Usage:
  secret-mask shell                     Start a masked shell session
  secret-mask -- <command> [args...]    Wrap a command
  <command> | secret-mask               Pipe mode
  secret-mask --help                    Show this help
  secret-mask --version                 Show version

Options:
  --pattern <regex>   Add custom secret pattern (repeatable)
  --help, -h          Show help
  --version, -v       Show version

Shell mode:
  Spawns your $SHELL (or /bin/bash) as an interactive subshell.
  All output is masked in real-time. Type 'exit' or Ctrl-D to leave.
`);
}

function printVersion(): void {
  // Read from package.json at build time isn't worth the complexity.
  // Hardcode and bump with releases.
  process.stdout.write("0.2.0\n");
}

function parseCustomPatterns(values: string[]): RegExp[] {
  const patterns: RegExp[] = [];
  for (const v of values) {
    try {
      patterns.push(new RegExp(v, "g"));
    } catch {
      process.stderr.write(`secret-mask: invalid pattern: ${v}\n`);
      process.exit(1);
    }
  }
  return patterns;
}

async function main(): Promise<void> {
  // Find the "--" separator to split secret-mask args from the wrapped command
  const doubleDashIndex = process.argv.indexOf("--", 2);

  let maskArgs: string[];
  let commandArgs: string[] | undefined;

  if (doubleDashIndex !== -1) {
    maskArgs = process.argv.slice(2, doubleDashIndex);
    commandArgs = process.argv.slice(doubleDashIndex + 1);
  } else {
    maskArgs = process.argv.slice(2);
  }

  // Extract subcommand (e.g. "shell") before option parsing
  const subcommand = maskArgs.length > 0 && !maskArgs[0].startsWith("-")
    ? maskArgs[0]
    : undefined;
  const optionArgs = subcommand ? maskArgs.slice(1) : maskArgs;

  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs({
      args: optionArgs,
      options: {
        pattern: { type: "string", multiple: true },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
      strict: true,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`secret-mask: ${msg}\n`);
    process.exit(1);
  }

  if (parsed.values.help) {
    printHelp();
    process.exit(0);
  }

  if (parsed.values.version) {
    printVersion();
    process.exit(0);
  }

  const customPatterns = parseCustomPatterns(
    (parsed.values.pattern as string[] | undefined) ?? [],
  );

  // Shell mode: secret-mask shell
  if (subcommand === "shell") {
    try {
      const exitCode = await startShell({ customPatterns });
      process.exit(exitCode);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`secret-mask: failed to start shell: ${msg}\n`);
      process.exit(1);
    }
  }

  // Wrapper mode: secret-mask -- <command> [args...]
  if (commandArgs && commandArgs.length > 0) {
    const [command, ...args] = commandArgs;
    try {
      const exitCode = await wrapCommand({
        command,
        args,
        customPatterns,
      });
      process.exit(exitCode);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`secret-mask: failed to run command: ${msg}\n`);
      process.exit(1);
    }
  }

  // Pipe mode: <command> | secret-mask
  if (!process.stdin.isTTY) {
    const exitCode = await pipeStdin({ customPatterns });
    process.exit(exitCode);
  }

  // No command and no pipe — show help
  printHelp();
  process.exit(1);
}

export { main };

const isTestImport = process.env['VITEST'] !== undefined;
if (!isTestImport) {
  main();
}
