import "server-only";

export function clientIp(headers: Headers): string | null {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : null;
}

export function json(data: unknown, status = 200, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    status,
    headers: { "Cache-Control": "no-store", ...init?.headers },
  });
}

export function errorJson(code: string, message: string, status: number): Response {
  return json({ error: code, message }, status);
}

/** Reads a JSON body with a size cap; returns null on any parse problem. */
export async function readJson(request: Request, maxBytes = 16_384): Promise<unknown | null> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) return null;
  try {
    const text = await request.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Rejects cross-site browser POSTs to JSON APIs (defence in depth over SameSite cookies). */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients; bot checks still apply
  try {
    return new URL(origin).host === new URL(request.url).host || origin === process.env.SITE_URL;
  } catch {
    return false;
  }
}
