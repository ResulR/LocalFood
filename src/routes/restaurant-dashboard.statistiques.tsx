import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/restaurant-dashboard/statistiques")({
  beforeLoad: () => {
    throw redirect({
      to: "/restaurant-dashboard/stats",
    });
  },
});
