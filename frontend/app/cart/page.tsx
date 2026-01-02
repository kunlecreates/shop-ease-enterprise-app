"use client";
import React, { useState } from "react";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");

  async function checkout() {
    setStatus("Processing...");
    // Call the order-service checkout endpoint (expects JSON { userId, total })
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, total: 10.0 })
      });
      if (res.ok) {
        setStatus('Order placed');
      } else {
        setStatus('Checkout failed');
      }
    } catch (e) {
      setStatus('Network error');
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Cart (Phase 2 stub)</h1>
      <p>Items: {items.length}</p>
      <button onClick={checkout}>Checkout (mock)</button>
      <p>{status}</p>
    </main>
  );
}
