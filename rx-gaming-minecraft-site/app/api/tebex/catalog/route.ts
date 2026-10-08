import { NextResponse } from "next/server";
import { fetchCatalog, fetchTebexProducts } from "@/lib/tebex";
import { getRealm } from "@/lib/realms";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("realm");
  const realm = slug === null ? null : getRealm(slug);
  if (slug !== null && !realm) return NextResponse.json({ error: "Unknown realm." }, { status: 400 });
  try { return NextResponse.json({ products: realm ? await fetchTebexProducts(realm.mode) : await fetchCatalog(request.signal) }); }
  catch { return NextResponse.json({ error: "We couldn't reach the product catalog. Please try again or use the official store." }, { status: 503 }); }
}

