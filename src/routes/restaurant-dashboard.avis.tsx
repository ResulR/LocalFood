import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/restaurant-dashboard/avis")({
  beforeLoad: () => {
    throw redirect({
      to: "/restaurant-dashboard/reviews",
    });
  },
});
