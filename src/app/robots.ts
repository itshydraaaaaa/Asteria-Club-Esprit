import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://asteria-club-esprit.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/apply", "/login", "/signup"],
      disallow: ["/api/", "/dashboard/", "/tasks/", "/attendance/", "/calendar/", "/announcements/", "/departments/", "/members/", "/applications/", "/admin/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
