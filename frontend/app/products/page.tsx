"use client";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  sku: string;
  name: string;
  price: number;
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_PRODUCT_API || "/api";
    fetch(`${apiBase}/products`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Products</h1>
      {loading && <p className="mt-4">Loading…</p>}
      {error && <p className="mt-4 text-red-600">Error: {error}</p>}
      {!loading && !error && (
        <ul className="mt-4 space-y-2">
          {items.map((p) => (
            <li key={p.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-gray-600">SKU: {p.sku}</div>
              </div>
              <div className="font-mono">${p.price.toFixed(2)}</div>
            </li>
          ))}
          {items.length === 0 && <li className="text-gray-600">No products found.</li>}
        </ul>
      )}
    </main>
  );
}