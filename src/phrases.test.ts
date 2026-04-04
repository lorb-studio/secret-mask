import { describe, it, expect } from "vitest";
import { getPhrase, totalPhrases, phrases } from "./phrases.js";

describe("phrases", () => {
  it("dictionary has all four word categories", () => {
    expect(phrases.adjectives.length).toBeGreaterThan(0);
    expect(phrases.animals.length).toBeGreaterThan(0);
    expect(phrases.prepositions.length).toBeGreaterThan(0);
    expect(phrases.objects.length).toBeGreaterThan(0);
  });

  it("totalPhrases equals the product of all category lengths", () => {
    const expected =
      phrases.adjectives.length *
      phrases.animals.length *
      phrases.prepositions.length *
      phrases.objects.length;
    expect(totalPhrases).toBe(expected);
  });

  it("totalPhrases is at least 200", () => {
    // Spec requires 200+ phrases
    expect(totalPhrases).toBeGreaterThanOrEqual(200);
  });

  it("getPhrase returns a 4-word string", () => {
    const phrase = getPhrase(0);
    const words = phrase.split(" ");
    expect(words.length).toBe(4);
  });

  it("getPhrase is deterministic for the same index", () => {
    expect(getPhrase(42)).toBe(getPhrase(42));
  });

  it("different indices produce different phrases", () => {
    const a = getPhrase(0);
    const b = getPhrase(1);
    expect(a).not.toBe(b);
  });

  it("handles negative indices via modulo", () => {
    const phrase = getPhrase(-1);
    expect(phrase.split(" ").length).toBe(4);
  });

  it("wraps around for index >= totalPhrases", () => {
    const a = getPhrase(0);
    const b = getPhrase(totalPhrases);
    expect(a).toBe(b);
  });
});
