// Données de démonstration pour les statistiques du dashboard restaurateur.
export type InteractionType =
  | "Maps"
  | "Waze"
  | "Appel"
  | "Menu"
  | "Intent"
  | "AI"
  | "Avis"
  | "Offre";

export type Interaction = {
  id: string;
  action: string;
  source: string;
  when: string;
  type: InteractionType;
  restaurant: string;
};

export const interactions: Interaction[] = [
  {
    id: "i1",
    action: "Itinéraire lancé",
    source: "Google Maps",
    when: "Il y a 5 min",
    type: "Maps",
    restaurant: "Maison Zayna",
  },
  {
    id: "i2",
    action: "Appel téléphonique",
    source: "Fiche restaurant",
    when: "Il y a 12 min",
    type: "Appel",
    restaurant: "Maison Zayna",
  },
  {
    id: "i3",
    action: "Clic « J'y vais »",
    source: "Recherche",
    when: "Il y a 24 min",
    type: "Intent",
    restaurant: "Maison Zayna",
  },
  {
    id: "i4",
    action: "Vue depuis assistant IA",
    source: "« date night avec parking »",
    when: "Il y a 36 min",
    type: "AI",
    restaurant: "Maison Zayna",
  },
  {
    id: "i5",
    action: "Avis publié",
    source: "Sarah B.",
    when: "Il y a 1 h",
    type: "Avis",
    restaurant: "Maison Zayna",
  },
  {
    id: "i6",
    action: "Menu consulté",
    source: "Fiche restaurant",
    when: "Il y a 2 h",
    type: "Menu",
    restaurant: "Maison Zayna",
  },
  {
    id: "i7",
    action: "Offre débloquée",
    source: "ZAYNA10",
    when: "Il y a 3 h",
    type: "Offre",
    restaurant: "Maison Zayna",
  },
  {
    id: "i8",
    action: "Itinéraire Waze",
    source: "Fiche restaurant",
    when: "Il y a 4 h",
    type: "Waze",
    restaurant: "Maison Zayna",
  },
  {
    id: "i9",
    action: "Clic depuis assistant IA",
    source: "« halal terrasse »",
    when: "Il y a 5 h",
    type: "AI",
    restaurant: "Maison Zayna",
  },
];

export const topActionsBreakdown = [
  { l: "Voir le menu", v: 421, p: 38 },
  { l: "Itinéraire Maps", v: 342, p: 31 },
  { l: "« J'y vais »", v: 152, p: 14 },
  { l: "Itinéraire Waze", v: 128, p: 12 },
  { l: "Appel", v: 86, p: 5 },
];

export const peakHours = [
  { l: "Vendredi soir", v: "19h–22h" },
  { l: "Samedi midi", v: "12h–14h" },
  { l: "Dimanche brunch", v: "10h–13h" },
  { l: "Mercredi soir", v: "19h–21h" },
];
