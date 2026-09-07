import { NextResponse } from "next/server";
import { noindex } from "@/lib/admin-guard";
import { setPassphrase, verifyPassphrase, needsPassphraseSetup } from "@/lib/site";

export const dynamic = "force-dynamic";

function getToken(request: Request): string | null {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "ishd_admin") return rest.join("=");
  }
  return null;
}

export async function GET() {
  // First-run detection for the admin console: is a passphrase set yet?
  return noindex(NextResponse.json({ ok: true, needsSetup: needsPassphraseSetup() }));
}

export async function POST(request: Request) {
  // Two allowed flows, nothing else:
  //   1. First-run bootstrap: no passphrase exists yet -> anyone may set it
  //      (fresh clone has no admin; this is the "create your admin" step).
  //   2. Change passphrase: a VALID admin session is required AND the current
  //      passphrase must be supplied (re-auth for a credential change).
  let body: { passphrase?: string; current?: string } = {};
  try {
    body = await request.json();
  } catch {
    return noindex(NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 }));
  }

  const passphrase = body.passphrase;
  if (!passphrase || passphrase.length < 8 || passphrase.length > 256) {
    return noindex(
      NextResponse.json({ ok: false, error: "Passphrase must be 8–256 characters" }, { status: 400 })
    );
  }

  if (needsPassphraseSetup()) {
    // First-run: nothing to verify against; allow creation.
    setPassphrase(passphrase);
    return noindex(NextResponse.json({ ok: true, needsSetup: false, msg: "Admin passphrase created." }));
  }

  // Change flow: must present a live admin cookie AND prove current passphrase.
  const token = getToken(request);
  if (!token) {
    return noindex(NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }));
  }
  if (!body.current || !verifyPassphrase(body.current)) {
    return noindex(
      NextResponse.json({ ok: false, error: "Current passphrase is incorrect" }, { status: 401 })
    );
  }
  setPassphrase(passphrase);
  return noindex(NextResponse.json({ ok: true, msg: "Admin passphrase updated." }));
}
