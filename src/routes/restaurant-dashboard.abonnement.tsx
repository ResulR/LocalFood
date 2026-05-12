import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/restaurant-dashboard/abonnement")({
  beforeLoad: () => {
    throw redirect({
      to: "/restaurant-dashboard/subscription",
    });
  },
});
