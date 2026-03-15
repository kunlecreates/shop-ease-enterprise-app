import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import CheckoutPage from '../app/checkout/page';
import { ApiClient } from '@/lib/api-client';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const pushMock = jest.fn();
const useCartStoreMock = jest.fn();
const useAuthMock = jest.fn();
const clearCartMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/lib/cart-store', () => ({
  useCartStore: () => useCartStoreMock(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

jest.mock('@/lib/api-client', () => ({
  ApiClient: {
    post: jest.fn(),
  },
}));

function flushPromises() {
  return Promise.resolve();
}

function findButton(container: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === label,
  );

  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  return button as HTMLButtonElement;
}

function findInputByLabel(container: HTMLElement, label: string): HTMLInputElement {
  const labels = Array.from(container.querySelectorAll('label'));
  const targetLabel = labels.find((candidate) => candidate.textContent?.includes(label));

  if (!targetLabel) {
    throw new Error(`Label not found: ${label}`);
  }

  const inputId = targetLabel.getAttribute('for');
  if (!inputId) {
    throw new Error(`No htmlFor found for label: ${label}`);
  }

  const input = document.getElementById(inputId);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`Input not found for label: ${label}`);
  }

  return input;
}

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, value);
}

async function click(container: HTMLElement, label: string) {
  await act(async () => {
    findButton(container, label).click();
    await flushPromises();
  });
}

async function changeInput(container: HTMLElement, label: string, value: string) {
  await act(async () => {
    const input = findInputByLabel(container, label);
    setNativeInputValue(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await flushPromises();
  });
}

describe('CheckoutPage', () => {
  let container: HTMLDivElement;
  let root: Root;

  const cartItems = [
    {
      id: '1',
      productId: 101,
      product: { id: 101, sku: 'SKU-101', name: 'Coffee Beans', price: 12.5 },
      quantity: 2,
      price: 12.5,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    useAuthMock.mockReturnValue({ isAuthenticated: true });
    useCartStoreMock.mockReturnValue({
      items: cartItems,
      getTotal: () => 25,
      clearCart: clearCartMock,
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  async function renderPage() {
    await act(async () => {
      root.render(React.createElement(CheckoutPage));
      await flushPromises();
    });
  }

  test('redirects to cart when the checkout starts with an empty cart', async () => {
    useCartStoreMock.mockReturnValue({
      items: [],
      getTotal: () => 0,
      clearCart: clearCartMock,
    });

    await renderPage();

    expect(pushMock).toHaveBeenCalledWith('/cart');
    expect(container.textContent).toContain('Loading...');
  });

  test('blocks the shipping step until required fields are provided', async () => {
    await renderPage();

    await click(container, 'Continue to Payment');
    expect(container.textContent).toContain('Please fill in all required shipping address fields');

    await changeInput(container, 'Recipient Name', 'Jane Doe');
    await changeInput(container, 'Street Address', '123 Main St');
    await changeInput(container, 'City', 'Toronto');
    await changeInput(container, 'State/Province', 'ON');
    await changeInput(container, 'ZIP/Postal Code', 'M5H 2N2');

    await click(container, 'Continue to Payment');

    expect(container.textContent).toContain('Payment Method');
  });

  test('submits the order, clears the cart, and shows the success state', async () => {
    (ApiClient.post as jest.Mock).mockResolvedValue({ id: 'ORDER-123' });

    await renderPage();
    await changeInput(container, 'Recipient Name', 'Jane Doe');
    await changeInput(container, 'Street Address', '123 Main St');
    await changeInput(container, 'City', 'Toronto');
    await changeInput(container, 'State/Province', 'ON');
    await changeInput(container, 'ZIP/Postal Code', 'M5H 2N2');

    await click(container, 'Continue to Payment');
    await click(container, 'Review Order');
    await click(container, 'Place Order');

    expect(ApiClient.post).toHaveBeenCalledWith('/order', {
      status: 'PENDING',
      total: 25,
      items: [
        {
          productRef: 'SKU-101',
          productName: 'Coffee Beans',
          quantity: 2,
          unitPrice: 12.5,
        },
      ],
      shippingAddress: expect.objectContaining({
        recipient: 'Jane Doe',
        street1: '123 Main St',
        city: 'Toronto',
        state: 'ON',
        postalCode: 'M5H 2N2',
        country: 'CA',
      }),
      paymentMethod: expect.objectContaining({
        type: 'CREDIT_CARD',
        last4: '4242',
        brand: 'Visa',
      }),
    });
    expect(clearCartMock).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('Order Placed Successfully!');
    expect(container.textContent).toContain('#ORDER-123');
  });

  test('shows an error and keeps cart intact when order submission fails', async () => {
    (ApiClient.post as jest.Mock).mockRejectedValue(new Error('Checkout failed at gateway'));

    await renderPage();
    await changeInput(container, 'Recipient Name', 'Jane Doe');
    await changeInput(container, 'Street Address', '123 Main St');
    await changeInput(container, 'City', 'Toronto');
    await changeInput(container, 'State/Province', 'ON');
    await changeInput(container, 'ZIP/Postal Code', 'M5H 2N2');

    await click(container, 'Continue to Payment');
    await click(container, 'Review Order');
    await click(container, 'Place Order');

    expect(clearCartMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Checkout failed at gateway');
    expect(container.textContent).not.toContain('Order Placed Successfully!');
  });

  test('navigates from success state to orders and products pages', async () => {
    (ApiClient.post as jest.Mock).mockResolvedValue({ id: 'ORDER-456' });

    await renderPage();
    await changeInput(container, 'Recipient Name', 'Jane Doe');
    await changeInput(container, 'Street Address', '123 Main St');
    await changeInput(container, 'City', 'Toronto');
    await changeInput(container, 'State/Province', 'ON');
    await changeInput(container, 'ZIP/Postal Code', 'M5H 2N2');

    await click(container, 'Continue to Payment');
    await click(container, 'Review Order');
    await click(container, 'Place Order');

    expect(container.textContent).toContain('Order Placed Successfully!');

    await click(container, 'View My Orders');
    await click(container, 'Continue Shopping');

    expect(pushMock).toHaveBeenCalledWith('/orders');
    expect(pushMock).toHaveBeenCalledWith('/products');
  });
});