import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "al" | "fr";

type TranslationKey =
  | "common.language"
  | "common.close"
  | "nav.home"
  | "nav.restaurants"
  | "nav.aiAssistant"
  | "nav.forRestaurants"
  | "nav.nearMe"
  | "nav.favorites"
  | "nav.proSpace"
  | "nav.menu"
  | "footer.tagline"
  | "footer.discover"
  | "footer.pro"
  | "footer.about"
  | "footer.partner"
  | "footer.dashboard"
  | "footer.concept"
  | "footer.contact"
  | "footer.legal"
  | "footer.favorites"
  | "footer.copyright";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const LANGUAGE_STORAGE_KEY = "localfood-language";

const LANGUAGE_LABELS: Record<Language, string> = {
  en: "EN",
  al: "AL",
  fr: "FR",
};

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    "common.language": "Language",
    "nav.home": "Home",
    "nav.restaurants": "Restaurants",
    "nav.aiAssistant": "AI Assistant",
    "nav.forRestaurants": "For restaurants",
    "nav.nearMe": "Near me",
    "common.close": "Close",
    "nav.favorites": "Favorites",
    "nav.proSpace": "Pro area",
    "nav.menu": "Menu",
    "footer.tagline": "Find the best places to eat around you, based on what you want.",
    "footer.discover": "Discover",
    "footer.pro": "Pro",
    "footer.about": "About",
    "footer.partner": "Become a partner",
    "footer.dashboard": "Dashboard",
    "footer.concept": "Concept",
    "footer.contact": "Contact",
    "footer.legal": "Legal notice",
    "footer.favorites": "My favorites",
    "footer.copyright": "Discover the best places around you",
  },
  al: {
    "common.language": "Gjuha",
    "nav.home": "Ballina",
    "common.close": "Close",
    "nav.restaurants": "Restorantet",
    "nav.aiAssistant": "Asistenti AI",
    "nav.forRestaurants": "Për restorante",
    "nav.nearMe": "Pranë meje",
    "nav.favorites": "Të preferuarat",
    "nav.proSpace": "Hapësira pro",
    "nav.menu": "Menu",
    "footer.tagline": "Gjeni vendet më të mira për të ngrënë rreth jush, sipas dëshirave tuaja.",
    "footer.discover": "Zbulo",
    "footer.pro": "Pro",
    "footer.about": "Rreth nesh",
    "footer.partner": "Bëhu partner",
    "footer.dashboard": "Paneli",
    "footer.concept": "Koncepti",
    "footer.contact": "Kontakti",
    "footer.legal": "Njoftime ligjore",
    "footer.favorites": "Të preferuarat e mia",
    "footer.copyright": "Zbuloni adresat më të mira rreth jush",
  },
  fr: {
    "common.language": "Langue",
    "nav.home": "Accueil",
    "common.close": "Close",
    "nav.restaurants": "Restaurants",
    "nav.aiAssistant": "Assistant IA",
    "nav.forRestaurants": "Pour les restaurateurs",
    "nav.nearMe": "Autour de moi",
    "nav.favorites": "Favoris",
    "nav.proSpace": "Espace pro",
    "nav.menu": "Menu",
    "footer.tagline": "Trouvez les meilleurs endroits où manger autour de vous selon vos envies.",
    "footer.discover": "Découvrir",
    "footer.pro": "Pro",
    "footer.about": "À propos",
    "footer.partner": "Devenir partenaire",
    "footer.dashboard": "Tableau de bord",
    "footer.concept": "Concept",
    "footer.contact": "Contact",
    "footer.legal": "Mentions légales",
    "footer.favorites": "Mes favoris",
    "footer.copyright": "Découvrez les meilleures adresses autour de vous",
  },
};

const I18nContext = createContext<I18nContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "al" || value === "fr";
}

function getInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "fr";
  }

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (isLanguage(savedLanguage)) {
    return savedLanguage;
  }

  return "fr";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      document.documentElement.lang = nextLanguage;
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key) => translations[language][key],
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }

  return context;
}

export function getLanguageLabel(language: Language) {
  return LANGUAGE_LABELS[language];
}

export const AVAILABLE_LANGUAGES: Language[] = ["en", "al", "fr"];
