import { NextResponse } from "next/server";
import { verifySession } from "@/lib/site";

export const dynamic = "force-dynamic";

function getToken(request: Request): string | null {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "ishd_admin") return rest.join("=");
  }
  return null;
}

// Every admin/API response: tell crawlers to stay away (defense in depth).
export function noindex(res: NextResponse): NextResponse {
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export function requireAdmin(request: Request): NextResponse | null {
  const token = getToken(request);
  if (!token || !verifySession(token)) {
    return noindex(NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }));
  }
  return null;
}
