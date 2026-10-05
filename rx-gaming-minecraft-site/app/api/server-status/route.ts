import { NextResponse } from "next/server";
import { realms } from "@/lib/realms";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Status = { online: boolean | null; playersOnline?: number; maxPlayers?: number };
const cache = new Map<string, { expires: number; promise: Promise<Status> }>();
async function queryStatus(host: string, port: number): Promise<Status> {
  try {
    const response = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(`${host}:${port}`)}`, {
      headers: { "User-Agent": "RX-Gaming website server status (site.rx-gaming.online)" },
      cache: "no-store", signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { online: null };
    const data = await response.json();
    if (data.online === false) return { online: false };
    if (data.online !== true || !data.players || !Number.isSafeInteger(data.players.online) || data.players.online < 0 || !Number.isSafeInteger(data.players.max) || data.players.max < 0) return { online: null };
    return { online: true, playersOnline: data.players.online, maxPlayers: data.players.max };
  } catch { return { online: null }; }
}
export async function GET(request: Request) {
  const realm = realms.find(realm => realm.id === new URL(request.url).searchParams.get("server"));
  if (!realm) return NextResponse.json({ error: "Unknown server." }, { status: 400 });
  let entry = cache.get(realm.id);
  if (!entry || entry.expires < Date.now()) {
    entry = { expires: Date.now() + 30000, promise: queryStatus(realm.host, realm.port) };
    cache.set(realm.id, entry);
  }
  return NextResponse.json(await entry.promise, { headers: { "Cache-Control": "public, max-age=15" } });
}
