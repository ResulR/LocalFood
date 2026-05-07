// =====================================================================
// LocalFood — Données locales de démonstration
// =====================================================================
// Tout est local, aucune dépendance backend.
// Pour modifier :
// - Restaurants : tableau `restaurants` ci-dessous
// - Filtres : `QUICK_FILTERS`
// - Catégories : `categories`
// - Stats / graphiques : `chartData7d`, `chartData30d`
// - Interactions, offres et recommandations : voir aussi les autres fichiers src/data
// =====================================================================

export type RestaurantTag =
  | "Halal"
  | "Vegan"
  | "Terrasse"
  | "Enfant"
  | "Parking"
  | "Ouvert maintenant"
  | "Livraison"
  | "À emporter"
  | "Pas cher"
  | "Date night"
  | "Snack"
  | "Brunch"
  | "Dessert";

export type Badge = "Vérifié" | "Premium" | "Populaire" | "Nouveau" | "Recommandé";

export type DetailedRating = {
  food: number;
  welcome: number;
  price: number;
  cleanliness: number;
  ambiance: number;
  waitTime: number;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  photo?: string;
  detailed?: DetailedRating;
};

export type PhotoCategory =
  | "Plats"
  | "Menu"
  | "Salle"
  | "Terrasse"
  | "Façade"
  | "Ambiance"
  | "Parking";

export type RestaurantPhoto = {
  id?: string;
  url: string;
  category: PhotoCategory;
  byClient?: boolean;
  author?: string;
};

export type Offer = {
  code: string;
  title: string;
  description: string;
  conditions?: string;
};

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  category: string;
  cuisineType: string;
  description: string;
  image: string;
  gallery: string[];
  photos: RestaurantPhoto[];
  rating: number;
  reviewsCount: number;
  detailedRating: DetailedRating;
  distanceKm: number;
  latitude?: number;
  longitude?: number;
  price: "€" | "€€" | "€€€";
  priceLevel: 1 | 2 | 3;
  open: boolean;
  hours: string;
  openingHours: Record<string, string>;
  tags: RestaurantTag[];
  badges: Badge[];
  address: string;
  city: string;
  phone: string;
  reviews: Review[];
  isNew?: boolean;
  hasOffer?: boolean;
  offer?: Offer;
  localFoodMatchScore: number;
  menuUrl: string;
  googleMapsUrl: string;
  wazeUrl: string;
  // Booléens explicites pour faciliter le filtrage
  hasParking: boolean;
  hasTerrace: boolean;
  isHalal: boolean;
  isVeganFriendly: boolean;
  isChildFriendly: boolean;
  hasDelivery: boolean;
  hasTakeaway: boolean;
  isCheap: boolean;
  isDateNight: boolean;
  isSnack: boolean;
  isBrunch: boolean;
  isDessert: boolean;
  stats: {
    views: number;
    googleMaps: number;
    waze: number;
    calls: number;
    menu: number;
    going: number;
    reviewsReceived: number;
    photosAdded: number;
    aiClicks: number;
    aiAppearances: number;
  };
};

const img = (q: string, seed: number) =>
  `https://images.unsplash.com/photo-${q}?auto=format&fit=crop&w=1200&q=80&sig=${seed}`;

const PHOTO_POOL = [
  "1517248135467-4c7edcad34c4",
  "1504674900247-0877df9cc836",
  "1555396273-367ea4eb4db5",
  "1565299624946-b28f40a0ae38",
  "1481931098730-318b6f776db0",
  "1540189549336-e6e99c3679fe",
  "1473093295043-cdd812d0e601",
  "1414235077428-338989a2e8c0",
  "1551782450-a2132b4ba21d",
  "1559339352-11d035aa65de",
  "1546069901-ba9599a7e63c",
  "1567620905732-2d1ec7ab7445",
];

const galleryFor = (n: number) =>
  PHOTO_POOL.slice(n % PHOTO_POOL.length)
    .concat(PHOTO_POOL)
    .slice(0, 6)
    .map((p, i) => img(p, n * 10 + i));

const photosFor = (n: number): RestaurantPhoto[] => {
  const cats: PhotoCategory[] = [
    "Plats",
    "Plats",
    "Salle",
    "Terrasse",
    "Ambiance",
    "Façade",
    "Menu",
  ];
  return galleryFor(n).map((url, i) => ({
    url,
    category: cats[i % cats.length],
    byClient: i % 2 === 1,
    author: i % 2 === 1 ? ["Sarah B.", "Karim L.", "Léa M.", "Antoine R."][i % 4] : undefined,
  }));
};

const sampleReviews = (n: number): Review[] => [
  {
    id: `${n}-1`,
    author: "Sarah B.",
    rating: 5,
    date: "il y a 2 jours",
    comment:
      "Une expérience incroyable, le cadre est superbe et les plats vraiment délicieux. Je recommande vivement !",
    detailed: { food: 5, welcome: 5, price: 4, cleanliness: 5, ambiance: 5, waitTime: 4 },
  },
  {
    id: `${n}-2`,
    author: "Karim L.",
    rating: 4,
    date: "il y a 1 semaine",
    comment: "Très bon rapport qualité/prix, service au top. Petit bémol sur l'attente.",
    detailed: { food: 4, welcome: 5, price: 5, cleanliness: 4, ambiance: 4, waitTime: 3 },
  },
  {
    id: `${n}-3`,
    author: "Léa M.",
    rating: 5,
    date: "il y a 2 semaines",
    comment: "Mon coup de cœur du quartier. À tester absolument.",
    photo: img(PHOTO_POOL[(n + 2) % PHOTO_POOL.length], n + 99),
    detailed: { food: 5, welcome: 5, price: 4, cleanliness: 5, ambiance: 5, waitTime: 5 },
  },
];

const baseStats = (seed: number) => ({
  views: 200 + seed * 37,
  googleMaps: 40 + seed * 6,
  waze: 18 + seed * 3,
  calls: 12 + seed * 4,
  menu: 80 + seed * 9,
  going: 14 + seed * 2,
  reviewsReceived: 8 + seed,
  photosAdded: 5 + Math.floor(seed / 2),
  aiClicks: 12 + seed * 2,
  aiAppearances: 30 + seed * 4,
});

const defaultHours = {
  Lundi: "12h–14h30 · 19h–23h",
  Mardi: "12h–14h30 · 19h–23h",
  Mercredi: "12h–14h30 · 19h–23h",
  Jeudi: "12h–14h30 · 19h–23h",
  Vendredi: "12h–14h30 · 19h–00h",
  Samedi: "12h–15h · 19h–00h",
  Dimanche: "Fermé",
};

const make = (
  r: Omit<
    Restaurant,
    | "slug"
    | "photos"
    | "openingHours"
    | "detailedRating"
    | "priceLevel"
    | "googleMapsUrl"
    | "wazeUrl"
    | "menuUrl"
    | "city"
  >,
): Restaurant => ({
  ...r,
  slug: r.id,
  photos: photosFor(r.stats.views % 10 || 1),
  openingHours: defaultHours,
  detailedRating: {
    food: r.rating,
    welcome: r.rating - 0.2,
    price: r.rating - 0.5,
    cleanliness: r.rating - 0.1,
    ambiance: r.rating,
    waitTime: r.rating - 0.3,
  },
  priceLevel: r.price === "€" ? 1 : r.price === "€€" ? 2 : 3,
  googleMapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(r.name + " " + r.address)}`,
  wazeUrl: `https://waze.com/ul?q=${encodeURIComponent(r.name)}`,
  menuUrl: `https://localfood.app/${r.id}/menu`,
  city: r.address.split(",").pop()?.trim() ?? "Lyon",
});

export const categories = [
  { id: "restaurant", label: "Restaurants", icon: "🍽️" },
  { id: "snack", label: "Snacks", icon: "🍔" },
  { id: "brunch", label: "Brunch", icon: "🥐" },
  { id: "dessert", label: "Desserts", icon: "🍰" },
  { id: "cafe", label: "Cafés", icon: "☕" },
  { id: "vegan", label: "Vegan", icon: "🥗" },
  { id: "halal", label: "Halal", icon: "🕌" },
  { id: "fastfood", label: "Fast-food", icon: "🌮" },
];

export const QUICK_FILTERS: RestaurantTag[] = [
  "Halal",
  "Vegan",
  "Terrasse",
  "Enfant",
  "Parking",
  "Ouvert maintenant",
  "Livraison",
  "À emporter",
  "Pas cher",
  "Date night",
  "Snack",
  "Brunch",
  "Dessert",
];

export const PHOTO_CATEGORIES: PhotoCategory[] = [
  "Plats",
  "Menu",
  "Salle",
  "Terrasse",
  "Façade",
  "Ambiance",
  "Parking",
];
