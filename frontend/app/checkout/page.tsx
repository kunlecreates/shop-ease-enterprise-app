'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api-client';
import { COUNTRIES, getCountryName } from '@/lib/countries';
import type { ShippingAddress, PaymentMethod } from '@/types';

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    recipient: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'CA',
    phone: '',
  });
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    type: 'CREDIT_CARD',
    last4: '4242',
    brand: 'Visa',
  });

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    } else if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [items.length, isAuthenticated, router]);

  if (items.length === 0 || !isAuthenticated) {
    return <main className="flex justify-center items-center min-h-screen">Loading...</main>;
  }

  const handleSubmitOrder = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const orderData = {
        status: 'PENDING',
        total: getTotal(),
        items: items.map(item => ({
          productRef: String(item.productId),
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        shippingAddress,
        paymentMethod,
      };

      const response = await ApiClient.post<{id: string}>('/order', orderData);
      clearCart();
      setOrderId(response?.id || 'N/A');
      setSuccess('Your order has been placed successfully! You will receive a confirmation email shortly.');
      setStep(4); // Move to success step
    } catch (err: any) {
      console.error('Order submission failed:', err);
      setError(err.message || 'Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {step < 4 && (
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
      )}

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
              label="Recipient Name"
              value={shippingAddress.recipient}
              onChange={(e) => setShippingAddress({ ...shippingAddress, recipient: e.target.value })}
              required
            />
            <Input
              label="Street Address"
              value={shippingAddress.street1}
              onChange={(e) => setShippingAddress({ ...shippingAddress, street1: e.target.value })}
              required
            />
            <Input
              label="Apartment, Suite, etc. (optional)"
              value={shippingAddress.street2}
              onChange={(e) => setShippingAddress({ ...shippingAddress, street2: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                required
              />
              <Input
                label="State/Province"
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="ZIP/Postal Code"
                value={shippingAddress.postalCode}
                onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={shippingAddress.country}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  required
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Input
              label="Phone Number"
              value={shippingAddress.phone}
              onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
              placeholder="+1 234 567 8900"
            />
          </div>
          <Button 
            onClick={() => {
              const isValid = shippingAddress.recipient && 
                              shippingAddress.street1 && 
                              shippingAddress.city && 
                              shippingAddress.state && 
                              shippingAddress.postalCode && 
                              shippingAddress.country;
              if (!isValid) {
                setError('Please fill in all required shipping address fields');
                return;
              }
              setError('');
              setStep(2);
            }} 
            className="mt-6"
          >
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
                value="CREDIT_CARD"
                checked={paymentMethod.type === 'CREDIT_CARD'}
                onChange={(e) => setPaymentMethod({ ...paymentMethod, type: 'CREDIT_CARD' })}
                className="w-4 h-4"
              />
              <div>
                <div className="font-semibold">Credit Card</div>
                <div className="text-sm text-gray-600">Visa, Mastercard, Amex</div>
              </div>
            </label>
            <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="PAYPAL"
                checked={paymentMethod.type === 'PAYPAL'}
                onChange={(e) => setPaymentMethod({ ...paymentMethod, type: 'PAYPAL' })}
                className="w-4 h-4"
              />
              <div>
                <div className="font-semibold">PayPal</div>
                <div className="text-sm text-gray-600">Pay with your PayPal account</div>
              </div>
            </label>
            {paymentMethod.type === 'CREDIT_CARD' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Test Mode - Using mock card</p>
                <p className="text-sm font-mono">Visa •••• {paymentMethod.last4}</p>
              </div>
            )}
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
                {shippingAddress.recipient}<br />
                {shippingAddress.street1}
                {shippingAddress.street2 && <>, {shippingAddress.street2}</>}<br />
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}<br />
                {getCountryName(shippingAddress.country)}
                {shippingAddress.phone && <><br />{shippingAddress.phone}</>}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Payment Method</h3>
              <p className="text-gray-700">
                {paymentMethod.type === 'CREDIT_CARD' ? 'Credit Card' : paymentMethod.type}
                {paymentMethod.last4 && paymentMethod.brand && 
                  ` - ${paymentMethod.brand} ••••${paymentMethod.last4}`
                }
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

      {step === 4 && success && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-600 mr-3 mt-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h3 className="font-semibold text-lg mb-1">Order Placed Successfully!</h3>
                <p className="mb-2">{success}</p>
                {orderId && (
                  <p className="text-sm text-green-700">Order ID: <span className="font-mono font-semibold">#{orderId}</span></p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">What&apos;s Next?</h2>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>You will receive an order confirmation email with details</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>We&apos;ll notify you when your order ships</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Track your order anytime from your orders page</span>
              </li>
            </ul>

            <div className="flex space-x-4">
              <Button onClick={() => router.push('/orders')} className="flex-1">
                View My Orders
              </Button>
              <Button variant="secondary" onClick={() => router.push('/products')} className="flex-1">
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
