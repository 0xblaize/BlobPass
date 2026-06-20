import { NextResponse } from "next/server";
import { getPublicLocalWalrusBlob } from "@/lib/blobpass/walrus";

export const dynamic = "force-dynamic";

const FALLBACK_AGGREGATORS = [
  process.env.WALRUS_AGGREGATOR_URL,
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR,
  "https://aggregator.walrus-testnet.walrus.space",
  "https://walrus-testnet-aggregator.stakely.io",
].filter((value): value is string => Boolean(value && value.length > 0));

const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ blobId: string }> },
) {
  const { blobId } = await params;

  const localResponse = await getPublicLocalWalrusBlob(blobId);
  if (localResponse) {
    const headers = new Headers(localResponse.headers);
    Object.entries(PUBLIC_CACHE_HEADERS).forEach(([key, value]) =>
      headers.set(key, value),
    );
    return new Response(localResponse.body, {
      status: localResponse.status,
      headers,
    });
  }

  for (const aggregator of FALLBACK_AGGREGATORS) {
    try {
      const upstream = await fetch(
        `${aggregator.replace(/\/$/, "")}/v1/blobs/${encodeURIComponent(blobId)}`,
        { signal: AbortSignal.timeout(8_000) },
      );

      if (!upstream.ok) continue;

      const headers = new Headers();
      const contentType = upstream.headers.get("content-type");
      if (contentType) headers.set("Content-Type", contentType);
      const contentLength = upstream.headers.get("content-length");
      if (contentLength) headers.set("Content-Length", contentLength);
      Object.entries(PUBLIC_CACHE_HEADERS).forEach(([key, value]) =>
        headers.set(key, value),
      );

      return new Response(upstream.body, { status: 200, headers });
    } catch {
      // try next aggregator
    }
  }

  return NextResponse.json({ error: "Blob not available" }, { status: 404 });
}
