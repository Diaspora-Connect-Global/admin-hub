/**
 * Saves text the page already holds (e.g. an export the server returned inline)
 * as a file. The object URL is released on the next tick, after the browser has
 * started the download.
 */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * A file-name-safe slug built from a human name ("Accra Diaspora Hub" →
 * "accra-diaspora-hub"). Used instead of a server-suggested file name, which may
 * embed the record's id — and a download bar is somewhere a person reads it.
 */
export function fileNameSlug(name: string, fallback: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || fallback;
}
