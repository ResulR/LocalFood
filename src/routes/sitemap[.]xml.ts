import { createFileRoute } from "@tanstack/react-router";

type ApiRestaurantListItem = {
  slug: string;
  is_active?: boolean;
};

type ApiRestaurantsResponse = {
  ok?: boolean;
  data?: ApiRestaurantListItem[];
};

const STATIC_PATHS = [
  "/",
  "/restaurants",
  "/ai-assistant",
  "/for-restaurants",
  "/legal/mentions-legales",
  "/legal/confidentialite",
  "/legal/cgu",
  "/legal/cgv",
  "/legal/cookies",
];

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeOrigin(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

async function fetchActiveRestaurantSlugs(origin: string) {
  const response = await fetch(`${origin}/api/public/restaurants`);

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json().catch(() => null)) as ApiRestaurantsResponse | null;

  if (!payload?.ok || !Array.isArray(payload.data)) {
    return [];
  }

  return payload.data
    .filter((restaurant) => restaurant.slug && restaurant.is_active !== false)
    .map((restaurant) => restaurant.slug);
}

function sitemapUrl(path: string, origin: string, priority: string, changefreq: string) {
  return `  <url>
    <loc>${escapeXml(`${origin}${path}`)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = normalizeOrigin(request);
        const restaurantSlugs = await fetchActiveRestaurantSlugs(origin);

        const urls = [
          ...STATIC_PATHS.map((path) =>
            sitemapUrl(path, origin, path === "/" ? "1.0" : "0.8", "weekly"),
          ),
          ...restaurantSlugs.map((slug) =>
            sitemapUrl(`/restaurants/${encodeURIComponent(slug)}`, origin, "0.7", "weekly"),
          ),
        ];

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

        return new Response(sitemap, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
