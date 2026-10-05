import { NextResponse } from "next/server";
import { fetchTebexProducts } from "@/lib/tebex";
import { getRealm } from "@/lib/realms";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const realm = getRealm(new URL(request.url).searchParams.get("realm") || "");
  if (!realm) return NextResponse.json({ error: "Unknown realm." }, { status: 400 });
  try { return NextResponse.json({ products: await fetchTebexProducts(realm.mode) }); }
  catch { return NextResponse.json({ error: "We couldn't reach the product catalog. Please try again or use the official store." }, { status: 503 }); }
}

