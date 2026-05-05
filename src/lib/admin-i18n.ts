import { useI18n, type Language } from "@/lib/i18n";

const adminTranslations = {
  en: {
    "admin.common.loading": "Loading...",
    "admin.common.superAdmin": "SuperAdmin",

    "admin.layout.ownerArea": "Restaurant owner area",
    "admin.layout.proArea": "Pro area",
    "admin.layout.overview": "Overview",
    "admin.layout.profile": "My listing",
    "admin.layout.openingHours": "Opening hours",
    "admin.layout.offers": "Offers",
    "admin.layout.statistics": "Statistics",
    "admin.layout.reviews": "Customer reviews",
    "admin.layout.photos": "Photos",
    "admin.layout.backToSite": "Back to site",
    "admin.layout.search": "Search…",
    "admin.layout.chooseRestaurant": "Choose a restaurant",
    "admin.layout.signOut": "Sign out",

    "admin.dashboard.metaTitle": "Restaurant owner area — LocalFood",
    "admin.dashboard.loading": "Loading your area...",
    "admin.dashboard.accessNotConfigured": "Access not configured",
    "admin.dashboard.accessNotConfiguredDescription":
      "Your account exists, but no LocalFood role has been assigned to it yet.",
  },
  al: {
    "admin.common.loading": "Duke u ngarkuar...",
    "admin.common.superAdmin": "SuperAdmin",

    "admin.layout.ownerArea": "Hapësira e restoratorit",
    "admin.layout.proArea": "Hapësira pro",
    "admin.layout.overview": "Përmbledhje",
    "admin.layout.profile": "Ficha ime",
    "admin.layout.openingHours": "Orari",
    "admin.layout.offers": "Oferta",
    "admin.layout.statistics": "Statistika",
    "admin.layout.reviews": "Komente klientësh",
    "admin.layout.photos": "Foto",
    "admin.layout.backToSite": "Kthehu te faqja",
    "admin.layout.search": "Kërko…",
    "admin.layout.chooseRestaurant": "Zgjidh një restorant",
    "admin.layout.signOut": "Dil",

    "admin.dashboard.metaTitle": "Hapësira e restoratorit — LocalFood",
    "admin.dashboard.loading": "Duke u ngarkuar hapësira jote...",
    "admin.dashboard.accessNotConfigured": "Aksesi nuk është konfiguruar",
    "admin.dashboard.accessNotConfiguredDescription":
      "Llogaria jote ekziston, por ende nuk i është caktuar asnjë rol LocalFood.",
  },
  fr: {
    "admin.common.loading": "Chargement...",
    "admin.common.superAdmin": "SuperAdmin",

    "admin.layout.ownerArea": "Espace restaurateur",
    "admin.layout.proArea": "Espace pro",
    "admin.layout.overview": "Vue d’ensemble",
    "admin.layout.profile": "Ma fiche",
    "admin.layout.openingHours": "Horaires",
    "admin.layout.offers": "Offres",
    "admin.layout.statistics": "Statistiques",
    "admin.layout.reviews": "Avis clients",
    "admin.layout.photos": "Photos",
    "admin.layout.backToSite": "Retour au site",
    "admin.layout.search": "Rechercher…",
    "admin.layout.chooseRestaurant": "Choisir un restaurant",
    "admin.layout.signOut": "Se déconnecter",

    "admin.dashboard.metaTitle": "Espace restaurateur — LocalFood",
    "admin.dashboard.loading": "Chargement de votre espace...",
    "admin.dashboard.accessNotConfigured": "Accès non configuré",
    "admin.dashboard.accessNotConfiguredDescription":
      "Votre compte existe, mais aucun rôle LocalFood ne lui est encore associé.",
  },
} as const satisfies Record<Language, Record<string, string>>;

type AdminTranslationKey = keyof typeof adminTranslations.fr;

export function useAdminI18n() {
  const { language } = useI18n();

  return {
    language,
    tAdmin: (key: AdminTranslationKey) => adminTranslations[language][key],
  };
}
