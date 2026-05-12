import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/restaurant-dashboard/offres")({
  beforeLoad: () => {
    throw redirect({
      to: "/restaurant-dashboard/offers",
    });
  },
});
