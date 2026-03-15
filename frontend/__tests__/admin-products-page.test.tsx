import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import ProductManagementPage from '../app/admin/products/page';
import { ApiClient } from '@/lib/api-client';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('@/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/admin/ProductFormModal', () => ({
  ProductFormModal: ({ isOpen, onSubmit, product }: { isOpen: boolean; onSubmit: (payload: unknown) => void; product?: { sku?: string } | null }) => {
    if (!isOpen) {
      return null;
    }

    const payload = product
      ? {
          sku: product.sku,
          name: 'Updated Roast',
          description: 'Updated description',
          price: 18.5,
          stock: 7,
          category: 'coffee, beans',
          imageUrl: 'https://example.com/updated.png',
          aisle: 'A1',
          section: 'Drinks',
          shelfLocation: 'Top',
        }
      : {
          sku: 'SKU-NEW',
          name: 'New Roast',
          description: 'Fresh roast',
          price: 17.25,
          stock: 9,
          category: 'coffee, beans',
          imageUrl: 'https://example.com/new.png',
          aisle: 'A1',
          section: 'Drinks',
          shelfLocation: 'Top',
        };

    return React.createElement(
      'div',
      null,
      React.createElement(
        'button',
        {
          onClick: () => onSubmit(payload),
        },
        product ? 'Submit Edit' : 'Submit Create',
      ),
    );
  },
}));

jest.mock('@/lib/api-client', () => ({
  ApiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
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

async function click(container: HTMLElement, label: string) {
  await act(async () => {
    findButton(container, label).click();
    await flushPromises();
  });
}

describe('ProductManagementPage', () => {
  let container: HTMLDivElement;
  let root: Root;
  const confirmMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    confirmMock.mockReturnValue(true);
    Object.defineProperty(window, 'confirm', {
      value: confirmMock,
      configurable: true,
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
      root.render(React.createElement(ProductManagementPage));
      await flushPromises();
    });
  }

  test('loads products and renders the catalog table', async () => {
    (ApiClient.get as jest.Mock).mockResolvedValue([
      {
        id: 1,
        sku: 'SKU-1',
        name: 'Ethiopian Roast',
        price: 12.5,
        stock: 14,
        category: 'coffee',
      },
    ]);

    await renderPage();

    expect(ApiClient.get).toHaveBeenCalledWith('/product');
    expect(container.textContent).toContain('Ethiopian Roast');
    expect(container.textContent).toContain('SKU-1');
  });

  test('creates a product and maps comma-separated categories plus initial stock correctly', async () => {
    (ApiClient.get as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 2,
          sku: 'SKU-NEW',
          name: 'New Roast',
          price: 17.25,
          stock: 9,
          categories: ['coffee', 'beans'],
        },
      ]);
    (ApiClient.post as jest.Mock).mockResolvedValue({ id: 2 });

    await renderPage();
    await click(container, 'Add Product');
    await click(container, 'Submit Create');

    expect(ApiClient.post).toHaveBeenCalledWith('/product', {
      sku: 'SKU-NEW',
      name: 'New Roast',
      description: 'Fresh roast',
      price: 17.25,
      imageUrl: 'https://example.com/new.png',
      aisle: 'A1',
      section: 'Drinks',
      shelfLocation: 'Top',
      initialStock: 9,
      categoryCodes: ['coffee', 'beans'],
    });
    expect(ApiClient.get).toHaveBeenCalledTimes(2);
  });

  test('deletes a product after confirmation and reloads the list', async () => {
    (ApiClient.get as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 1,
          sku: 'SKU-1',
          name: 'Ethiopian Roast',
          price: 12.5,
          stock: 14,
          category: 'coffee',
        },
      ])
      .mockResolvedValueOnce([]);
    (ApiClient.delete as jest.Mock).mockResolvedValue({});

    await renderPage();
    await click(container, 'Delete');

    expect(confirmMock).toHaveBeenCalledWith('Are you sure you want to delete this product?');
    expect(ApiClient.delete).toHaveBeenCalledWith('/product/SKU-1');
    expect(ApiClient.get).toHaveBeenCalledTimes(2);
  });

  test('updates a product and sends edit payload without SKU/initialStock', async () => {
    (ApiClient.get as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 1,
          sku: 'SKU-1',
          name: 'Ethiopian Roast',
          price: 12.5,
          stock: 14,
          category: 'coffee',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 1,
          sku: 'SKU-1',
          name: 'Updated Roast',
          price: 18.5,
          stock: 14,
          categories: ['coffee', 'beans'],
        },
      ]);
    (ApiClient.put as jest.Mock).mockResolvedValue({ id: 1 });

    await renderPage();
    await click(container, 'Edit');
    await click(container, 'Submit Edit');

    expect(ApiClient.put).toHaveBeenCalledWith('/product/SKU-1', {
      name: 'Updated Roast',
      description: 'Updated description',
      price: 18.5,
      imageUrl: 'https://example.com/updated.png',
      aisle: 'A1',
      section: 'Drinks',
      shelfLocation: 'Top',
      categoryCodes: ['coffee', 'beans'],
    });
    expect(ApiClient.get).toHaveBeenCalledTimes(2);
  });

  test('does not delete product when confirmation is cancelled', async () => {
    confirmMock.mockReturnValue(false);
    (ApiClient.get as jest.Mock).mockResolvedValue([
      {
        id: 1,
        sku: 'SKU-1',
        name: 'Ethiopian Roast',
        price: 12.5,
        stock: 14,
        category: 'coffee',
      },
    ]);

    await renderPage();
    await click(container, 'Delete');

    expect(confirmMock).toHaveBeenCalledWith('Are you sure you want to delete this product?');
    expect(ApiClient.delete).not.toHaveBeenCalled();
    expect(ApiClient.get).toHaveBeenCalledTimes(1);
  });
});