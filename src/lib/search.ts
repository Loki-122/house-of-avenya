/**
 * Product search.
 *
 * A pure, dependency-free matcher over the existing catalogue. It derives its
 * keyword index from fields the products already carry — name, category, colour,
 * material, specification and description — so search gains relevance without
 * anyone maintaining a separate tag list, and keeps working unchanged when the
 * catalogue comes from a database instead of this module.
 *
 * Matching is AND-based across query terms (every term must hit somewhere) with
 * field weighting deciding the order. A loose OR search on long descriptions
 * returns nearly everything, which reads as "search is broken".
 */
import { products, type Product } from './products';

/** Higher weight = a hit here ranks the product higher. */
const WEIGHT = {
  name: 10,
  category: 8,
  colour: 5,
  material: 4,
  specification: 3,
  description: 2,
} as const;

type Field = { weight: number; text: string };

/** Lowercase, strip punctuation, collapse whitespace — so "zari," matches "zari". */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fieldsFor(product: Product): Field[] {
  return [
    { weight: WEIGHT.name, text: product.name },
    { weight: WEIGHT.category, text: product.category },
    { weight: WEIGHT.colour, text: product.colors.map((color) => color.name).join(' ') },
    { weight: WEIGHT.material, text: product.material },
    {
      weight: WEIGHT.specification,
      text: product.details.map((detail) => `${detail.label} ${detail.value}`).join(' '),
    },
    { weight: WEIGHT.description, text: product.description },
  ];
}

function termsFor(query: string): string[] {
  return normalise(query).split(' ').filter(Boolean);
}

/**
 * Score a single term against one product. Returns 0 when the term is absent
 * from every indexed field.
 */
function scoreTerm(term: string, fields: Field[]): number {
  let best = 0;

  for (const field of fields) {
    const index = normalise(field.text).indexOf(term);
    if (index === -1) continue;

    // A hit at the start of a field ("silk" in "silk saree") is a stronger signal
    // than the same word buried mid-sentence.
    let score = field.weight + (index === 0 ? 4 : 0);
    if (field.weight === WEIGHT.name && normalise(field.text) === term) score += 6;

    best = Math.max(best, score);
  }

  return best;
}

export type SearchResult = {
  product: Product;
  score: number;
};

export function searchProducts(query: string, limit = 8): SearchResult[] {
  const terms = termsFor(query);
  if (terms.length === 0) return [];

  const results: SearchResult[] = [];

  for (const product of products) {
    const fields = fieldsFor(product);
    let score = 0;
    let matchedEveryTerm = true;

    for (const term of terms) {
      const termScore = scoreTerm(term, fields);
      if (termScore === 0) {
        matchedEveryTerm = false;
        break;
      }
      score += termScore;
    }

    if (matchedEveryTerm) results.push({ product, score });
  }

  // Ties keep catalogue order, which is editorial rather than arbitrary.
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Shown while the field is empty. Chosen from vocabulary that genuinely appears
 * in the catalogue so every suggestion returns results.
 */
export const suggestedSearches = ['Saree', 'Lehenga', 'Silk', 'Jacket', 'Kurta', 'Banarasi'];

export const categories = Array.from(new Set(products.map((product) => product.category)));