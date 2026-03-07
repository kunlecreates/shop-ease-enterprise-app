import { useCartStore } from '../lib/cart-store';
import { Product } from '../types';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  sku: 'SKU-001',
  name: 'Apple',
  price: 1.50,
  stock: 100,
  ...overrides,
});

beforeEach(() => {
  // Reset cart state between tests without touching other store internals
  useCartStore.setState({ items: [] });
  localStorage.clear();
});

describe('Cart Store', () => {
  describe('addItem', () => {
    test('adds a new item to an empty cart with correct fields', () => {
      const product = makeProduct();
      useCartStore.getState().addItem(product, 1);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe(1);
      expect(items[0].quantity).toBe(1);
      expect(items[0].price).toBe(1.50);
      expect(items[0].product).toEqual(product);
    });

    test('defaults to quantity 1 when no quantity argument is provided', () => {
      const product = makeProduct();
      useCartStore.getState().addItem(product);

      expect(useCartStore.getState().items[0].quantity).toBe(1);
    });

    test('increments quantity when the same product is added again', () => {
      const product = makeProduct();
      useCartStore.getState().addItem(product, 2);
      useCartStore.getState().addItem(product, 3);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });

    test('adds a second distinct product as a separate cart item', () => {
      const p1 = makeProduct({ id: 1, name: 'Apple' });
      const p2 = makeProduct({ id: 2, name: 'Banana', sku: 'SKU-002' });
      useCartStore.getState().addItem(p1, 1);
      useCartStore.getState().addItem(p2, 1);

      expect(useCartStore.getState().items).toHaveLength(2);
    });

    test('preserves the original price field from the product on the cart item', () => {
      const product = makeProduct({ id: 1, price: 4.99 });
      useCartStore.getState().addItem(product, 2);

      expect(useCartStore.getState().items[0].price).toBe(4.99);
    });
  });

  describe('removeItem', () => {
    test('removes an item by its productId', () => {
      const product = makeProduct({ id: 5 });
      useCartStore.getState().addItem(product, 1);
      useCartStore.getState().removeItem(5);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    test('leaves other items untouched when removing one product', () => {
      const p1 = makeProduct({ id: 1, name: 'Apple' });
      const p2 = makeProduct({ id: 2, name: 'Banana', sku: 'SKU-002' });
      useCartStore.getState().addItem(p1, 1);
      useCartStore.getState().addItem(p2, 2);
      useCartStore.getState().removeItem(1);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe(2);
    });

    test('does nothing when removing a productId that is not in the cart', () => {
      const product = makeProduct({ id: 1 });
      useCartStore.getState().addItem(product, 1);
      useCartStore.getState().removeItem(999);

      expect(useCartStore.getState().items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    test('updates the quantity of an existing cart item', () => {
      const product = makeProduct({ id: 1 });
      useCartStore.getState().addItem(product, 1);
      useCartStore.getState().updateQuantity(1, 5);

      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    test('removes the item when quantity is updated to 0', () => {
      const product = makeProduct({ id: 1 });
      useCartStore.getState().addItem(product, 3);
      useCartStore.getState().updateQuantity(1, 0);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    test('removes the item when quantity is updated to a negative number', () => {
      const product = makeProduct({ id: 1 });
      useCartStore.getState().addItem(product, 3);
      useCartStore.getState().updateQuantity(1, -1);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    test('does not affect other items when updating quantity of one product', () => {
      const p1 = makeProduct({ id: 1 });
      const p2 = makeProduct({ id: 2, sku: 'SKU-002' });
      useCartStore.getState().addItem(p1, 1);
      useCartStore.getState().addItem(p2, 4);
      useCartStore.getState().updateQuantity(1, 3);

      expect(useCartStore.getState().items[0].quantity).toBe(3);
      expect(useCartStore.getState().items[1].quantity).toBe(4);
    });
  });

  describe('clearCart', () => {
    test('removes all items from the cart', () => {
      const p1 = makeProduct({ id: 1 });
      const p2 = makeProduct({ id: 2, sku: 'SKU-002' });
      useCartStore.getState().addItem(p1, 2);
      useCartStore.getState().addItem(p2, 3);
      useCartStore.getState().clearCart();

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    test('does not throw when called on an already empty cart', () => {
      expect(() => useCartStore.getState().clearCart()).not.toThrow();
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('getTotal', () => {
    test('returns 0 for an empty cart', () => {
      expect(useCartStore.getState().getTotal()).toBe(0);
    });

    test('returns price × quantity for a single cart item', () => {
      const product = makeProduct({ id: 1, price: 2.50 });
      useCartStore.getState().addItem(product, 3);

      expect(useCartStore.getState().getTotal()).toBe(7.50);
    });

    test('returns the sum of all item subtotals for multiple items', () => {
      const p1 = makeProduct({ id: 1, price: 1.00 });
      const p2 = makeProduct({ id: 2, sku: 'SKU-002', price: 3.00 });
      useCartStore.getState().addItem(p1, 2); // 2.00
      useCartStore.getState().addItem(p2, 4); // 12.00

      expect(useCartStore.getState().getTotal()).toBe(14.00);
    });

    test('recalculates total correctly after a quantity update', () => {
      const product = makeProduct({ id: 1, price: 5.00 });
      useCartStore.getState().addItem(product, 1); // 5.00
      useCartStore.getState().updateQuantity(1, 3); // 15.00

      expect(useCartStore.getState().getTotal()).toBe(15.00);
    });

    test('recalculates total to 0 after clearCart', () => {
      const product = makeProduct({ id: 1, price: 10.00 });
      useCartStore.getState().addItem(product, 2);
      useCartStore.getState().clearCart();

      expect(useCartStore.getState().getTotal()).toBe(0);
    });
  });

  describe('getItemCount', () => {
    test('returns 0 for an empty cart', () => {
      expect(useCartStore.getState().getItemCount()).toBe(0);
    });

    test('returns the total quantity summed across all cart items', () => {
      const p1 = makeProduct({ id: 1 });
      const p2 = makeProduct({ id: 2, sku: 'SKU-002' });
      useCartStore.getState().addItem(p1, 3);
      useCartStore.getState().addItem(p2, 2);

      expect(useCartStore.getState().getItemCount()).toBe(5);
    });

    test('reflects quantity changes after updateQuantity', () => {
      const product = makeProduct({ id: 1 });
      useCartStore.getState().addItem(product, 3);
      useCartStore.getState().updateQuantity(1, 7);

      expect(useCartStore.getState().getItemCount()).toBe(7);
    });

    test('reflects count correctly after removeItem', () => {
      const p1 = makeProduct({ id: 1 });
      const p2 = makeProduct({ id: 2, sku: 'SKU-002' });
      useCartStore.getState().addItem(p1, 2);
      useCartStore.getState().addItem(p2, 3);
      useCartStore.getState().removeItem(1);

      expect(useCartStore.getState().getItemCount()).toBe(3);
    });

    test('returns 0 after clearCart', () => {
      const product = makeProduct({ id: 1 });
      useCartStore.getState().addItem(product, 5);
      useCartStore.getState().clearCart();

      expect(useCartStore.getState().getItemCount()).toBe(0);
    });
  });
});
