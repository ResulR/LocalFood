import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "al" | "fr";

const translations = {
  en: {
    "common.language": "Language",
    "common.close": "Close",
    "common.reduce": "Minimize",
    "common.send": "Send",
    "common.loading": "Loading...",
    "common.retry": "Try again",
    "common.newSearch": "New search",
    "common.km": "km",

    "nav.home": "Home",
    "nav.restaurants": "Restaurants",
    "nav.aiAssistant": "AI Assistant",
    "nav.forRestaurants": "For restaurants",
    "nav.nearMe": "Near me",
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

    "restaurantCard.addedFavorite": "Added to favorites ❤",
    "restaurantCard.removedFavorite": "Removed from favorites",
    "restaurantCard.favorite": "Favorite",
    "restaurantCard.linkUnavailable": "Link unavailable",
    "restaurantCard.routeOpened": "Opening route",
    "restaurantCard.phoneUnavailable": "Phone number unavailable",
    "restaurantCard.callStarted": "Call started",
    "restaurantCard.open": "Open",
    "restaurantCard.closed": "Closed",
    "restaurantCard.match": "Match",
    "restaurantCard.viewDetails": "View details",
    "restaurantCard.route": "Route",
    "restaurantCard.call": "Call",

    "floatingAi.title": "LocalFood Assistant",
    "floatingAi.subtitle": "Describe what you want, I search active restaurants.",
    "floatingAi.initialTitle": "What do you want to eat?",
    "floatingAi.initialDescription":
      "Example: halal, terrace, parking, brunch, dessert, cheap, open now…",
    "floatingAi.loading": "Searching for the best restaurants…",
    "floatingAi.unavailableTitle": "Assistant unavailable",
    "floatingAi.unavailableFallback": "Assistant temporarily unavailable.",
    "floatingAi.yourRequest": "Your request",
    "floatingAi.noResult": "No active restaurant clearly matches this search.",
    "floatingAi.placeholder": "Ex: cheap terrace brunch…",
    "floatingAi.openFull": "Open full assistant →",
    "floatingAi.openLabel": "Open AI assistant",
    "floatingAi.closeLabel": "Close assistant",

    "aiPage.titleBadge": "LocalFood AI Assistant",
    "aiPage.heroTitle": "Tell us what you feel like eating.",
    "aiPage.heroDescription":
      "Our assistant analyzes your request and suggests LocalFood restaurants that really match your criteria.",
    "aiPage.placeholder": "Ex: a date night restaurant with parking…",
    "aiPage.submit": "Ask",
    "aiPage.loading": "The assistant is analyzing your request…",
    "aiPage.errorTitle": "Assistant temporarily unavailable",
    "aiPage.emptyTitle": "Ask your question to get started",
    "aiPage.emptyDescription":
      "The LocalFood assistant only recommends active restaurants from our database. It filters by your criteria: craving, atmosphere, budget, practical needs.",
    "aiPage.youAsked": "You asked",
    "aiPage.detectedCriteria": "Detected criteria",
    "aiPage.recommendations": "Recommendations",
    "aiPage.noResult": "No active restaurant clearly matches this search right now.",
    "aiPage.unavailableFallback": "Unable to contact the LocalFood assistant.",

    "favorites.loading": "Loading your favorites...",
    "favorites.title": "My favorites",
    "favorites.emptyTitle": "No favorites yet",
    "favorites.emptyDescription":
      "Click the heart on a restaurant to add it to your favorites and find it here.",
    "favorites.discover": "Discover restaurants",
    "favorites.savedSingular": "restaurant saved.",
    "favorites.savedPlural": "restaurants saved.",
    "favorites.noActiveRestaurants": "No active restaurant is available right now.",
    "favorites.loadError": "Unable to load restaurants from the database.",

    "home.badge": "New · local discovery",
    "home.heroTitle": "Find where to eat around you, based on what you want.",
    "home.heroDescription":
      "Restaurants, snacks, brunches, desserts… Compare, choose, and start the route in one click.",
    "home.viewRestaurants": "View restaurants",
    "home.tryAi": "Try the AI assistant",
    "home.popularCravings": "Popular cravings",
    "home.aiBadge": "LocalFood AI Assistant",
    "home.aiTitle": "Describe what you want, we handle the rest.",
    "home.aiDescription":
      "Our assistant analyzes your request and finds restaurants that really match your criteria.",
    "home.aiReady": "The AI assistant is now connected to real LocalFood data.",
    "home.tryAssistant": "Try the assistant",
    "home.categoriesTitle": "Categories",
    "home.categoriesSubtitle": "Explore by craving.",
    "home.noActiveRestaurants": "No active restaurant is available right now.",
    "home.loadError": "Unable to load restaurants from the database.",
    "home.popularTitle": "Popular near you",
    "home.popularSubtitle": "Places loved by the community.",
    "home.openNowTitle": "Open now",
    "home.openNowSubtitle": "Hungry? These places are open.",
    "home.newTitle": "New restaurants",
    "home.newSubtitle": "The latest places to discover.",
    "home.dealsBadge": "Deals",
    "home.dealsTitle": "Trackable LocalFood offers",
    "home.dealsSubtitle": "Code to show at checkout, automatic tracking.",
    "home.howTitle": "In 3 simple steps",
    "home.howSubtitle": "From craving to table in a few seconds.",
    "home.step": "STEP",
    "home.step1Title": "Search by craving",
    "home.step1Desc": "Halal, vegan, brunch, terrace… filter by what really matters to you.",
    "home.step2Title": "Compare restaurants",
    "home.step2Desc": "Ratings, reviews, photos, prices: find the perfect place at a glance.",
    "home.step3Title": "Start the route",
    "home.step3Desc": "Google Maps, Waze, or a phone call: one click is enough.",
    "home.restaurantCtaBadge": "For restaurants",
    "home.restaurantCtaTitle": "Are you a restaurant owner?\nJoin LocalFood.",
    "home.restaurantCtaDesc":
      "Gain local visibility, track your performance, and attract more customers every month.",
    "home.learnMore": "Learn more",
    "home.dashboardDemo": "Dashboard demo",
    "home.viewAll": "View all",
    "home.emptySection": "No restaurant to show in this section right now.",
  },
  al: {
    "common.language": "Gjuha",
    "common.close": "Mbyll",
    "common.reduce": "Minimizo",
    "common.send": "Dërgo",
    "common.loading": "Duke u ngarkuar...",
    "common.retry": "Provo përsëri",
    "common.newSearch": "Kërkim i ri",
    "common.km": "km",

    "nav.home": "Ballina",
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

    "restaurantCard.addedFavorite": "U shtua te të preferuarat ❤",
    "restaurantCard.removedFavorite": "U hoq nga të preferuarat",
    "restaurantCard.favorite": "I preferuar",
    "restaurantCard.linkUnavailable": "Linku nuk është i disponueshëm",
    "restaurantCard.routeOpened": "Hapja e itinerarit",
    "restaurantCard.phoneUnavailable": "Numri nuk është i disponueshëm",
    "restaurantCard.callStarted": "Thirrja u nis",
    "restaurantCard.open": "Hapur",
    "restaurantCard.closed": "Mbyllur",
    "restaurantCard.match": "Përputhje",
    "restaurantCard.viewDetails": "Shiko fichën",
    "restaurantCard.route": "Itinerari",
    "restaurantCard.call": "Telefono",

    "floatingAi.title": "Asistenti LocalFood",
    "floatingAi.subtitle": "Përshkruaj çfarë kërkon, unë kërkoj në restorantet aktive.",
    "floatingAi.initialTitle": "Çfarë dëshiron të hash?",
    "floatingAi.initialDescription":
      "Shembull: halal, terrasë, parking, brunch, ëmbëlsirë, lirë, hapur tani…",
    "floatingAi.loading": "Duke kërkuar restorantet më të mira…",
    "floatingAi.unavailableTitle": "Asistenti nuk është i disponueshëm",
    "floatingAi.unavailableFallback": "Asistenti përkohësisht nuk është i disponueshëm.",
    "floatingAi.yourRequest": "Kërkesa jote",
    "floatingAi.noResult": "Asnjë restorant aktiv nuk përputhet qartë me këtë kërkim.",
    "floatingAi.placeholder": "P.sh.: brunch terrasë lirë…",
    "floatingAi.openFull": "Hap asistentin e plotë →",
    "floatingAi.openLabel": "Hap asistentin AI",
    "floatingAi.closeLabel": "Mbyll asistentin",

    "aiPage.titleBadge": "Asistenti AI LocalFood",
    "aiPage.heroTitle": "Na thuaj çfarë dëshiron të hash.",
    "aiPage.heroDescription":
      "Asistenti analizon kërkesën dhe propozon restorante LocalFood që përputhen vërtet me kriteret e tua.",
    "aiPage.placeholder": "P.sh.: një restorant për takim me parking…",
    "aiPage.submit": "Pyet",
    "aiPage.loading": "Asistenti po analizon kërkesën tënde…",
    "aiPage.errorTitle": "Asistenti përkohësisht nuk është i disponueshëm",
    "aiPage.emptyTitle": "Bëj një pyetje për të filluar",
    "aiPage.emptyDescription":
      "Asistenti LocalFood rekomandon vetëm restorante aktive nga baza jonë. Ai filtron sipas kritereve: dëshirë, atmosferë, buxhet, nevoja praktike.",
    "aiPage.youAsked": "Ke kërkuar",
    "aiPage.detectedCriteria": "Kritere të zbuluara",
    "aiPage.recommendations": "Rekomandime",
    "aiPage.noResult": "Asnjë restorant aktiv nuk përputhet qartë me këtë kërkim për momentin.",
    "aiPage.unavailableFallback": "Nuk mund të kontaktohet asistenti LocalFood.",

    "favorites.loading": "Duke ngarkuar të preferuarat...",
    "favorites.title": "Të preferuarat e mia",
    "favorites.emptyTitle": "Ende nuk ka të preferuara",
    "favorites.emptyDescription":
      "Kliko zemrën te një restorant për ta shtuar te të preferuarat dhe për ta gjetur këtu.",
    "favorites.discover": "Zbulo restorantet",
    "favorites.savedSingular": "restorant i ruajtur.",
    "favorites.savedPlural": "restorante të ruajtura.",
    "favorites.noActiveRestaurants": "Asnjë restorant aktiv nuk është i disponueshëm për momentin.",
    "favorites.loadError": "Nuk mund të ngarkohen restorantet nga baza e të dhënave.",

    "home.badge": "E re · zbulim lokal",
    "home.heroTitle": "Gjej ku të hash rreth teje, sipas dëshirave të tua.",
    "home.heroDescription":
      "Restorante, snack, brunch, ëmbëlsira… Krahaso, zgjidh dhe hap itinerarin me një klik.",
    "home.viewRestaurants": "Shiko restorantet",
    "home.tryAi": "Provo asistentin AI",
    "home.popularCravings": "Dëshira të njohura",
    "home.aiBadge": "Asistenti AI LocalFood",
    "home.aiTitle": "Përshkruaj çfarë dëshiron, ne merremi me pjesën tjetër.",
    "home.aiDescription":
      "Asistenti analizon kërkesën dhe gjen restorante që përputhen vërtet me kriteret e tua.",
    "home.aiReady": "Asistenti AI tani është i lidhur me të dhënat reale të LocalFood.",
    "home.tryAssistant": "Provo asistentin",
    "home.categoriesTitle": "Kategoritë",
    "home.categoriesSubtitle": "Eksploro sipas dëshirës.",
    "home.noActiveRestaurants": "Asnjë restorant aktiv nuk është i disponueshëm për momentin.",
    "home.loadError": "Nuk mund të ngarkohen restorantet nga baza e të dhënave.",
    "home.popularTitle": "Të njohura pranë teje",
    "home.popularSubtitle": "Adresat e pëlqyera nga komuniteti.",
    "home.openNowTitle": "Hapur tani",
    "home.openNowSubtitle": "Ke uri? Këto adresa janë hapur.",
    "home.newTitle": "Restorante të reja",
    "home.newSubtitle": "Adresat më të reja për t'u zbuluar.",
    "home.dealsBadge": "Oferta",
    "home.dealsTitle": "Oferta LocalFood të gjurmueshme",
    "home.dealsSubtitle": "Kod për ta paraqitur në arkë, ndjekje automatike.",
    "home.howTitle": "Në 3 hapa të thjeshtë",
    "home.howSubtitle": "Nga dëshira te tavolina, në pak sekonda.",
    "home.step": "HAPI",
    "home.step1Title": "Kërko sipas dëshirës",
    "home.step1Desc":
      "Halal, vegan, brunch, terrasë… filtro sipas asaj që ka vërtet rëndësi për ty.",
    "home.step2Title": "Krahaso restorantet",
    "home.step2Desc": "Nota, komente, foto, çmime: gjej vendin perfekt me një shikim.",
    "home.step3Title": "Hap itinerarin",
    "home.step3Desc": "Google Maps, Waze ose një telefonatë: mjafton një klik.",
    "home.restaurantCtaBadge": "Për restorante",
    "home.restaurantCtaTitle": "Je restaurator?\nBashkohu me LocalFood.",
    "home.restaurantCtaDesc":
      "Fito dukshmëri lokale, ndiq performancën dhe tërhiq më shumë klientë çdo muaj.",
    "home.learnMore": "Mëso më shumë",
    "home.dashboardDemo": "Demo dashboard",
    "home.viewAll": "Shiko të gjitha",
    "home.emptySection": "Asnjë restorant për t'u shfaqur në këtë seksion për momentin.",
  },
  fr: {
    "common.language": "Langue",
    "common.close": "Fermer",
    "common.reduce": "Réduire",
    "common.send": "Envoyer",
    "common.loading": "Chargement...",
    "common.retry": "Réessayer",
    "common.newSearch": "Nouvelle recherche",
    "common.km": "km",

    "nav.home": "Accueil",
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

    "restaurantCard.addedFavorite": "Ajouté aux favoris ❤",
    "restaurantCard.removedFavorite": "Retiré des favoris",
    "restaurantCard.favorite": "Favori",
    "restaurantCard.linkUnavailable": "Lien indisponible",
    "restaurantCard.routeOpened": "Ouverture de l'itinéraire",
    "restaurantCard.phoneUnavailable": "Numéro indisponible",
    "restaurantCard.callStarted": "Appel lancé",
    "restaurantCard.open": "Ouvert",
    "restaurantCard.closed": "Fermé",
    "restaurantCard.match": "Match",
    "restaurantCard.viewDetails": "Voir la fiche",
    "restaurantCard.route": "Itinéraire",
    "restaurantCard.call": "Appeler",

    "floatingAi.title": "Assistant LocalFood",
    "floatingAi.subtitle": "Décris ton envie, je cherche dans les restaurants actifs.",
    "floatingAi.initialTitle": "Que veux-tu manger ?",
    "floatingAi.initialDescription":
      "Exemple : halal, terrasse, parking, brunch, dessert, pas cher, ouvert maintenant…",
    "floatingAi.loading": "Recherche des meilleurs restaurants…",
    "floatingAi.unavailableTitle": "Assistant indisponible",
    "floatingAi.unavailableFallback": "Assistant temporairement indisponible.",
    "floatingAi.yourRequest": "Ta demande",
    "floatingAi.noResult": "Aucun restaurant actif ne correspond clairement à cette recherche.",
    "floatingAi.placeholder": "Ex : brunch terrasse pas cher…",
    "floatingAi.openFull": "Ouvrir l'assistant complet →",
    "floatingAi.openLabel": "Ouvrir l'assistant IA",
    "floatingAi.closeLabel": "Fermer l'assistant",

    "aiPage.titleBadge": "Assistant IA LocalFood",
    "aiPage.heroTitle": "Dites-nous ce dont vous avez envie.",
    "aiPage.heroDescription":
      "Notre assistant analyse votre requête et vous propose les restaurants LocalFood qui correspondent vraiment à vos critères.",
    "aiPage.placeholder": "Ex : un resto date night avec parking…",
    "aiPage.submit": "Demander",
    "aiPage.loading": "L'assistant analyse votre requête…",
    "aiPage.errorTitle": "Assistant temporairement indisponible",
    "aiPage.emptyTitle": "Posez votre question pour commencer",
    "aiPage.emptyDescription":
      "L'assistant LocalFood ne recommande que les restaurants actifs de notre base. Il filtre selon vos critères : envie, ambiance, budget, contraintes pratiques.",
    "aiPage.youAsked": "Vous avez demandé",
    "aiPage.detectedCriteria": "Critères détectés",
    "aiPage.recommendations": "Recommandations",
    "aiPage.noResult":
      "Aucun restaurant actif ne correspond clairement à cette recherche pour le moment.",
    "aiPage.unavailableFallback": "Impossible de contacter l'assistant LocalFood.",

    "favorites.loading": "Chargement de vos favoris...",
    "favorites.title": "Mes favoris",
    "favorites.emptyTitle": "Aucun favori pour le moment",
    "favorites.emptyDescription":
      "Cliquez sur le cœur d'un restaurant pour l'ajouter à vos favoris et le retrouver ici.",
    "favorites.discover": "Découvrir les restaurants",
    "favorites.savedSingular": "restaurant enregistré.",
    "favorites.savedPlural": "restaurants enregistrés.",
    "favorites.noActiveRestaurants": "Aucun restaurant actif n’est disponible pour le moment.",
    "favorites.loadError": "Impossible de charger les restaurants depuis la base de données.",

    "home.badge": "Nouveau · découverte locale",
    "home.heroTitle": "Trouvez où manger autour de vous selon vos envies.",
    "home.heroDescription":
      "Restaurants, snacks, brunchs, desserts… Comparez, choisissez, et lancez l'itinéraire en un clic.",
    "home.viewRestaurants": "Voir les restaurants",
    "home.tryAi": "Essayer l'assistant IA",
    "home.popularCravings": "Envies populaires",
    "home.aiBadge": "Assistant IA LocalFood",
    "home.aiTitle": "Décrivez votre envie, on s'occupe du reste.",
    "home.aiDescription":
      "Notre assistant analyse votre requête et trouve les restaurants qui correspondent vraiment à vos critères.",
    "home.aiReady": "L’assistant IA est maintenant branché sur les données réelles LocalFood.",
    "home.tryAssistant": "Essayer l'assistant",
    "home.categoriesTitle": "Catégories",
    "home.categoriesSubtitle": "Explorez par envie.",
    "home.noActiveRestaurants": "Aucun restaurant actif n’est disponible pour le moment.",
    "home.loadError": "Impossible de charger les restaurants depuis la base de données.",
    "home.popularTitle": "Populaires près de vous",
    "home.popularSubtitle": "Les adresses adorées par la communauté.",
    "home.openNowTitle": "Ouverts maintenant",
    "home.openNowSubtitle": "Vous avez faim ? Ces adresses sont ouvertes.",
    "home.newTitle": "Nouveaux restaurants",
    "home.newSubtitle": "Les dernières adresses à découvrir.",
    "home.dealsBadge": "Bons plans",
    "home.dealsTitle": "Offres traçables LocalFood",
    "home.dealsSubtitle": "Code à présenter en caisse, suivi automatique.",
    "home.howTitle": "En 3 étapes simples",
    "home.howSubtitle": "Du craving à la table, en quelques secondes.",
    "home.step": "ÉTAPE",
    "home.step1Title": "Cherchez selon vos envies",
    "home.step1Desc":
      "Halal, vegan, brunch, terrasse… filtrez selon ce qui compte vraiment pour vous.",
    "home.step2Title": "Comparez les restaurants",
    "home.step2Desc": "Notes, avis, photos, prix : trouvez l'endroit parfait en un coup d'œil.",
    "home.step3Title": "Lancez l'itinéraire",
    "home.step3Desc": "Google Maps, Waze, ou un coup de fil : un clic suffit pour y aller.",
    "home.restaurantCtaBadge": "Pour les restaurateurs",
    "home.restaurantCtaTitle": "Vous êtes restaurateur ?\nRejoignez LocalFood.",
    "home.restaurantCtaDesc":
      "Gagnez en visibilité locale, suivez vos performances et attirez plus de clients chaque mois.",
    "home.learnMore": "En savoir plus",
    "home.dashboardDemo": "Démo dashboard",
    "home.viewAll": "Voir tout",
    "home.emptySection": "Aucun restaurant à afficher dans cette section pour le moment.",
  },
} as const;

type TranslationKey = keyof typeof translations.fr;

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
