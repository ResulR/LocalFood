import { createFileRoute } from "@tanstack/react-router";
import { DashboardOverview } from "@/components/admin/DashboardOverview";

export const Route = createFileRoute("/restaurant-dashboard/")({
  component: DashboardOverview,
});
