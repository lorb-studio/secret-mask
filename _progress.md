# cloak — Build Chain

spec: knowledge/products/cloak/spec.md

## Tasks

- [x] Scaffold: package.json (@lorb/cloak), tsconfig.json, ESM setup, bin entry
- [x] Phrase dictionary: 200+ phrases in [Adj] [Animal] [Prep] [Object] pattern, bundled JSON
- [x] Secret patterns: regex library for common secrets (API keys, tokens, Bearer, URLs with creds, .env values)
- [x] Phrase mapper: deterministic hash of secret → phrase index, consistent within session (session salt)
- [x] Stream processor: transform stream that replaces matched secrets with phrases in real-time
- [x] Wrapper mode: `cloak -- <command>` spawns child process, intercepts stdout/stderr
- [x] Pipe mode: `<command> | cloak` reads stdin, outputs masked text
- [x] CLI: argument parsing (--pattern for custom patterns), pass-through exit codes
- [x] Tests: unit tests for pattern matching, phrase consistency, stream processing
- [x] Build: tsc compile, verify bin works via npx, bundle size check (< 2MB)
