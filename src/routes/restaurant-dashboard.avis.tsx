import { createFileRoute } from "@tanstack/react-router";
import { ReviewsView } from "@/components/admin/ReviewsView";

export const Route = createFileRoute("/restaurant-dashboard/avis")({
  component: ReviewsView,
});
