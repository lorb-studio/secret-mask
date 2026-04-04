import { createHash, randomBytes } from "node:crypto";
import { getPhrase, totalPhrases } from "./phrases.js";

/**
 * Maps secrets to deterministic phrase indices.
 * Same secret → same phrase within a session (session salt).
 * Different sessions produce different mappings.
 */
export class PhraseMapper {
  private salt: Buffer;
  private cache: Map<string, string>;

  constructor(salt?: Buffer) {
    this.salt = salt ?? randomBytes(16);
    this.cache = new Map();
  }

  /**
   * Returns a playful phrase for the given secret.
   * Deterministic: same secret always returns the same phrase in this session.
   */
  map(secret: string): string {
    const cached = this.cache.get(secret);
    if (cached !== undefined) return cached;

    const index = this.hash(secret);
    const phrase = getPhrase(index);
    this.cache.set(secret, phrase);
    return phrase;
  }

  private hash(secret: string): number {
    const digest = createHash("sha256")
      .update(this.salt)
      .update(secret)
      .digest();

    // Read first 4 bytes as unsigned 32-bit integer
    const num = digest.readUInt32BE(0);
    return num % totalPhrases;
  }
}
