import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import ProductsPage from '../app/products/page';
import { useCartStore } from '../lib/cart-store';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const addItemMock = jest.fn();
const useCartStoreMock = useCartStore as unknown as jest.Mock;

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

jest.mock('../lib/cart-store', () => ({
  useCartStore: jest.fn(),
}));

function flushPromises() {
  return Promise.resolve();
}

function setNativeInputValue(input: HTMLInputElement | HTMLSelectElement, value: string) {
  const prototype = input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  descriptor?.set?.call(input, value);
}

describe('ProductsPage', () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();

    useCartStoreMock.mockImplementation((selector: (state: { addItem: typeof addItemMock }) => unknown) =>
      selector({ addItem: addItemMock }),
    );

    fetchMock = jest.fn();
    global.fetch = fetchMock;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('shows a loading state before products resolve', async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));

    await act(async () => {
      root.render(React.createElement(ProductsPage));
      await flushPromises();
    });

    expect(container.textContent).toContain('Loading products...');
  });

  it('shows an error state when the product request fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await act(async () => {
      root.render(React.createElement(ProductsPage));
      await flushPromises();
      await flushPromises();
    });

    expect(container.textContent).toContain('Error: HTTP 500');
  });

  it('filters and sorts products based on search, category, and sort controls', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, sku: 'APL-1', name: 'Apple', price: 3.5, stock: 8, category: 'Fruit' },
        { id: 2, sku: 'BAN-1', name: 'Banana', price: 1.25, stock: 12, category: 'Fruit' },
        { id: 3, sku: 'MIL-1', name: 'Milk', price: 4.99, stock: 4, categories: [{ name: 'Dairy' }] },
      ],
    });

    await act(async () => {
      root.render(React.createElement(ProductsPage));
      await flushPromises();
      await flushPromises();
    });

    const searchInput = container.querySelector('input[type="search"]') as HTMLInputElement;
    const selects = Array.from(container.querySelectorAll('select')) as HTMLSelectElement[];
    const categorySelect = selects[0];
    const sortSelect = selects[1];

    await act(async () => {
      setNativeInputValue(searchInput, 'a');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
      await flushPromises();
    });

    expect(container.textContent).toContain('Apple');
    expect(container.textContent).toContain('Banana');
    expect(container.textContent).not.toContain('Milk');

    await act(async () => {
      setNativeInputValue(categorySelect, 'Fruit');
      categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
      await flushPromises();
    });

    const cardsAfterCategory = Array.from(container.querySelectorAll('[data-testid="product-card"]'));
    expect(cardsAfterCategory).toHaveLength(2);

    await act(async () => {
      setNativeInputValue(sortSelect, 'price_desc');
      sortSelect.dispatchEvent(new Event('change', { bubbles: true }));
      await flushPromises();
    });

    const titles = Array.from(container.querySelectorAll('[data-testid="product-card"] h3')).map((node) => node.textContent);
    expect(titles).toEqual(['Apple', 'Banana']);
  });

  it('shows an empty-state message when filters remove all products', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, sku: 'APL-1', name: 'Apple', price: 3.5, stock: 8, category: 'Fruit' }],
    });

    await act(async () => {
      root.render(React.createElement(ProductsPage));
      await flushPromises();
      await flushPromises();
    });

    const searchInput = container.querySelector('input[type="search"]') as HTMLInputElement;

    await act(async () => {
      setNativeInputValue(searchInput, 'zzz');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
      await flushPromises();
    });

    expect(container.textContent).toContain('No products found matching your criteria.');
  });

  it('adds a product to the cart and clears the added state after the timer', async () => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 4, sku: 'COF-1', name: 'Coffee', price: 7.99, stock: 6, category: 'Pantry' }],
    });

    await act(async () => {
      root.render(React.createElement(ProductsPage));
      await flushPromises();
      await flushPromises();
    });

    const addButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Add to Cart'),
    ) as HTMLButtonElement;

    await act(async () => {
      addButton.click();
      await flushPromises();
    });

    expect(addItemMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 4, sku: 'COF-1' }),
      1,
    );
    expect(addButton.textContent).toContain('✓ Added');
    expect(addButton.disabled).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await flushPromises();
    });

    const refreshedButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Add to Cart'),
    ) as HTMLButtonElement;
    expect(refreshedButton.disabled).toBe(false);
  });
});