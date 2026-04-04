import dictionary from "./dictionary.json" with { type: "json" };
export const phrases = dictionary;
export function getPhrase(index) {
    const { adjectives, animals, prepositions, objects } = phrases;
    const a = adjectives.length;
    const b = animals.length;
    const c = prepositions.length;
    const d = objects.length;
    const total = a * b * c * d;
    const i = ((index % total) + total) % total;
    const adjIdx = i % a;
    const aniIdx = Math.floor(i / a) % b;
    const preIdx = Math.floor(i / (a * b)) % c;
    const objIdx = Math.floor(i / (a * b * c)) % d;
    return `${adjectives[adjIdx]} ${animals[aniIdx]} ${prepositions[preIdx]} ${objects[objIdx]}`;
}
export const totalPhrases = phrases.adjectives.length *
    phrases.animals.length *
    phrases.prepositions.length *
    phrases.objects.length;
