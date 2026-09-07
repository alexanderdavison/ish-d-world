"use client";

// Admin console — protected by the ishd_admin cookie set at /api/admin/login.
// Edits a JSON content file on the server; public pages read it at request time,
// so saves appear on the live site immediately (no rebuild).

import { useEffect, useState } from "react";

type Row = [string, string, string];

type Track = {
  id: string;
  title: string;
  subtitle: string;
  kind: "audio" | "youtube";
  href?: string;
  access: "PUBLIC" | "WEB EXCLUSIVE";
};

type Content = {
  version: number;
  updatedAt: string;
  direct: Row[];
  external: Row[];
  tracks: Track[];
  dispatchLinks: Row[];
  demos: { number: string; title: string; status: string; note: string }[];
  releases: { title: string; meta: string; body: string; href: string; action: string }[];
};

async function api(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  return res.json();
}

function LinkRows({
  title,
  rows,
  onChange,
}: {
  title: string;
  rows: Row[];
  onChange: (rows: Row[]) => void;
}) {
  function set(i: number, j: number, v: string) {
    const next = rows.map((r, idx) => (idx === i ? ([r[0], r[1], r[2]].map((x, k) => (k === j ? v : x)) as Row) : r));
    onChange(next);
  }
  return (
    <fieldset className="admin-fieldset">
      <legend>{title}</legend>
      {rows.map((row, i) => (
        <div className="admin-row" key={i}>
          <input value={row[0]} placeholder="GROUP" onChange={(e) => set(i, 0, e.target.value)} />
          <input value={row[1]} placeholder="LABEL" onChange={(e) => set(i, 1, e.target.value)} />
          <input value={row[2]} placeholder="URL / mailto:" onChange={(e) => set(i, 2, e.target.value)} />
        </div>
      ))}
      <button
        type="button"
        className="admin-mini"
        onClick={() => onChange([...rows, ["GROUP", "LABEL", "https://"]] as Row[])}
      >
        + add row
      </button>
    </fieldset>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [pass, setPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [maint, setMaint] = useState(false);
  const [content, setContent] = useState<Content | null>(null);
  const [dirty, setDirty] = useState(false);

  async function load() {
    const d = await api("/api/admin");
    if (d.ok) {
      setAuthed(true);
      setMaint(d.maintenance);
      setContent(d.content);
    } else {
      setAuthed(false);
    }
  }

  useEffect(() => {
    // First-run detection: is there an admin passphrase yet?
    void api("/api/admin/passphrase").then((d) => setNeedsSetup(Boolean(d?.needsSetup)));
    void load();
  }, []);

  async function doSetup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const d = await api("/api/admin/passphrase", { method: "POST", body: JSON.stringify({ passphrase: newPass }) });
    setBusy(false);
    setMsg(d.ok ? (d.msg || "Passphrase created — sign in below.") : d.error || "Failed");
    if (d.ok) {
      setNeedsSetup(false);
      setNewPass("");
      setPass("");
    }
  }

  async function doChangePassphrase(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPass || !newPass) return;
    setBusy(true);
    const d = await api("/api/admin/passphrase", {
      method: "POST",
      body: JSON.stringify({ passphrase: newPass, current: currentPass }),
    });
    setBusy(false);
    setMsg(d.ok ? (d.msg || "Passphrase updated.") : d.error || "Failed");
    if (d.ok) {
      setCurrentPass("");
      setNewPass("");
    }
  }

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const d = await api("/api/admin/login", { method: "POST", body: JSON.stringify({ passphrase: pass }) });
    setBusy(false);
    if (d.ok) {
      setMsg("Signed in.");
      await load();
    } else {
      setMsg(d.error || "Login failed");
    }
  }

  async function doSave() {
    if (!content) return;
    setBusy(true);
    const d = await api("/api/admin", { method: "POST", body: JSON.stringify({ action: "save", content }) });
    setBusy(false);
    setMsg(d.ok ? "Saved — live now." : d.error || "Save failed");
    if (d.ok) setDirty(false);
  }

  async function toggleMaintenance(on: boolean) {
    setBusy(true);
    const d = await api("/api/admin", { method: "POST", body: JSON.stringify({ action: "maintenance", on }) });
    setBusy(false);
    if (d.ok) {
      setMaint(d.maintenance);
      setMsg(on ? "ROUTE IN PROGRESS — site is parked." : "Site is live.");
    } else {
      setMsg(d.error || "Failed");
    }
  }

  async function doLogout() {
    await api("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setPass("");
  }

  if (authed === null) {
    return <div className="admin-root"><p className="admin-note">CHECKING SESSION…</p></div>;
  }

  if (!authed) {
    return (
      <div className="admin-root">
        <h1 className="admin-title">ISH D — ADMIN TERMINAL</h1>
        {needsSetup ? (
          <>
            <p className="admin-note">First run — no admin passphrase exists yet. Create one to secure this terminal.</p>
            <form className="admin-login" onSubmit={doSetup}>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="NEW ACCESS KEY (min 8 chars)"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
              <button type="submit" disabled={busy}>{busy ? "CREATING…" : "CREATE"}</button>
            </form>
          </>
        ) : (
          <>
            <p className="admin-note">Restricted station. Enter the access key to edit the signal map.</p>
            <form className="admin-login" onSubmit={doLogin}>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="ACCESS KEY"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
              <button type="submit" disabled={busy}>{busy ? "CHECKING…" : "ENTER"}</button>
            </form>
          </>
        )}
        {msg && <p className="admin-note">{msg}</p>}
      </div>
    );
  }

  if (!content) return <div className="admin-root"><p className="admin-note">LOADING…</p></div>;

  return (
    <div className="admin-root">
      <header className="admin-head">
        <h1 className="admin-title">ISH D — ADMIN TERMINAL</h1>
        <div>
          <button className="admin-mini" onClick={doLogout}>SIGN OUT</button>
        </div>
      </header>

      <section className="admin-card">
        <h2>SITE STATE</h2>
        <div className="admin-row">
          <span>{maint ? "MAINTENANCE: ON (ROUTE IN PROGRESS)" : "MAINTENANCE: OFF (SITE LIVE)"}</span>
          <button className="admin-mini" onClick={() => toggleMaintenance(!maint)} disabled={busy}>
            {maint ? "BRING SITE LIVE" : "PARK SITE (ROUTE IN PROGRESS)"}
          </button>
        </div>
        <p className="admin-note">Park is enforced by the nginx front proxy (flag file /var/lib/ishd-world/.maintenance); /admin and /api stay reachable while parked.</p>
        <p className="admin-note">Last saved: {new Date(content.updatedAt).toLocaleString()}</p>
      </section>

      <section className="admin-card">
        <h2>CHANGE ACCESS KEY</h2>
        <form onSubmit={doChangePassphrase}>
          <div className="admin-row">
            <input
              type="password"
              autoComplete="current-password"
              placeholder="CURRENT KEY"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="NEW KEY (min 8 chars)"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <button type="submit" disabled={busy || !currentPass || !newPass}>UPDATE KEY</button>
          </div>
        </form>
        <p className="admin-note">Changing the key keeps current sessions valid for up to 12h (cookie TTL).</p>
      </section>

      <section className="admin-card">
        <h2>CONTACT POINTS — DIRECT</h2>
        <LinkRows title="direct" rows={content.direct} onChange={(rows) => { setContent({ ...content, direct: rows }); setDirty(true); }} />
      </section>

      <section className="admin-card">
        <h2>CONTACT POINTS — PLATFORMS</h2>
        <LinkRows title="external" rows={content.external} onChange={(rows) => { setContent({ ...content, external: rows }); setDirty(true); }} />
      </section>

      <section className="admin-card">
        <h2>CLUB DISPATCH — TRACKS</h2>
        {content.tracks.map((t, i) => (
          <div className="admin-row" key={t.id || i}>
            <input value={t.title} placeholder="TITLE" onChange={(e) => {
              const tracks = content.tracks.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x));
              setContent({ ...content, tracks }); setDirty(true);
            }} />
            <input value={t.subtitle} placeholder="SUBTITLE" onChange={(e) => {
              const tracks = content.tracks.map((x, idx) => (idx === i ? { ...x, subtitle: e.target.value } : x));
              setContent({ ...content, tracks }); setDirty(true);
            }} />
            <select value={t.kind} onChange={(e) => {
              const tracks = content.tracks.map((x, idx) => (idx === i ? { ...x, kind: e.target.value as Track["kind"] } : x));
              setContent({ ...content, tracks }); setDirty(true);
            }}>
              <option value="audio">audio</option>
              <option value="youtube">youtube</option>
            </select>
            <input value={t.href || ""} placeholder="YT URL (if youtube)" onChange={(e) => {
              const tracks = content.tracks.map((x, idx) => (idx === i ? { ...x, href: e.target.value } : x));
              setContent({ ...content, tracks }); setDirty(true);
            }} />
          </div>
        ))}
        <button type="button" className="admin-mini" onClick={() => {
          setContent({ ...content, tracks: [...content.tracks, { id: `t-${Date.now()}`, title: "NEW", subtitle: "", kind: "audio", access: "PUBLIC" }] });
          setDirty(true);
        }}>+ add track</button>
      </section>

      <section className="admin-card">
        <h2>CLUB DISPATCH — LISTEN ELSEWHERE</h2>
        <LinkRows title="dispatch" rows={content.dispatchLinks} onChange={(rows) => { setContent({ ...content, dispatchLinks: rows }); setDirty(true); }} />
      </section>

      <section className="admin-card">
        <h2>THE ROOM — DEMOS</h2>
        {content.demos.map((d, i) => (
          <div className="admin-row" key={d.number}>
            <input value={d.title} placeholder="TITLE" onChange={(e) => {
              const demos = content.demos.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x));
              setContent({ ...content, demos }); setDirty(true);
            }} />
            <input value={d.status} placeholder="STATUS" onChange={(e) => {
              const demos = content.demos.map((x, idx) => (idx === i ? { ...x, status: e.target.value } : x));
              setContent({ ...content, demos }); setDirty(true);
            }} />
            <input value={d.note} placeholder="NOTE" onChange={(e) => {
              const demos = content.demos.map((x, idx) => (idx === i ? { ...x, note: e.target.value } : x));
              setContent({ ...content, demos }); setDirty(true);
            }} />
          </div>
        ))}
      </section>

      <section className="admin-card">
        <h2>TRANSMISSIONS — RELEASES</h2>
        {content.releases.map((r, i) => (
          <div className="admin-block" key={r.title}>
            <input value={r.title} placeholder="TITLE" onChange={(e) => {
              const releases = content.releases.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x));
              setContent({ ...content, releases }); setDirty(true);
            }} />
            <input value={r.meta} placeholder="META (e.g. 02 / EP / 2025)" onChange={(e) => {
              const releases = content.releases.map((x, idx) => (idx === i ? { ...x, meta: e.target.value } : x));
              setContent({ ...content, releases }); setDirty(true);
            }} />
            <input value={r.body} placeholder="BODY" onChange={(e) => {
              const releases = content.releases.map((x, idx) => (idx === i ? { ...x, body: e.target.value } : x));
              setContent({ ...content, releases }); setDirty(true);
            }} />
            <input value={r.href} placeholder="HREF" onChange={(e) => {
              const releases = content.releases.map((x, idx) => (idx === i ? { ...x, href: e.target.value } : x));
              setContent({ ...content, releases }); setDirty(true);
            }} />
            <input value={r.action} placeholder="ACTION LABEL" onChange={(e) => {
              const releases = content.releases.map((x, idx) => (idx === i ? { ...x, action: e.target.value } : x));
              setContent({ ...content, releases }); setDirty(true);
            }} />
          </div>
        ))}
      </section>

      <footer className="admin-foot">
        <button className="admin-save" onClick={doSave} disabled={busy || !dirty}>
          {busy ? "SAVING…" : dirty ? "SAVE CHANGES" : "SAVED ✓"}
        </button>
        {msg && <p className="admin-note">{msg}</p>}
      </footer>

      <style>{`
        .admin-root { max-width: 46rem; margin: 0 auto; padding: 2rem 1.25rem 5rem; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #202524; background: #F1F0E9; min-height: 100vh; }
        .admin-title { font-family: Georgia, serif; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; font-size: 1.25rem; margin: 0 0 .35rem; }
        .admin-note { font-size: .8rem; color: #557A76; }
        .admin-head, .admin-foot { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .admin-login { display: flex; gap: .5rem; margin: 1.25rem 0; }
        .admin-login input, .admin-row input, .admin-block input { flex: 1; min-width: 0; }
        .admin-card { border: 1px solid #A8AFAC; margin: 1rem 0; padding: .9rem; }
        .admin-card h2 { font-size: .7rem; letter-spacing: .14em; text-transform: uppercase; color: #557A76; margin: 0 0 .6rem; }
        .admin-row { display: flex; gap: .4rem; align-items: center; margin: .35rem 0; flex-wrap: wrap; font-size: .8rem; }
        .admin-block { display: grid; gap: .35rem; margin: .5rem 0; }
        input, select { padding: .4rem; border: 1px solid #A8AFAC; background: #fff; color: #202524; font: inherit; font-size: .8rem; }
        button { cursor: pointer; font: inherit; font-size: .75rem; letter-spacing: .08em; padding: .45rem .8rem; border: 1px solid #202524; background: transparent; color: #202524; }
        button:disabled { opacity: .5; cursor: default; }
        .admin-mini { font-size: .7rem; padding: .3rem .55rem; }
        .admin-save { background: #202524; color: #F1F0E9; padding: .7rem 1.4rem; }
        fieldset.admin-fieldset { border: none; padding: 0; margin: 0; }
      `}</style>
    </div>
  );
}
