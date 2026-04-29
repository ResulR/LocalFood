import type {
  Badge,
  DetailedRating,
  Offer,
  PhotoCategory,
  Restaurant,
  RestaurantPhoto,
  RestaurantTag,
} from "@/data/restaurants";
import type { SupabaseRestaurantListItem } from "@/lib/restaurants-api";

const VALID_TAGS: RestaurantTag[] = [
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

const VALID_BADGES: Badge[] = ["Vérifié", "Premium", "Populaire", "Nouveau", "Recommandé"];

const VALID_PHOTO_CATEGORIES: PhotoCategory[] = [
  "Plats",
  "Menu",
  "Salle",
  "Terrasse",
  "Façade",
  "Ambiance",
  "Parking",
];

function toRestaurantTag(label: string): RestaurantTag | null {
  return VALID_TAGS.includes(label as RestaurantTag) ? (label as RestaurantTag) : null;
}

function toBadge(label: string): Badge | null {
  return VALID_BADGES.includes(label as Badge) ? (label as Badge) : null;
}

function toPhotoCategory(category: string): PhotoCategory {
  return VALID_PHOTO_CATEGORIES.includes(category as PhotoCategory)
    ? (category as PhotoCategory)
    : "Plats";
}

function buildOpeningHours(restaurant: SupabaseRestaurantListItem): Record<string, string> {
  if (restaurant.opening_hours.length === 0) {
    return {
      Lundi: restaurant.hours_summary ?? "Non renseigné",
      Mardi: restaurant.hours_summary ?? "Non renseigné",
      Mercredi: restaurant.hours_summary ?? "Non renseigné",
      Jeudi: restaurant.hours_summary ?? "Non renseigné",
      Vendredi: restaurant.hours_summary ?? "Non renseigné",
      Samedi: restaurant.hours_summary ?? "Non renseigné",
      Dimanche: "Non renseigné",
    };
  }

  return restaurant.opening_hours
    .slice()
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .reduce<Record<string, string>>((acc, item) => {
      acc[item.day_label] = item.hours_text;
      return acc;
    }, {});
}

function buildDetailedRating(rating: number): DetailedRating {
  return {
    food: rating,
    welcome: Math.max(0, rating - 0.2),
    price: Math.max(0, rating - 0.5),
    cleanliness: Math.max(0, rating - 0.1),
    ambiance: rating,
    waitTime: Math.max(0, rating - 0.3),
  };
}

function buildPhotos(restaurant: SupabaseRestaurantListItem): RestaurantPhoto[] {
  return restaurant.photos
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((photo) => ({
      id: photo.id,
      url: photo.url,
      category: toPhotoCategory(photo.category),
      byClient: photo.is_client_photo,
      author: photo.author_name ?? undefined,
    }));
}

function buildOffer(restaurant: SupabaseRestaurantListItem): Offer | undefined {
  const offer = restaurant.offers[0];

  if (!offer) {
    return undefined;
  }

  return {
    code: offer.code,
    title: offer.title,
    description: offer.description,
    conditions: offer.conditions ?? undefined,
  };
}

export function mapSupabaseRestaurantToRestaurant(
  restaurant: SupabaseRestaurantListItem,
): Restaurant {
  const tags = restaurant.tags
    .map((tag) => toRestaurantTag(tag.label))
    .filter((tag): tag is RestaurantTag => Boolean(tag));

  const badges = restaurant.badges
    .map((badge) => toBadge(badge.label))
    .filter((badge): badge is Badge => Boolean(badge));

  const photos = buildPhotos(restaurant);
  const gallery = photos.map((photo) => photo.url);
  const offer = buildOffer(restaurant);

  return {
    id: restaurant.slug,
    slug: restaurant.slug,
    name: restaurant.name,
    category: restaurant.category,
    cuisineType: restaurant.cuisine_type,
    description: restaurant.description,
    image: restaurant.main_image_url ?? gallery[0] ?? "",
    gallery,
    photos,
    rating: restaurant.rating,
    reviewsCount: restaurant.reviews_count,
    detailedRating: buildDetailedRating(restaurant.rating),
    distanceKm: restaurant.distance_km ?? 0,
    latitude: restaurant.latitude ?? undefined,
    longitude: restaurant.longitude ?? undefined,
    price: restaurant.price_label,
    priceLevel: restaurant.price_level as 1 | 2 | 3,
    open: restaurant.is_open,
    hours: restaurant.hours_summary ?? "Horaires non renseignés",
    openingHours: buildOpeningHours(restaurant),
    tags,
    badges,
    address: `${restaurant.address}, ${restaurant.city}`,
    city: restaurant.city,
    phone: restaurant.phone ?? "",
    reviews: [],
    isNew: restaurant.is_new,
    hasOffer: Boolean(offer),
    offer,
    localFoodMatchScore: restaurant.localfood_match_score,
    menuUrl: restaurant.menu_url ?? "",
    googleMapsUrl: restaurant.google_maps_url ?? "",
    wazeUrl: restaurant.waze_url ?? "",

    hasParking: tags.includes("Parking"),
    hasTerrace: tags.includes("Terrasse"),
    isHalal: tags.includes("Halal"),
    isVeganFriendly: tags.includes("Vegan"),
    isChildFriendly: tags.includes("Enfant"),
    hasDelivery: tags.includes("Livraison"),
    hasTakeaway: tags.includes("À emporter"),
    isCheap: tags.includes("Pas cher"),
    isDateNight: tags.includes("Date night"),
    isSnack: tags.includes("Snack"),
    isBrunch: tags.includes("Brunch"),
    isDessert: tags.includes("Dessert"),

    stats: {
      views: 0,
      googleMaps: 0,
      waze: 0,
      calls: 0,
      menu: 0,
      going: 0,
      reviewsReceived: 0,
      photosAdded: 0,
      aiClicks: 0,
      aiAppearances: 0,
    },
  };
}

export function mapSupabaseRestaurantsToRestaurants(
  restaurants: SupabaseRestaurantListItem[],
): Restaurant[] {
  return restaurants.map(mapSupabaseRestaurantToRestaurant);
}
