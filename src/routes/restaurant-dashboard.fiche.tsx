import { createFileRoute } from "@tanstack/react-router";
import { ProfileEditor } from "@/components/admin/ProfileEditor";

export const Route = createFileRoute("/restaurant-dashboard/fiche")({
  component: ProfileEditor,
});
