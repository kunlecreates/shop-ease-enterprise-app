import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProductController } from '../../src/presentation/product.controller';
import { ProductService } from '../../src/application/product.service';

describe('ProductController', () => {
  let controller: ProductController;
  let service: jest.Mocked<ProductService>;

  beforeEach(() => {
    service = {
      listProducts: jest.fn(),
      searchProducts: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      getProductBySku: jest.fn(),
      adjustStock: jest.fn(),
      deleteProduct: jest.fn(),
    } as unknown as jest.Mocked<ProductService>;

    controller = new ProductController(service);
  });

  it('normalizes list query params before delegating to the service', async () => {
    service.listProducts.mockResolvedValue([] as never);

    await controller.list('0', '500', '  laptop  ', '  electronics  ', '10.5', '99.9', 'true', 'price_desc');

    expect(service.listProducts).toHaveBeenCalledWith({
      page: 1,
      limit: 100,
      q: 'laptop',
      category: 'electronics',
      minPrice: 10.5,
      maxPrice: 99.9,
      inStock: true,
      sort: 'price_desc',
    });
  });

  it('returns an empty array when search query is blank', async () => {
    await expect(controller.search('   ', '2', '5')).resolves.toEqual([]);
    expect(service.searchProducts).not.toHaveBeenCalled();
  });

  it('trims search query and normalizes pagination', async () => {
    service.searchProducts.mockResolvedValue([{ sku: 'SKU-1' }] as never);

    const result = await controller.search('  phone  ', '-1', '250');

    expect(service.searchProducts).toHaveBeenCalledWith('phone', { page: 1, limit: 100 });
    expect(result).toEqual([{ sku: 'SKU-1' }]);
  });

  it('maps duplicate-key failures to a conflict exception on create', async () => {
    service.createProduct.mockRejectedValue({ code: '23505' } as never);

    await expect(
      controller.create({ sku: 'SKU-1' } as never, { user: { roles: ['ADMIN'] } }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects non-admin product updates', async () => {
    await expect(
      controller.update('SKU-1', {} as never, { user: { roles: ['USER'] } }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(service.updateProduct).not.toHaveBeenCalled();
  });

  it('throws not found when updating a missing product', async () => {
    service.updateProduct.mockResolvedValue(null as never);

    await expect(
      controller.update('MISSING', { name: 'Updated' } as never, { user: { roles: ['admin'] } }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns inventory summary from product JSON stock values', async () => {
    service.listProducts.mockResolvedValue([
      {
        sku: 'SKU-1',
        name: 'Phone',
        toJSON: () => ({ stock: 5 }),
      },
      {
        sku: 'SKU-2',
        name: 'Tablet',
        toJSON: () => ({ stock: 0 }),
      },
    ] as never);

    await expect(controller.getInventorySummary()).resolves.toEqual({
      total: 2,
      items: [
        { sku: 'SKU-1', name: 'Phone', stock: 5 },
        { sku: 'SKU-2', name: 'Tablet', stock: 0 },
      ],
    });
  });

  it('falls back to an empty inventory summary when listing fails', async () => {
    service.listProducts.mockRejectedValue(new Error('database unavailable') as never);

    await expect(controller.getInventorySummary()).resolves.toEqual({ total: 0, items: [] });
  });

  it('uses quantity fallback and default reason when adjusting stock', async () => {
    service.adjustStock.mockResolvedValue({ stock: 7 } as never);

    await controller.adjustStock('SKU-1', { quantity: 3 }, { user: { roles: ['ADMIN'] } });

    expect(service.adjustStock).toHaveBeenCalledWith('SKU-1', 3, 'Manual adjustment');
  });

  it('uses the internal endpoint default reason for stock adjustments', async () => {
    service.adjustStock.mockResolvedValue({ stock: 2 } as never);

    await controller.adjustStockInternal('SKU-9', { adjustment: -2 });

    expect(service.adjustStock).toHaveBeenCalledWith('SKU-9', -2, 'Order fulfillment');
  });

  it('throws not found when deleting a missing product', async () => {
    service.deleteProduct.mockResolvedValue(false as never);

    await expect(
      controller.deleteProduct('SKU-404', { user: { roles: ['ADMIN'] } }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});