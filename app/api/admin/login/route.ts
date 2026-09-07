import { NextResponse } from "next/server";
import { verifyPassphrase, signSession, cookieValue } from "@/lib/site";

export const dynamic = "force-dynamic";

// naive per-IP rate limit: 5 attempts / 15 min
const attempts = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  if (list.length >= 5) {
    attempts.set(ip, list);
    return true;
  }
  list.push(now);
  attempts.set(ip, list);
  return false;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: { passphrase?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  if (!body.passphrase || !verifyPassphrase(body.passphrase)) {
    return NextResponse.json({ ok: false, error: "Invalid access key" }, { status: 401 });
  }

  const secure = request.headers.get("x-forwarded-proto") === "https";
  const token = signSession();
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", cookieValue(token, secure));
  return res;
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "use POST" }, { status: 405 });
}
