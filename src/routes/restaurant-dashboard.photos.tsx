import { createFileRoute } from "@tanstack/react-router";
import { PhotosView } from "@/components/admin/PhotosView";

export const Route = createFileRoute("/restaurant-dashboard/photos")({
  component: PhotosView,
});
