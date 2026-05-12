import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/restaurant-dashboard/horaires")({
  beforeLoad: () => {
    throw redirect({
      to: "/restaurant-dashboard/opening-hours",
    });
  },
});
