export interface PhraseDictionary {
    adjectives: string[];
    animals: string[];
    prepositions: string[];
    objects: string[];
}
export declare const phrases: PhraseDictionary;
export declare function getPhrase(index: number): string;
export declare const totalPhrases: number;
