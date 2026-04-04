import { describe, it, expect } from "vitest";
import { SecretPatterns } from "./patterns.js";

describe("SecretPatterns", () => {
  const patterns = new SecretPatterns();

  describe("findAll", () => {
    it("detects OpenAI API keys", () => {
      const text = "key: sk-abc123def456ghi789jkl012";
      const matches = patterns.findAll(text);
      expect(matches).toHaveLength(1);
      expect(matches[0].match).toBe("sk-abc123def456ghi789jkl012");
    });

    it("detects Anthropic API keys", () => {
      const text = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz";
      const matches = patterns.findAll(text);
      expect(matches).toHaveLength(1);
      expect(matches[0].match).toContain("sk-ant-");
    });

    it("detects AWS access keys", () => {
      const text = "AKIAIOSFODNN7EXAMPLE";
      const matches = patterns.findAll(text);
      expect(matches).toHaveLength(1);
      expect(matches[0].match).toBe("AKIAIOSFODNN7EXAMPLE");
    });

    it("detects GitHub PATs", () => {
      const text = "token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij";
      const matches = patterns.findAll(text);
      expect(matches).toHaveLength(1);
      expect(matches[0].match).toContain("ghp_");
    });

    it("detects Stripe keys", () => {
      const text = "sk_test_51HG8vDKj0123456789abc";
      const matches = patterns.findAll(text);
      expect(matches).toHaveLength(1);
      expect(matches[0].match).toContain("sk_test_");
    });

    it("detects Bearer tokens", () => {
      const text = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      const matches = patterns.findAll(text);
      expect(matches).toHaveLength(1);
      expect(matches[0].match).toContain("Bearer ");
    });

    it("detects URLs with embedded credentials", () => {
      const text = "postgresql://admin:s3cretP4ss@db.example.com:5432/mydb";
      const matches = patterns.findAll(text);
      expect(matches).toHaveLength(1);
      expect(matches[0].match).toContain("admin:s3cretP4ss@");
    });

    it("detects Slack webhook URLs", () => {
      const prefix = "https://hooks.slack.com/services/";
      const text = prefix + "T00000000/B00000000/abcdefghijklmnopqrstuvwx";
      const matches = patterns.findAll(text);
      expect(matches).toHaveLength(1);
    });

    it("detects env-style secrets", () => {
      const text = "API_KEY=mysupersecretkey123456";
      const matches = patterns.findAll(text);
      expect(matches).toHaveLength(1);
    });

    it("detects private key headers", () => {
      const text = "-----BEGIN RSA PRIVATE KEY-----";
      const matches = patterns.findAll(text);
      expect(matches).toHaveLength(1);
    });

    it("returns empty array for text with no secrets", () => {
      const text = "Hello world, this is just normal text.";
      const matches = patterns.findAll(text);
      expect(matches).toHaveLength(0);
    });

    it("finds multiple secrets in one string", () => {
      const text = "KEY=sk-abc123def456ghi789jkl012 TOKEN=ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij";
      const matches = patterns.findAll(text);
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it("handles overlapping matches by keeping the first", () => {
      const text = "SECRET=sk-abc123def456ghi789jkl012";
      const matches = patterns.findAll(text);
      // Should not have duplicates for the same region
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i].start).toBeGreaterThanOrEqual(matches[i - 1].end);
      }
    });
  });

  describe("mask", () => {
    it("replaces secrets with provided replacement", () => {
      const text = "key: sk-abc123def456ghi789jkl012";
      const result = patterns.mask(text, () => "MASKED");
      expect(result).toBe("key: MASKED");
    });

    it("preserves non-secret text", () => {
      const text = "hello world";
      const result = patterns.mask(text, () => "MASKED");
      expect(result).toBe("hello world");
    });

    it("passes the matched secret to the replacer", () => {
      const text = "key: sk-abc123def456ghi789jkl012";
      const secrets: string[] = [];
      patterns.mask(text, (secret) => {
        secrets.push(secret);
        return "X";
      });
      expect(secrets).toHaveLength(1);
      expect(secrets[0]).toBe("sk-abc123def456ghi789jkl012");
    });

    it("replaces multiple secrets in a single string", () => {
      const text = "a=sk-abc123def456ghi789jkl012 b=AKIAIOSFODNN7EXAMPLE";
      let count = 0;
      const result = patterns.mask(text, () => {
        count++;
        return `[${count}]`;
      });
      expect(count).toBe(2);
      expect(result).toContain("[1]");
      expect(result).toContain("[2]");
    });
  });

  describe("custom patterns", () => {
    it("matches custom regex patterns", () => {
      const custom = new SecretPatterns([/MY_CUSTOM_\w+/]);
      const text = "value: MY_CUSTOM_SECRET_123";
      const matches = custom.findAll(text);
      expect(matches.some((m) => m.match.includes("MY_CUSTOM_SECRET_123"))).toBe(true);
    });
  });
});
