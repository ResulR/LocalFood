import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchSupabaseRestaurantsByCompanyId,
  type SupabaseCompanyRestaurant,
} from "@/lib/restaurants-api";

const STORAGE_KEY = "localfood-dashboard-restaurant-id";

type RestaurantDashboardContextValue = {
  restaurants: SupabaseCompanyRestaurant[];
  selectedRestaurant: SupabaseCompanyRestaurant | null;
  selectedRestaurantId: string | null;
  loadingRestaurants: boolean;
  restaurantMessage: string;
  setSelectedRestaurantId: (restaurantId: string) => void;
  refreshRestaurants: () => Promise<void>;
};

const RestaurantDashboardContext = createContext<RestaurantDashboardContextValue | undefined>(
  undefined,
);

export function RestaurantDashboardProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [restaurants, setRestaurants] = useState<SupabaseCompanyRestaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantIdState] = useState<string | null>(null);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [restaurantMessage, setRestaurantMessage] = useState("");

  const loadRestaurants = useCallback(async () => {
    setLoadingRestaurants(true);
    setRestaurantMessage("");

    if (!profile?.current_company_id) {
      setRestaurants([]);
      setSelectedRestaurantIdState(null);
      setRestaurantMessage("Aucune entreprise n’est liée à votre profil.");
      setLoadingRestaurants(false);
      return;
    }

    const data = await fetchSupabaseRestaurantsByCompanyId(profile.current_company_id);

    setRestaurants(data);

    if (data.length === 0) {
      setSelectedRestaurantIdState(null);
      setRestaurantMessage("Aucun restaurant n’est encore lié à votre entreprise.");
      setLoadingRestaurants(false);
      return;
    }

    const storedRestaurantId = window.localStorage.getItem(STORAGE_KEY);
    const storedRestaurantExists = data.some((restaurant) => restaurant.id === storedRestaurantId);

    const nextRestaurantId = storedRestaurantExists ? storedRestaurantId : data[0].id;

    setSelectedRestaurantIdState(nextRestaurantId);
    window.localStorage.setItem(STORAGE_KEY, nextRestaurantId);
    setLoadingRestaurants(false);
  }, [profile?.current_company_id]);

  useEffect(() => {
    let cancelled = false;

    loadRestaurants().catch((error) => {
      console.error("Failed to load dashboard restaurants:", error);

      if (!cancelled) {
        setRestaurants([]);
        setSelectedRestaurantIdState(null);
        setRestaurantMessage("Impossible de charger les restaurants de votre entreprise.");
        setLoadingRestaurants(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadRestaurants]);

  const setSelectedRestaurantId = useCallback(
    (restaurantId: string) => {
      const exists = restaurants.some((restaurant) => restaurant.id === restaurantId);

      if (!exists) {
        return;
      }

      setSelectedRestaurantIdState(restaurantId);
      window.localStorage.setItem(STORAGE_KEY, restaurantId);
    },
    [restaurants],
  );

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? null,
    [restaurants, selectedRestaurantId],
  );

  const value = useMemo<RestaurantDashboardContextValue>(
    () => ({
      restaurants,
      selectedRestaurant,
      selectedRestaurantId,
      loadingRestaurants,
      restaurantMessage,
      setSelectedRestaurantId,
      refreshRestaurants: loadRestaurants,
    }),
    [
      restaurants,
      selectedRestaurant,
      selectedRestaurantId,
      loadingRestaurants,
      restaurantMessage,
      setSelectedRestaurantId,
      loadRestaurants,
    ],
  );

  return (
    <RestaurantDashboardContext.Provider value={value}>
      {children}
    </RestaurantDashboardContext.Provider>
  );
}

export function useRestaurantDashboard() {
  const context = useContext(RestaurantDashboardContext);

  if (!context) {
    throw new Error("useRestaurantDashboard must be used within RestaurantDashboardProvider");
  }

  return context;
}
