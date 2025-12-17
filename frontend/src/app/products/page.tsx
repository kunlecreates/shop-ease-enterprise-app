export const dynamic = 'force-dynamic';

async function fetchProducts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_PRODUCT_API || '/api/product'}`, {
    // Ensure proxies are used server-side without caching
    cache: 'no-store',
  });
  if (!res.ok) {
    return [] as Array<{ sku: string; name: string; price: number }>;
  }
  return (await res.json()) as Array<{ sku: string; name: string; price: number }>;
}

export default async function ProductsPage() {
  const products = await fetchProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Products</h1>
      <main className="grid gap-4" role="main">
        {products.length === 0 ? (
          <div className="rounded border p-4 text-muted-foreground">No products available.</div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <li key={p.sku} className="rounded border p-4">
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-muted-foreground">SKU: {p.sku}</div>
                <div className="mt-2">${'{'}p.price.toFixed(2){'}'}</div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
