import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/restaurants")({
  component: RestaurantsLayout,
});

function RestaurantsLayout() {
  return <Outlet />;
}
