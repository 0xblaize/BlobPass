import Image from "next/image";

function normalizePreviewUrl(raw: string) {
  if (!raw) return "";
  if (raw.startsWith("/")) return raw;
  try {
    const parsed = new URL(raw);
    if (parsed.pathname.startsWith("/api/walrus/")) {
      return parsed.pathname + parsed.search;
    }
    const walrusMatch = parsed.pathname.match(/\/v1\/blobs\/([^/]+)$/);
    if (walrusMatch) {
      return `/api/walrus/${walrusMatch[1]}`;
    }
    return raw;
  } catch {
    return raw;
  }
}

export function AssetPreview({
  category,
  previewImageUrl,
}: {
  category: string;
  previewImageUrl: string;
}) {
  const src = normalizePreviewUrl(previewImageUrl);
  return (
    <div className="asset-image relative aspect-square w-full overflow-hidden">
      {src ? (
        <Image
          alt=""
          className="absolute inset-0 z-[1] object-cover"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 40vw"
          src={src}
        />
      ) : null}
      <span className="absolute right-3 top-3 z-[2] mono text-[10px] tracking-[0.16em] border border-[var(--ink)] bg-[var(--paper)] px-1.5 py-0.5 text-[var(--ink)]">
        WALRUS
      </span>
      <span className="absolute bottom-3 left-3 z-[2] mono text-[10px] tracking-[0.16em] border border-[var(--ink)] bg-[var(--paper)] px-1.5 py-0.5 text-[var(--ink)]">
        {category.toUpperCase()}
      </span>
    </div>
  );
}
