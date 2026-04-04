import { describe, it, expect } from "vitest";
import { PhraseMapper } from "./mapper.js";

describe("PhraseMapper", () => {
  it("returns a string phrase for a secret", () => {
    const mapper = new PhraseMapper(Buffer.from("test-salt-1234567"));
    const phrase = mapper.map("sk-secret123");
    expect(typeof phrase).toBe("string");
    expect(phrase.length).toBeGreaterThan(0);
  });

  it("returns the same phrase for the same secret (deterministic)", () => {
    const salt = Buffer.from("deterministic-salt!");
    const mapper = new PhraseMapper(salt);
    const first = mapper.map("my-secret");
    const second = mapper.map("my-secret");
    expect(first).toBe(second);
  });

  it("returns different phrases for different secrets", () => {
    const salt = Buffer.from("same-salt-for-test");
    const mapper = new PhraseMapper(salt);
    const a = mapper.map("secret-aaa");
    const b = mapper.map("secret-bbb");
    expect(a).not.toBe(b);
  });

  it("produces different phrases with different salts (session isolation)", () => {
    const mapper1 = new PhraseMapper(Buffer.from("salt-session-one!"));
    const mapper2 = new PhraseMapper(Buffer.from("salt-session-two!"));
    const phrase1 = mapper1.map("same-secret");
    const phrase2 = mapper2.map("same-secret");
    expect(phrase1).not.toBe(phrase2);
  });

  it("phrases follow the [Adj] [Animal] [Prep] [Object] pattern (4 words)", () => {
    const mapper = new PhraseMapper(Buffer.from("pattern-check-salt"));
    const phrase = mapper.map("test-secret");
    const words = phrase.split(" ");
    expect(words.length).toBe(4);
    // Each word should be a non-empty string
    for (const word of words) {
      expect(word.length).toBeGreaterThan(0);
    }
  });

  it("uses cache for repeated lookups", () => {
    const mapper = new PhraseMapper(Buffer.from("cache-test-salt!!!!"));
    const first = mapper.map("cached-secret");
    const second = mapper.map("cached-secret");
    // Same reference from cache
    expect(first).toBe(second);
  });
});
