import { restaurants } from "./restaurants";

export const allOffers = restaurants
  .filter((r) => r.hasOffer && r.offer)
  .map((r) => ({ ...r.offer!, restaurantId: r.id, restaurantName: r.name, image: r.image }));
