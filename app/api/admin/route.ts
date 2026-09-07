import { NextResponse } from "next/server";
import { requireAdmin, noindex } from "@/lib/admin-guard";
import { readContent, writeContent, isMaintenanceOn, setMaintenance } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  return noindex(NextResponse.json({ ok: true, maintenance: isMaintenanceOn(), content: readContent() }));
}

export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let body: { action?: string; content?: unknown; on?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    return noindex(NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 }));
  }

  if (body.action === "save" && body.content && typeof body.content === "object") {
    const saved = writeContent(body.content as Parameters<typeof writeContent>[0]);
    return noindex(NextResponse.json({ ok: true, maintenance: isMaintenanceOn(), content: saved }));
  }

  if (body.action === "maintenance" && typeof body.on === "boolean") {
    setMaintenance(body.on);
    return noindex(NextResponse.json({ ok: true, maintenance: isMaintenanceOn() }));
  }

  if (body.action === "set-passphrase" && typeof body.passphrase === "string") {
    // handled in separate endpoint to avoid accidental calls; guarded here too
    return noindex(NextResponse.json({ ok: false, error: "use /api/admin/passphrase" }, { status: 400 }));
  }

  return noindex(NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 }));
}
