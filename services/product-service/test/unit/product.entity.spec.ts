import { Product } from '../../src/domain/product.entity';
import { StockMovement } from '../../src/domain/stock-movement.entity';

describe('Product Entity', () => {
  let product: Product;

  beforeEach(() => {
    product = new Product();
    product.id = 1;
    product.sku = 'TEST-001';
    product.name = 'Test Product';
    product.currency = 'USD';
    product.active = true;
    product.createdAt = new Date('2026-01-01');
    product.updatedAt = new Date('2026-01-01');
  });

  describe('price getter/setter conversion', () => {
    it('should convert priceCents to price in dollars (getter)', () => {
      product.priceCents = 1050;
      expect(product.price).toBe(10.50);

      product.priceCents = 999;
      expect(product.price).toBe(9.99);

      product.priceCents = 0;
      expect(product.price).toBe(0);
    });

    it('should convert price in dollars to priceCents (setter)', () => {
      product.price = 10.50;
      expect(product.priceCents).toBe(1050);

      product.price = 9.99;
      expect(product.priceCents).toBe(999);

      product.price = 0;
      expect(product.priceCents).toBe(0);
    });

    it('should round fractional cents correctly', () => {
      product.price = 10.555;
      expect(product.priceCents).toBe(1056);

      product.price = 10.554;
      expect(product.priceCents).toBe(1055);
    });

    it('should handle null/undefined prices', () => {
      product.price = null as any;
      expect(product.priceCents).toBe(0);

      product.price = undefined as any;
      expect(product.priceCents).toBe(0);
    });
  });

  describe('toJSON() method', () => {
    it('should calculate stock from movements', () => {
      const movement1 = { quantity: 100 } as StockMovement;
      const movement2 = { quantity: -20 } as StockMovement;
      const movement3 = { quantity: 50 } as StockMovement;

      product.movements = [movement1, movement2, movement3];
      product.priceCents = 1999;

      const json = product.toJSON();

      expect(json.stock).toBe(130); // 100 - 20 + 50
    });

    it('should return 0 stock when movements is undefined', () => {
      product.movements = undefined as any;
      const json = product.toJSON();

      expect(json.stock).toBe(0);
    });

    it('should return 0 stock when movements is empty', () => {
      product.movements = [];
      const json = product.toJSON();

      expect(json.stock).toBe(0);
    });

    it('should include all expected fields in JSON output', () => {
      product.priceCents = 1999;
      product.description = 'Test description';
      product.movements = [{ quantity: 50 } as StockMovement];
      product.categories = [];

      const json = product.toJSON();

      expect(json).toHaveProperty('id', 1);
      expect(json).toHaveProperty('sku', 'TEST-001');
      expect(json).toHaveProperty('name', 'Test Product');
      expect(json).toHaveProperty('description', 'Test description');
      expect(json).toHaveProperty('price', 19.99);
      expect(json).toHaveProperty('priceCents', 1999);
      expect(json).toHaveProperty('currency', 'USD');
      expect(json).toHaveProperty('active', true);
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
      expect(json).toHaveProperty('categories');
      expect(json).toHaveProperty('stock', 50);
    });

    it('should handle negative stock from movements', () => {
      const movement1 = { quantity: 10 } as StockMovement;
      const movement2 = { quantity: -20 } as StockMovement;

      product.movements = [movement1, movement2];

      const json = product.toJSON();

      expect(json.stock).toBe(-10);
    });

    it('should extract category from attributes JSONB when categories array is empty', () => {
      product.categories = [];
      product.attributes = { category: 'fruit', unit: 'each' };
      product.movements = [];

      const json = product.toJSON();

      expect(json.categories).toEqual([{ name: 'fruit' }]);
      expect(json.unit).toBe('each');
    });

    it('should use categories array when available instead of attributes', () => {
      product.categories = [{ name: 'vegetables' } as any];
      product.attributes = { category: 'fruit', unit: 'each' };
      product.movements = [];

      const json = product.toJSON();

      expect(json.categories).toEqual([{ name: 'vegetables' }]);
      expect(json.unit).toBe('each');
    });

    it('should handle missing attributes field gracefully', () => {
      product.categories = [];
      product.attributes = undefined as any;
      product.movements = [];

      const json = product.toJSON();

      expect(json.categories).toEqual([]);
      expect(json.unit).toBeUndefined();
    });

    it('should extract unit from attributes even when categories exist', () => {
      product.categories = [{ name: 'dairy' } as any];
      product.attributes = { category: 'fruit', unit: 'l' };
      product.movements = [];

      const json = product.toJSON();

      expect(json.categories).toEqual([{ name: 'dairy' }]);
      expect(json.unit).toBe('l');
    });
  });
});
