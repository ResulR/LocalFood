import { createFileRoute } from "@tanstack/react-router";
import { SubscriptionView } from "@/components/admin/SubscriptionView";

export const Route = createFileRoute("/restaurant-dashboard/subscription")({
  component: SubscriptionView,
});
