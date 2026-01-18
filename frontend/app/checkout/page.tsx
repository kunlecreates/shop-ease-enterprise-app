'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api-client';

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  });
  
  const [paymentMethod, setPaymentMethod] = useState('mock-payment');

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    } else if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [items.length, isAuthenticated, router]);

  if (items.length === 0 || !isAuthenticated) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const handleSubmitOrder = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        total: getTotal(),
        shippingAddress,
        paymentMethod,
      };

      await ApiClient.post('/orders', orderData);
      clearCart();
      router.push('/orders?success=true');
    } catch (err: any) {
      setError(err.message || 'Failed to process order');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <div className="flex mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              {s}
            </div>
            <div className={`flex-1 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`} />
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Shipping Address</h2>
          <div className="space-y-4">
            <Input
              label="Street Address"
              value={shippingAddress.street}
              onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                required
              />
              <Input
                label="State"
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="ZIP Code"
                value={shippingAddress.zipCode}
                onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                required
              />
              <Input
                label="Country"
                value={shippingAddress.country}
                onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                required
              />
            </div>
          </div>
          <Button onClick={() => setStep(2)} className="mt-6">
            Continue to Payment
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Payment Method</h2>
          <div className="space-y-4">
            <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="mock-payment"
                checked={paymentMethod === 'mock-payment'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-4 h-4"
              />
              <div>
                <div className="font-semibold">Mock Payment (Test Mode)</div>
                <div className="text-sm text-gray-600">For testing purposes only</div>
              </div>
            </label>
          </div>
          <div className="flex space-x-4 mt-6">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Review Order
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Order Review</h2>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <p className="text-gray-700">
                {shippingAddress.street}<br />
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}<br />
                {shippingAddress.country}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Order Items</h3>
              {items.map((item) => (
                <div key={item.id} className="flex justify-between py-2 border-b">
                  <div>
                    <div>{item.product.name}</div>
                    <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                  </div>
                  <div className="font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
              <div className="flex justify-between py-4 text-xl font-bold">
                <span>Total</span>
                <span className="text-blue-600">${getTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleSubmitOrder} isLoading={isProcessing} className="flex-1">
              Place Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
