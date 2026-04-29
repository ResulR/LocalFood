import { createFileRoute } from "@tanstack/react-router";
import { OffersView } from "@/components/admin/OffersView";

export const Route = createFileRoute("/restaurant-dashboard/offres")({
  component: OffersView,
});
