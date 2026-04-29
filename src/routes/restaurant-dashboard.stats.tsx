import { createFileRoute } from "@tanstack/react-router";
import { StatsView } from "@/components/admin/StatsView";

export const Route = createFileRoute("/restaurant-dashboard/stats")({
  component: StatsView,
});
