import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/restaurant-dashboard/fiche")({
  beforeLoad: () => {
    throw redirect({
      to: "/restaurant-dashboard/profile",
    });
  },
});
