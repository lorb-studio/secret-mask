/**
 * Maps secrets to deterministic phrase indices.
 * Same secret → same phrase within a session (session salt).
 * Different sessions produce different mappings.
 */
export declare class PhraseMapper {
    private salt;
    private cache;
    constructor(salt?: Buffer);
    /**
     * Returns a playful phrase for the given secret.
     * Deterministic: same secret always returns the same phrase in this session.
     */
    map(secret: string): string;
    private hash;
}
