// lib/site.ts — file-backed content store + admin auth helpers (server-only)
import { createHmac, randomBytes, timingSafeEqual, scryptSync } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

export const CONTENT_DIR = process.env.ISHD_CONTENT_DIR || "/var/lib/ishd-world";
export const CONTENT_FILE = path.join(CONTENT_DIR, "site.json");
export const MAINTENANCE_FILE = path.join(CONTENT_DIR, ".maintenance");
export const ADMIN_PASS_FILE = path.join(CONTENT_DIR, "admin.pass");
export const ADMIN_SECRET_FILE = path.join(CONTENT_DIR, "admin.secret");

// ---- defaults: the content as it shipped (fallback when site.json absent) ----
const DEFAULTS = {
  version: 1,
  updatedAt: "2026-09-06",
  direct: [
    ["BOOKINGS", "EMAIL", "mailto:ishdonline@gmail.com"],
    ["COLLABORATION", "EMAIL", "mailto:ishdonline@gmail.com"],
    ["GENERAL", "EMAIL", "mailto:ishdonline@gmail.com"],
  ],
  external: [
    ["LISTEN", "SPOTIFY", "https://open.spotify.com/artist/5P6jJ9rSUU5KMnoQDmaPuo"],
    ["LISTEN", "APPLE MUSIC", "https://music.apple.com/us/artist/ish-d/1013408196"],
    ["LISTEN", "BANDCAMP", "https://ishd.bandcamp.com"],
    ["LISTEN", "SOUNDCLOUD", "https://soundcloud.com/ishid"],
    ["WATCH", "YOUTUBE", "https://youtube.com/@ishdofficial"],
    ["FOLLOW", "INSTAGRAM", "https://instagram.com/ishd"],
    ["DATES", "RESIDENT ADVISOR", "https://ra.co/dj/ishd"],
  ],
  dispatchLinks: [
    ["YOUTUBE", "https://youtube.com/@ishdofficial"],
    ["SOUNDCLOUD", "https://soundcloud.com/ishid"],
  ],
  // Club Dispatch nodes — one entry per musical feel. The [code, label, url]
  // shape matches `external`/`direct` so the admin's LinkRows editor handles it
  // with no extra UI, and the label slugifies into the /l/<slug> short link.
  // Read by BOTH /links and the /l/[slug] redirect, so the node list is the one
  // source of truth for a node's destination.
  nodes: [
    ["NODE 01", "GROOVE", "https://open.spotify.com/playlist/2XT4CRdupzz799q6C6uD1W"],
    ["NODE 02", "SOULFUL", "https://open.spotify.com/playlist/43U9SndVIjUy4vLmULMrUN"],
  ],
  demos: [
    { number: "01", title: "NEW HOUSE RECORDS", status: "WRITING", note: "DRUM + ARRANGEMENT PASS" },
    { number: "02", title: "I4D VOL. 2", status: "MIX REVIEW", note: "DISCO EDIT SEQUENCE" },
    { number: "03", title: "UNRELEASED EDITS", status: "PRIVATE PREVIEW", note: "WEBSITE-ONLY TEST PRESS" },
  ],
  releases: [
    { title: "Club Dispatch", meta: "01 / ONGOING", body: "The latest mix from the room.", href: "/media", action: "ENTER CLUB DISPATCH" },
    { title: "Instructional 4 Disco vol. 2", meta: "02 / EP / 2025", body: "Disco pressure, rebuilt for the floor.", href: "https://ishd.bandcamp.com", action: "LISTEN" },
    { title: "Dougie World Cup", meta: "03 / BOOTLEG / 2025", body: "An Ish D edit.", href: "https://ishd.bandcamp.com", action: "LISTEN" },
  ],
};

export type SiteContent = typeof DEFAULTS;

/**
 * Label → /l/<slug> short-link slug.
 *
 * ONE definition, imported by both app/links/page.tsx and app/l/[slug]/route.ts,
 * so the printed short link and the route that serves it can never drift apart.
 */
export function nodeSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ensureContentDir() {
  if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true, mode: 0o755 });
}

/** Read current content; fall back to defaults on any error (missing/corrupt). */
export function readContent(): SiteContent {
  try {
    const raw = readFileSync(CONTENT_FILE, "utf8");
    const parsed = JSON.parse(raw);
    // shallow-merge over defaults so new fields never break old files
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

/** Atomically write content (tmp + rename) and stamp updatedAt. */
export function writeContent(content: Partial<SiteContent>): SiteContent {
  ensureContentDir();
  const next = { ...DEFAULTS, ...content, updatedAt: new Date().toISOString() };
  const tmp = `${CONTENT_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(next, null, 2), { mode: 0o644 });
  rmSync(CONTENT_FILE, { force: true });
  writeFileSync(CONTENT_FILE, JSON.stringify(next, null, 2), { mode: 0o644 });
  rmSync(tmp, { force: true });
  return next;
}

// ---- maintenance park ----
// The park flag at MAINTENANCE_FILE (/var/lib/ishd-world/.maintenance) is the
// SHARED CONTRACT between this app and the nginx front proxy:
//   - nginx is the ENFORCER in production: when the file exists it intercepts
//     public routes and serves the ROUTE IN PROGRESS page (HTTP 200), while
//     /admin, /api/, /assets/ and /ig-stage/ bypass the park so the admin can
//     unpark and the API keeps working.
//   - This app is the CONTROL PLANE: setMaintenance() creates/removes the file
//     (admin console PARK SITE / BRING SITE LIVE), isMaintenanceOn() reports
//     the exact state nginx enforces. The admin API therefore always tells the
//     truth about the live site even though the app itself never renders the
//     park page (nginx answers public traffic before the app sees it).
//   - Direct app access without nginx (dev, `vinext start` on :3000) will NOT
//     self-park — that is intentional; nginx is the single enforcement point.
//   See homelab ops log 2026-09-06/07 and /etc/nginx/sites-enabled/ishdonline.
export function isMaintenanceOn(): boolean {
  return existsSync(MAINTENANCE_FILE);
}

export function setMaintenance(on: boolean) {
  ensureContentDir();
  if (on) {
    if (!existsSync(MAINTENANCE_FILE)) writeFileSync(MAINTENANCE_FILE, new Date().toISOString(), { mode: 0o644 });
  } else {
    rmSync(MAINTENANCE_FILE, { force: true });
  }
  return isMaintenanceOn();
}

/** True when no admin passphrase has ever been set (first-run / fresh clone). */
export function needsPassphraseSetup(): boolean {
  ensureContentDir();
  return !existsSync(ADMIN_PASS_FILE);
}

// ---- admin auth ----
// admin.pass stores a scrypt hash: scrypt$N$r$p$salt$hash (memory-hard, salted).
// admin.secret = random hmac key for session cookies.
function getSecret(): string {
  ensureContentDir();
  if (!existsSync(ADMIN_SECRET_FILE)) {
    writeFileSync(ADMIN_SECRET_FILE, randomBytes(32).toString("hex"), { mode: 0o600 });
  }
  return readFileSync(ADMIN_SECRET_FILE, "utf8").trim();
}

function getPassHash(): string | null {
  ensureContentDir();
  if (!existsSync(ADMIN_PASS_FILE)) return null;
  return readFileSync(ADMIN_PASS_FILE, "utf8").trim();
}

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 }; // OWASP-ish baseline for scrypt

export function setPassphrase(passphrase: string) {
  ensureContentDir();
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(passphrase, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p }).toString("hex");
  writeFileSync(ADMIN_PASS_FILE, `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt}$${hash}`, { mode: 0o600 });
}

export function verifyPassphrase(passphrase: string): boolean {
  const stored = getPassHash();
  if (!stored) return false;
  const parts = stored.split("$");
  // only scrypt format is valid; anything else (incl. legacy bare sha256 hex) fails closed
  if (parts[0] !== "scrypt" || parts.length !== 6) return false;
  const [, N, r, p, salt, hash] = parts;
  const candidate = scryptSync(passphrase, salt, SCRYPT.keylen, {
    N: Number(N), r: Number(r), p: Number(p),
  }).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(candidate, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

const COOKIE_NAME = "ishd_admin";
const TTL_SECONDS = 60 * 60 * 12; // 12h session

export function signSession(): string {
  const secret = getSecret();
  const payload = `${Date.now() + TTL_SECONDS * 1000}:${randomBytes(12).toString("hex")}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifySession(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;
  try {
    const secret = getSecret();
    const expected = createHmac("sha256", secret).update(Buffer.from(payloadB64, "base64url").toString()).digest("hex");
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const payload = Buffer.from(payloadB64, "base64url").toString();
    const exp = Number(payload.split(":")[0]);
    return Number.isFinite(exp) && exp > Date.now();
  } catch {
    return false;
  }
}

export function cookieName() {
  return COOKIE_NAME;
}

export function cookieValue(token: string, secure: boolean) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL_SECONDS}${secure ? "; Secure" : ""}`;
}
