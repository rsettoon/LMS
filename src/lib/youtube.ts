// Convert a YouTube watch/share/shorts URL into an embeddable URL.
// Returns null if we can't recognize a video id.
export function getYouTubeEmbedUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    let id = "";

    if (u.hostname === "youtu.be") {
      id = u.pathname.slice(1);
    } else if (u.hostname.replace(/^www\./, "").endsWith("youtube.com")) {
      if (u.pathname === "/watch") {
        id = u.searchParams.get("v") ?? "";
      } else if (
        u.pathname.startsWith("/embed/") ||
        u.pathname.startsWith("/shorts/")
      ) {
        id = u.pathname.split("/")[2] ?? "";
      }
    }

    if (!id) return null;
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return null;
  }
}
