import { nodeSlug, readContent } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * /l/<slug> — stable short links for the Club Dispatch nodes.
 *
 * The destination is resolved from the content store on every request and is
 * never baked in, so repointing a node in /admin moves its short link with no
 * rebuild and no deploy. That is the whole point of a node having a short link:
 * the URL you print on a flyer or a QR code keeps working after the playlist
 * behind it changes.
 *
 * Unknown slugs fall back to /links rather than 404-ing — a stale code scanned
 * off printed material should land somewhere useful, not on an error page.
 *
 * 302, not 301/308: the destination is expected to change, and a permanent
 * redirect would be cached by browsers and intermediaries, stranding the link
 * on whatever target it had the first time it was followed.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const wanted = nodeSlug(slug ?? "");
  const node = readContent().nodes.find(
    (entry) => nodeSlug(entry[1]) === wanted && Boolean(entry[2]),
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: node ? node[2] : "/links",
      "Cache-Control": "no-store",
    },
  });
}
