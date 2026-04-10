const PATTERNS = [
    // API keys by prefix
    { name: 'openai', regex: /sk-[A-Za-z0-9]{20,}/ },
    { name: 'anthropic', regex: /sk-ant-[A-Za-z0-9\-]{20,}/ },
    { name: 'aws-access-key', regex: /AKIA[0-9A-Z]{16}/ },
    { name: 'github-pat', regex: /ghp_[A-Za-z0-9]{36,}/ },
    { name: 'github-oauth', regex: /gho_[A-Za-z0-9]{36,}/ },
    { name: 'github-app-token', regex: /(?:ghu|ghs|ghr)_[A-Za-z0-9]{36,}/ },
    { name: 'gitlab-pat', regex: /glpat-[A-Za-z0-9\-_]{20,}/ },
    { name: 'stripe', regex: /(?:sk|pk)_(?:test|live)_[A-Za-z0-9]{10,}/ },
    { name: 'slack-token', regex: /xox[bpoas]-[A-Za-z0-9\-]+/ },
    { name: 'slack-webhook', regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Za-z0-9]+\/B[A-Za-z0-9]+\/[A-Za-z0-9]+/ },
    { name: 'twilio', regex: /SK[0-9a-fA-F]{32}/ },
    { name: 'sendgrid', regex: /SG\.[A-Za-z0-9\-_]{22,}\.[A-Za-z0-9\-_]{22,}/ },
    { name: 'npm-token', regex: /npm_[A-Za-z0-9]{36,}/ },
    { name: 'heroku', regex: /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/ },
    { name: 'google-api', regex: /AIza[A-Za-z0-9\-_]{35}/ },
    { name: 'firebase', regex: /AAAA[A-Za-z0-9_-]{7}:[A-Za-z0-9_-]{140}/ },
    // Bearer tokens
    { name: 'bearer', regex: /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/ },
    // URLs with embedded credentials
    { name: 'url-creds', regex: /(?:https?|ftp|postgresql|postgres|mysql|mongodb|redis|amqp):\/\/[^\s:]+:[^\s@]+@[^\s]+/ },
    // AWS secret key (40 char base64-ish after common assignment patterns)
    { name: 'aws-secret', regex: /(?<=(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)\s*[=:]\s*)[A-Za-z0-9\/+=]{40}/ },
    // Generic env-style secrets (KEY=value where key suggests a secret — mask value only)
    { name: 'env-secret', regex: /(?<=(?:SECRET|TOKEN|PASSWORD|APIKEY|API_KEY|PRIVATE_KEY|ACCESS_KEY|AUTH)[\w]*\s*=\s*)[^\s]{8,}/ },
    // Private keys
    { name: 'private-key', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
    // Base64-encoded long strings that look like credentials (preceded by assignment)
    { name: 'base64-cred', regex: /(?<=(?:key|secret|token|password|credential)\s*[=:]\s*["']?)[A-Za-z0-9+\/]{40,}={0,2}["']?/i },
];
export class SecretPatterns {
    patterns;
    constructor(customPatterns = []) {
        this.patterns = [
            ...PATTERNS,
            ...customPatterns.map((regex, i) => ({
                name: `custom-${i}`,
                regex,
            })),
        ];
    }
    findAll(text) {
        const matches = [];
        for (const pattern of this.patterns) {
            const globalRegex = new RegExp(pattern.regex.source, 'g');
            let m;
            while ((m = globalRegex.exec(text)) !== null) {
                matches.push({
                    start: m.index,
                    end: m.index + m[0].length,
                    match: m[0],
                });
            }
        }
        // Sort by start position, longer matches first for same start
        matches.sort((a, b) => a.start - b.start || b.end - a.end);
        // Remove overlapping matches (keep the first/longest)
        const result = [];
        let lastEnd = -1;
        for (const m of matches) {
            if (m.start >= lastEnd) {
                result.push(m);
                lastEnd = m.end;
            }
        }
        return result;
    }
    mask(text, replacer) {
        const matches = this.findAll(text);
        if (matches.length === 0)
            return text;
        let result = '';
        let cursor = 0;
        for (const m of matches) {
            result += text.slice(cursor, m.start);
            result += replacer(m.match);
            cursor = m.end;
        }
        result += text.slice(cursor);
        return result;
    }
}
