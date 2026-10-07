import { NextResponse } from "next/server";
import { fetchCatalog } from "@/lib/tebex";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await fetchCatalog();
    return NextResponse.json(
      { onSale: products.some(product => product.isPromo) },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=60" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Current offers are temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
