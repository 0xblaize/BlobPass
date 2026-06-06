import { Footer, Header } from "@/components/chrome";
import { MarketplaceCatalog } from "@/components/marketplace/MarketplaceCatalog";
import { getMarketplaceListings } from "@/lib/blobpass/ledger";

type SearchParamValue = string | string[] | undefined;

function normalizeParam(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, SearchParamValue>>;
}) {
  const listings = await getMarketplaceListings();
  const resolvedSearchParams = (searchParams ? await searchParams : {}) as Record<
    string,
    SearchParamValue
  >;
  const initialQuery = normalizeParam(resolvedSearchParams.q);
  const initialCategory = normalizeParam(resolvedSearchParams.category);

  return (
    <>
      <Header active="marketplace" />
      <main className="shell py-16">
        <MarketplaceCatalog
          initialCategory={initialCategory}
          initialListings={listings}
          initialQuery={initialQuery}
        />
      </main>
      <Footer />
    </>
  );
}
