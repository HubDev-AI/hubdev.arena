function slugifyFileStem(fileName: string) {
  const trimmed = fileName.trim();
  const extensionIndex = trimmed.lastIndexOf(".");
  const hasExtension = extensionIndex > 0;
  const stem = hasExtension ? trimmed.slice(0, extensionIndex) : trimmed;

  const slug = stem
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "demo-asset";
}

function normalizeExtension(fileName: string) {
  const trimmed = fileName.trim();
  const extensionIndex = trimmed.lastIndexOf(".");

  if (extensionIndex <= 0 || extensionIndex === trimmed.length - 1) {
    return "";
  }

  return trimmed.slice(extensionIndex).toLowerCase();
}

export function buildDemoAssetObjectPath(builderId: string, originalFileName: string) {
  const safeStem = slugifyFileStem(originalFileName);
  const extension = normalizeExtension(originalFileName);
  return `${builderId}/${safeStem}${extension}`;
}
