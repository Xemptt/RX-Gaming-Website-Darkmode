import { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/store/main", "/store/insanecraft", "/store/rlcraft", "/insanecraft", "/rlcraft", "/server-details", "/careers", "/changelog", "/voucher", "/documents/1", "/documents/2", "/documents/3", "/documents/4"].map(path => ({ url: new URL(path, siteUrl).href, changeFrequency: "weekly", priority: path === "/" ? 1 : .6 }));
}
