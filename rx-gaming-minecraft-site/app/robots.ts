import { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/cart", "/store/success"] }, sitemap: new URL("/sitemap.xml", siteUrl).href };
}
