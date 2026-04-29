import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/restaurant-dashboard")({
  head: () => ({ meta: [{ title: "Espace restaurateur — LocalFood" }] }),
  component: AdminLayout,
});
