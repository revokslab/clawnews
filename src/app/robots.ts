import type { MetadataRoute } from "next";

import { baseUrl } from "@/lib/constants";

const origin = baseUrl.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
