<p align="center">
  <a href="https://lorb.studio">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset=".github/logo-light.svg">
      <img alt="Lorb.studio" src=".github/logo-dark.svg" height="40">
    </picture>
  </a>
</p>

# @lorb/secret-mask

Your terminal leaks secrets. This makes them disappear — playfully.

```
$ secret-mask -- npm run dev
Server running on http://localhost:3000
API key loaded: Sleepy Owl in Teacup
Connected to DB: postgresql://Dancing Cat on Banana@db.example.com
```

**Not `***`.** Each secret becomes a memorable phrase like "Brave Fox under Lighthouse." Readable, unsuspicious, and weirdly fun.

**20+ patterns.** Detects API keys (OpenAI, AWS, GitHub, Stripe, Slack, Google, and more), Bearer tokens, URLs with embedded credentials, private keys, and `PASSWORD=...` style env vars.

**Deterministic.** Same secret always maps to the same phrase within a session. You can still follow your logs.

## Install

```bash
npm install -g @lorb/secret-mask
```

## What you can do

### Start a masked shell

Spawn a persistent subshell where everything is masked. No need to prefix every command.

```bash
secret-mask shell
```

Your `$SHELL` is used (falls back to `/bin/bash`). Type commands as usual — all output flows through the masking layer. Type `exit` or press Ctrl-D to leave.

Custom patterns work too:

```bash
secret-mask shell --pattern "INTERNAL_.*"
```

### Wrap any command

Everything that command prints to stdout/stderr gets masked in real-time.

```bash
secret-mask -- npm run dev
secret-mask -- docker compose up
secret-mask -- env
secret-mask -- kubectl logs pod-name
```

Exit codes pass through — your CI scripts still work.

### Pipe output through it

```bash
cat .env | secret-mask
heroku config | secret-mask
kubectl get secret my-secret -o yaml | secret-mask
```

### Add custom patterns

Catch secrets that don't match built-in patterns.

```bash
secret-mask --pattern "INTERNAL_.*" -- ./deploy.sh
```

### Use in CI/CD

```yaml
# GitHub Actions
- run: npx @lorb/secret-mask -- npm test
```

### Use programmatically

```js
import { createMaskStream } from '@lorb/secret-mask';

const stream = createMaskStream();
process.stdin.pipe(stream).pipe(process.stdout);
```

## What it detects

| Category | Examples |
|----------|---------|
| AI/ML | OpenAI (`sk-...`), Anthropic (`sk-ant-...`) |
| Cloud | AWS access keys, AWS secrets, Google API keys |
| Code | GitHub PAT/OAuth/App tokens, GitLab PAT, npm tokens |
| Payments | Stripe secret/public keys |
| Communication | Slack tokens, Slack webhooks, SendGrid, Twilio |
| Infrastructure | Heroku, Firebase |
| Auth | Bearer tokens, URL-embedded credentials (`user:pass@host`) |
| Generic | `PASSWORD=`, `SECRET=`, `TOKEN=`, `API_KEY=`, private keys, base64 credentials |

## How phrases work

Each secret is hashed to an index in a dictionary of **Adjective + Animal + Preposition + Object** combinations. Same secret = same phrase within a session. Session salt changes between runs, so phrases aren't stable across restarts.

## Details

- Zero network calls. Fully offline
- Zero dependencies
- Processes stdout and stderr as stream transforms (real-time, not buffered)
- Passes through the wrapped command's exit code

## License

𖦹 MIT — [Lorb.studio](https://lorb.studio)
