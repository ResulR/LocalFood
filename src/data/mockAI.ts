// Assistant LocalFood basé sur un moteur de recommandation local.
// Le moteur fait un matching simple entre les mots-clés détectés
// dans la requête utilisateur et les tags des restaurants.

import {
  restaurants as localRestaurants,
  type Restaurant,
  type RestaurantTag,
} from "./restaurants";

export const SUGGESTED_PROMPTS = [
  "Je veux un resto date night avec parking",
  "Un snack halal pas cher ouvert maintenant",
  "Un endroit avec terrasse pour brunch",
  "Un resto adapté aux enfants avec parking",
  "Je veux un dessert sympa pas loin",
  "Un restaurant vegan calme",
  "Un endroit pour manger tard ce soir",
];

// Top recherches IA utilisées dans le dashboard restaurateur.
export const TOP_AI_QUERIES = [
  { q: "date night avec parking", count: 142 },
  { q: "halal pas cher", count: 118 },
  { q: "terrasse brunch", count: 96 },
  { q: "ouvert maintenant", count: 84 },
  { q: "avec enfants", count: 67 },
  { q: "vegan livraison", count: 41 },
];

// Mapping mots-clés → tags
const KEYWORD_MAP: Array<[RegExp, RestaurantTag | "AMBIANCE_CALME"]> = [
  [/halal/i, "Halal"],
  [/vegan|végé|vegé/i, "Vegan"],
  [/terrasse|extérieur|exterieur/i, "Terrasse"],
  [/enfant|famille|kid/i, "Enfant"],
  [/parking|voiture/i, "Parking"],
  [/ouvert|maintenant|tard|ce soir|now/i, "Ouvert maintenant"],
  [/livraison|deliver/i, "Livraison"],
  [/à emporter|emporter|takeaway|take away/i, "À emporter"],
  [/pas cher|cheap|budget|abordable|économique/i, "Pas cher"],
  [/date|romantique|amoureux|couple|en amoureux/i, "Date night"],
  [/snack|burger|tacos|fastfood|fast food/i, "Snack"],
  [/brunch|petit[- ]déj|matin/i, "Brunch"],
  [/dessert|sucré|patisserie|pâtisserie|glace/i, "Dessert"],
  [/calme|tranquille|cosy|cocooning/i, "AMBIANCE_CALME"],
];

export type AIResult = {
  detectedTags: string[];
  explanation: string;
  results: Array<Restaurant & { matchScore: number; matchReason: string }>;
};

export function runMockAIQuery(
  query: string,
  sourceRestaurants: Restaurant[] = localRestaurants,
): AIResult {
  const detected = new Set<string>();
  for (const [re, tag] of KEYWORD_MAP) {
    if (re.test(query)) detected.add(tag);
  }
  if (detected.size === 0) detected.add("Ouvert maintenant");

  const wantsCalm = detected.has("AMBIANCE_CALME");
  const tagDetected: RestaurantTag[] = [...detected].filter(
    (t): t is RestaurantTag => t !== "AMBIANCE_CALME",
  );

  const scored = sourceRestaurants
    .map((r) => {
      const matched = tagDetected.filter((t) => r.tags.includes(t));
      const ratio = tagDetected.length === 0 ? 0.5 : matched.length / tagDetected.length;
      const ratingBoost = (r.rating - 4) * 0.05;
      const calmBoost = wantsCalm && r.priceLevel >= 2 ? 0.06 : 0;
      const score = Math.min(0.99, 0.55 + ratio * 0.4 + ratingBoost + calmBoost);
      return {
        ...r,
        matchScore: Math.round(score * 100),
        matchReason:
          matched.length > 0
            ? `Correspond à : ${matched.join(", ")}`
            : "Bon score général basé sur les avis et l'ambiance.",
      };
    })
    .filter((r) => r.matchScore >= 65)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 4);

  const explanation =
    scored.length === 0
      ? "Aucun restaurant trouvé pour le moment dans les données disponibles. Essayez une autre recherche."
      : `J'ai trouvé ${scored.length} restaurant${scored.length > 1 ? "s" : ""} qui correspondent à votre envie. ${
          wantsCalm
            ? "Ces lieux ont une ambiance plutôt calme et soignée."
            : "Sélection basée sur vos critères et les avis de la communauté."
        }`;

  return {
    detectedTags: [...detected].map((t) => (t === "AMBIANCE_CALME" ? "Ambiance calme" : t)),
    explanation,
    results: scored,
  };
}
