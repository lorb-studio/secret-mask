export interface SecretPattern {
    name: string;
    regex: RegExp;
}
export declare class SecretPatterns {
    private patterns;
    constructor(customPatterns?: RegExp[]);
    findAll(text: string): {
        start: number;
        end: number;
        match: string;
    }[];
    mask(text: string, replacer: (secret: string) => string): string;
}
