import { createFileRoute } from "@tanstack/react-router";
import { OpeningHoursView } from "@/components/admin/OpeningHoursView";

export const Route = createFileRoute("/restaurant-dashboard/opening-hours")({
  component: OpeningHoursView,
});
