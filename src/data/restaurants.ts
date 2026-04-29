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

export const restaurants: Restaurant[] = [
  make({
    id: "maison-zayna",
    name: "Maison Zayna",
    category: "Cuisine méditerranéenne",
    cuisineType: "Méditerranéen",
    description:
      "Une cuisine méditerranéenne raffinée, 100% halal, avec une carte qui change au fil des saisons. Cadre chaleureux et terrasse ombragée.",
    image: img("1517248135467-4c7edcad34c4", 1),
    gallery: galleryFor(1),
    rating: 4.8,
    reviewsCount: 312,
    distanceKm: 0.6,
    price: "€€",
    open: true,
    hours: "12h–14h30 · 19h–23h",
    tags: ["Halal", "Terrasse", "Date night", "Parking", "Ouvert maintenant"],
    badges: ["Vérifié", "Premium", "Populaire"],
    address: "12 rue des Oliviers, Lyon",
    phone: "+33 4 78 00 00 12",
    reviews: sampleReviews(1),
    stats: baseStats(8),
    localFoodMatchScore: 94,
    hasParking: true,
    hasTerrace: true,
    isHalal: true,
    isVeganFriendly: false,
    isChildFriendly: false,
    hasDelivery: false,
    hasTakeaway: false,
    isCheap: false,
    isDateNight: true,
    isSnack: false,
    isBrunch: false,
    isDessert: false,
    hasOffer: true,
    offer: {
      code: "ZAYNA10",
      title: "-10% première visite",
      description: "Présentez ce code en caisse pour bénéficier de 10% sur votre addition.",
      conditions: "Hors boissons. Une fois par client.",
    },
  }),
  make({
    id: "verde-bowl",
    name: "Verde Bowl",
    category: "Vegan & healthy",
    cuisineType: "Vegan",
    description:
      "Bowls colorés, jus pressés à froid et pâtisseries vegan. Tout est fait maison avec des produits locaux et bio.",
    image: img("1546069901-ba9599a7e63c", 2),
    gallery: galleryFor(2),
    rating: 4.6,
    reviewsCount: 188,
    distanceKm: 1.2,
    price: "€€",
    open: true,
    hours: "11h–16h",
    tags: ["Vegan", "À emporter", "Livraison", "Ouvert maintenant", "Pas cher"],
    badges: ["Vérifié", "Recommandé"],
    address: "5 place du Marché, Lyon",
    phone: "+33 4 78 00 00 22",
    reviews: sampleReviews(2),
    stats: baseStats(5),
    localFoodMatchScore: 88,
    hasParking: false,
    hasTerrace: false,
    isHalal: false,
    isVeganFriendly: true,
    isChildFriendly: true,
    hasDelivery: true,
    hasTakeaway: true,
    isCheap: true,
    isDateNight: false,
    isSnack: false,
    isBrunch: true,
    isDessert: false,
  }),
  make({
    id: "le-snack-23",
    name: "Le Snack 23",
    category: "Snack & burgers",
    cuisineType: "Snack",
    description:
      "Burgers maison, tacos généreux et frites fraîches. Parfait pour une pause rapide et gourmande.",
    image: img("1568901346375-23c9450c58cd", 3),
    gallery: galleryFor(3),
    rating: 4.3,
    reviewsCount: 421,
    distanceKm: 0.9,
    price: "€",
    open: true,
    hours: "11h–23h",
    tags: ["Halal", "Snack", "Pas cher", "À emporter", "Livraison", "Ouvert maintenant"],
    badges: ["Populaire"],
    address: "23 avenue Jean Jaurès, Lyon",
    phone: "+33 4 78 00 00 33",
    reviews: sampleReviews(3),
    stats: baseStats(12),
    localFoodMatchScore: 82,
    hasParking: false,
    hasTerrace: false,
    isHalal: true,
    isVeganFriendly: false,
    isChildFriendly: true,
    hasDelivery: true,
    hasTakeaway: true,
    isCheap: true,
    isDateNight: false,
    isSnack: true,
    isBrunch: false,
    isDessert: false,
    hasOffer: true,
    offer: {
      code: "SNACK23",
      title: "Boisson offerte",
      description: "Une boisson offerte pour tout menu acheté.",
      conditions: "Du lundi au jeudi.",
    },
  }),
  make({
    id: "matin-doux",
    name: "Matin Doux",
    category: "Brunch & café",
    cuisineType: "Brunch",
    description:
      "Brunch servi toute la matinée, pancakes moelleux, œufs bénédicte et café de spécialité torréfié à Lyon.",
    image: img("1504754524776-8f4f37790ca0", 4),
    gallery: galleryFor(4),
    rating: 4.7,
    reviewsCount: 256,
    distanceKm: 2.1,
    price: "€€",
    open: false,
    hours: "8h–15h",
    tags: ["Brunch", "Terrasse", "Enfant", "Vegan"],
    badges: ["Vérifié", "Recommandé"],
    address: "8 rue Pasteur, Lyon",
    phone: "+33 4 78 00 00 44",
    reviews: sampleReviews(4),
    stats: baseStats(6),
    localFoodMatchScore: 79,
    hasParking: false,
    hasTerrace: true,
    isHalal: false,
    isVeganFriendly: true,
    isChildFriendly: true,
    hasDelivery: false,
    hasTakeaway: true,
    isCheap: false,
    isDateNight: false,
    isSnack: false,
    isBrunch: true,
    isDessert: false,
  }),
  make({
    id: "sucre-eclat",
    name: "Sucré Éclat",
    category: "Pâtisserie & desserts",
    cuisineType: "Dessert",
    description:
      "Pâtisseries fines, glaces artisanales et créations chocolatées du chef. Une parenthèse sucrée à offrir.",
    image: img("1488477181946-6428a0291777", 5),
    gallery: galleryFor(5),
    rating: 4.9,
    reviewsCount: 502,
    distanceKm: 1.5,
    price: "€€",
    open: true,
    hours: "10h–20h",
    tags: ["Dessert", "À emporter", "Ouvert maintenant", "Enfant"],
    badges: ["Vérifié", "Premium", "Populaire"],
    address: "44 rue de la République, Lyon",
    phone: "+33 4 78 00 00 55",
    reviews: sampleReviews(5),
    stats: baseStats(15),
    localFoodMatchScore: 91,
    hasParking: false,
    hasTerrace: false,
    isHalal: false,
    isVeganFriendly: false,
    isChildFriendly: true,
    hasDelivery: false,
    hasTakeaway: true,
    isCheap: false,
    isDateNight: false,
    isSnack: false,
    isBrunch: false,
    isDessert: true,
    hasOffer: true,
    offer: {
      code: "SUCRE5",
      title: "Dessert offert",
      description: "Un macaron offert pour toute commande de 15€ et plus.",
    },
  }),
  make({
    id: "casa-noche",
    name: "Casa Noche",
    category: "Tapas & cocktails",
    cuisineType: "Espagnol",
    description:
      "Tapas créatives, cocktails signature et ambiance feutrée. L'adresse parfaite pour un dîner en amoureux.",
    image: img("1559339352-11d035aa65de", 6),
    gallery: galleryFor(6),
    rating: 4.5,
    reviewsCount: 174,
    distanceKm: 3.4,
    price: "€€€",
    open: true,
    hours: "18h–1h",
    tags: ["Date night", "Terrasse", "Ouvert maintenant"],
    badges: ["Premium", "Recommandé"],
    address: "2 quai Saint-Antoine, Lyon",
    phone: "+33 4 78 00 00 66",
    reviews: sampleReviews(6),
    stats: baseStats(9),
    localFoodMatchScore: 87,
    hasParking: true,
    hasTerrace: true,
    isHalal: false,
    isVeganFriendly: false,
    isChildFriendly: false,
    hasDelivery: false,
    hasTakeaway: false,
    isCheap: false,
    isDateNight: true,
    isSnack: false,
    isBrunch: false,
    isDessert: false,
  }),
  make({
    id: "famille-cocotte",
    name: "Famille & Cocotte",
    category: "Cuisine familiale",
    cuisineType: "Français",
    description:
      "Une cuisine généreuse et conviviale, espace enfant, menus dédiés et parking gratuit. Un vrai bonheur en famille.",
    image: img("1555939594-58d7cb561ad1", 7),
    gallery: galleryFor(7),
    rating: 4.4,
    reviewsCount: 219,
    distanceKm: 4.2,
    price: "€€",
    open: true,
    hours: "12h–22h",
    tags: ["Enfant", "Parking", "Terrasse", "Ouvert maintenant", "Pas cher"],
    badges: ["Vérifié"],
    address: "75 chemin des Vignes, Lyon",
    phone: "+33 4 78 00 00 77",
    reviews: sampleReviews(7),
    stats: baseStats(7),
    localFoodMatchScore: 76,
    hasParking: true,
    hasTerrace: true,
    isHalal: false,
    isVeganFriendly: false,
    isChildFriendly: true,
    hasDelivery: false,
    hasTakeaway: true,
    isCheap: true,
    isDateNight: false,
    isSnack: false,
    isBrunch: false,
    isDessert: false,
  }),
  make({
    id: "tokyo-go",
    name: "Tokyo Go",
    category: "Sushi & japonais",
    cuisineType: "Japonais",
    description:
      "Sushis frais préparés à la commande, ramen maison et formules à emporter rapides.",
    image: img("1579871494447-9811cf80d66c", 8),
    gallery: galleryFor(8),
    rating: 4.6,
    reviewsCount: 340,
    distanceKm: 1.8,
    price: "€€",
    open: true,
    hours: "11h30–14h30 · 18h30–22h30",
    tags: ["À emporter", "Livraison", "Ouvert maintenant", "Date night"],
    badges: ["Vérifié", "Populaire"],
    address: "17 rue Mercière, Lyon",
    phone: "+33 4 78 00 00 88",
    reviews: sampleReviews(8),
    stats: baseStats(11),
    localFoodMatchScore: 84,
    hasParking: false,
    hasTerrace: false,
    isHalal: false,
    isVeganFriendly: true,
    isChildFriendly: false,
    hasDelivery: true,
    hasTakeaway: true,
    isCheap: false,
    isDateNight: true,
    isSnack: false,
    isBrunch: false,
    isDessert: false,
  }),
  make({
    id: "olive-noire",
    name: "Olive Noire",
    category: "Bistronomie",
    cuisineType: "Français",
    description:
      "Bistronomie de saison, produits sourcés chez les producteurs locaux. Une cave à vins remarquable.",
    image: img("1414235077428-338989a2e8c0", 9),
    gallery: galleryFor(9),
    rating: 4.7,
    reviewsCount: 142,
    distanceKm: 2.7,
    price: "€€€",
    open: true,
    hours: "19h–23h",
    tags: ["Date night", "Ouvert maintenant", "Parking"],
    badges: ["Nouveau", "Recommandé"],
    address: "9 rue des Capucins, Lyon",
    phone: "+33 4 78 00 00 99",
    reviews: sampleReviews(9),
    stats: baseStats(4),
    localFoodMatchScore: 81,
    hasParking: true,
    hasTerrace: false,
    isHalal: false,
    isVeganFriendly: false,
    isChildFriendly: false,
    hasDelivery: false,
    hasTakeaway: false,
    isCheap: false,
    isDateNight: true,
    isSnack: false,
    isBrunch: false,
    isDessert: false,
    isNew: true,
  }),
  make({
    id: "tacos-amigo",
    name: "Tacos Amigo",
    category: "Tex-Mex & tacos",
    cuisineType: "Mexicain",
    description:
      "Tacos français généreux, burritos maison et sauces signatures. Halal, à emporter et livraison rapide.",
    image: img("1565299624946-b28f40a0ae38", 10),
    gallery: galleryFor(10),
    rating: 4.2,
    reviewsCount: 386,
    distanceKm: 1.1,
    price: "€",
    open: true,
    hours: "11h–00h",
    tags: ["Halal", "Snack", "Pas cher", "À emporter", "Livraison", "Ouvert maintenant"],
    badges: ["Populaire"],
    address: "30 rue Garibaldi, Lyon",
    phone: "+33 4 78 01 01 10",
    reviews: sampleReviews(10),
    stats: baseStats(13),
    localFoodMatchScore: 78,
    hasParking: false,
    hasTerrace: false,
    isHalal: true,
    isVeganFriendly: false,
    isChildFriendly: true,
    hasDelivery: true,
    hasTakeaway: true,
    isCheap: true,
    isDateNight: false,
    isSnack: true,
    isBrunch: false,
    isDessert: false,
  }),
  make({
    id: "green-leaf",
    name: "Green Leaf",
    category: "Healthy bowls",
    cuisineType: "Vegan",
    description:
      "Salades signature, bowls protéinés et smoothies frais. Vegan, sans gluten, et délicieux.",
    image: img("1540189549336-e6e99c3679fe", 11),
    gallery: galleryFor(11),
    rating: 4.5,
    reviewsCount: 96,
    distanceKm: 2.5,
    price: "€€",
    open: true,
    hours: "11h30–15h · 18h–21h",
    tags: ["Vegan", "À emporter", "Livraison", "Pas cher", "Ouvert maintenant"],
    badges: ["Nouveau"],
    address: "62 cours Lafayette, Lyon",
    phone: "+33 4 78 02 02 22",
    reviews: sampleReviews(11),
    stats: baseStats(3),
    localFoodMatchScore: 80,
    hasParking: false,
    hasTerrace: false,
    isHalal: false,
    isVeganFriendly: true,
    isChildFriendly: false,
    hasDelivery: true,
    hasTakeaway: true,
    isCheap: true,
    isDateNight: false,
    isSnack: false,
    isBrunch: true,
    isDessert: false,
    isNew: true,
  }),
  make({
    id: "patio-saveur",
    name: "Patio Saveur",
    category: "Méditerranéen",
    cuisineType: "Libanais",
    description:
      "Mezzés généreux, grillades halal et grande terrasse arborée. Idéal en famille ou entre amis.",
    image: img("1551782450-a2132b4ba21d", 12),
    gallery: galleryFor(12),
    rating: 4.6,
    reviewsCount: 268,
    distanceKm: 3.0,
    price: "€€",
    open: false,
    hours: "12h–15h · 19h–23h",
    tags: ["Halal", "Terrasse", "Enfant", "Parking", "Date night"],
    badges: ["Vérifié"],
    address: "11 rue Sala, Lyon",
    phone: "+33 4 78 03 03 33",
    reviews: sampleReviews(12),
    stats: baseStats(10),
    localFoodMatchScore: 85,
    hasParking: true,
    hasTerrace: true,
    isHalal: true,
    isVeganFriendly: false,
    isChildFriendly: true,
    hasDelivery: false,
    hasTakeaway: false,
    isCheap: false,
    isDateNight: true,
    isSnack: false,
    isBrunch: false,
    isDessert: false,
  }),
];

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

export const chartData7d = [
  { day: "Lun", views: 38, clics: 12 },
  { day: "Mar", views: 45, clics: 18 },
  { day: "Mer", views: 52, clics: 22 },
  { day: "Jeu", views: 41, clics: 15 },
  { day: "Ven", views: 68, clics: 28 },
  { day: "Sam", views: 89, clics: 41 },
  { day: "Dim", views: 76, clics: 33 },
];

export const chartData30d = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  views: Math.round(30 + Math.sin(i / 3) * 20 + Math.random() * 25),
  clics: Math.round(10 + Math.cos(i / 4) * 8 + Math.random() * 12),
}));

export const getRestaurant = (id: string) => restaurants.find((r) => r.id === id);

// Helpers de tri / sélections
export const getPopular = () =>
  [...restaurants].sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 4);
export const getOpenNow = () => restaurants.filter((r) => r.open).slice(0, 4);
export const getNew = () => restaurants.filter((r) => r.isNew);
export const getDeals = () => restaurants.filter((r) => r.hasOffer);
export const getSimilar = (id: string) => restaurants.filter((r) => r.id !== id).slice(0, 3);
