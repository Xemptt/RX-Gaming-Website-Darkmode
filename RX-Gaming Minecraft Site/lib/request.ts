import { isIP } from "node:net";
export class RequestBodyError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export function checkoutOrigin(request: Request): string | null {
  try {
    if (process.env.SITE_URL) return new URL(process.env.SITE_URL).origin;
    const url = new URL(request.url);
    // Next may normalize request.url to localhost in development. The Host
    // header preserves the address actually used by the browser.
    const host = request.headers.get("host") || url.host;
    const publicUrl = new URL(`${url.protocol}//${host}`);
    if (publicUrl.host !== host || publicUrl.username || publicUrl.password) return null;
    return publicUrl.origin;
  } catch { return null; }
}
export async function readJsonBody(request: Request, signal: AbortSignal, limit = 10000) {
  if (Number(request.headers.get("content-length")) > limit) throw new RequestBodyError("Cart is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError("Invalid request.", 400);
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const { value, done } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      length += value.length;
      if (length > limit) { await reader.cancel(); throw new RequestBodyError("Cart is too large.", 413); }
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { throw new RequestBodyError("Invalid request.", 400); }
  } finally { signal.removeEventListener("abort", abort); reader.releaseLock(); }
}
export function clientIp(request: Request): string | null {
  // Vercel overwrites this header. Other hosts must configure a trusted proxy
  // that overwrites (not appends) the selected header and blocks direct access.
  const header = process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : process.env.TEBEX_CLIENT_IP_HEADER;
  if (!header) return null;
  const value = request.headers.get(header)?.trim();
  return value && isIP(value) ? value : null;
}

