import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductService } from '../../src/application/product.service';
import { Product } from '../../src/domain/product.entity';
import { Category } from '../../src/domain/category.entity';
import { StockMovement } from '../../src/domain/stock-movement.entity';

describe('ProductService', () => {
  let service: ProductService;
  let productRepo: Repository<Product>;
  let categoryRepo: Repository<Category>;
  let stockMovementRepo: Repository<StockMovement>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(Product), useClass: Repository },
        { provide: getRepositoryToken(Category), useClass: Repository },
        { provide: getRepositoryToken(StockMovement), useClass: Repository },
      ],
    }).compile();

    service = module.get(ProductService);
    productRepo = module.get(getRepositoryToken(Product));
    categoryRepo = module.get(getRepositoryToken(Category));
    stockMovementRepo = module.get(getRepositoryToken(StockMovement));
  });

  it('listProducts without pagination returns all', async () => {
    const spy = jest.spyOn(productRepo, 'find').mockResolvedValue([
      { id: 1 } as any,
      { id: 2 } as any,
    ]);
    const res = await service.listProducts();
    expect(spy).toHaveBeenCalledWith({ relations: ['movements', 'categories'] });
    expect(res).toHaveLength(2);
  });

  it('listProducts with pagination uses skip/take', async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        { id: 3 } as any,
      ]),
    };
    jest.spyOn(productRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
    const res = await service.listProducts({ page: 2, limit: 10 });
    expect(productRepo.createQueryBuilder).toHaveBeenCalledWith('p');
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('p.movements', 'movements');
    expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
    expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    expect(res).toHaveLength(1);
  });

  // createProduct() tests
  describe('createProduct', () => {
    it('should create product with initial stock', async () => {
      const mockCategory = { id: 1, name: 'Electronics' } as Category;
      const mockProduct = { id: 1, sku: 'TEST-001', name: 'Test Product', priceCents: 1000 } as Product;
      const mockMovement = { id: 1, product: mockProduct, quantity: 50, reason: 'Initial stock' } as StockMovement;

      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(categoryRepo, 'create').mockReturnValue(mockCategory);
      jest.spyOn(categoryRepo, 'save').mockResolvedValue(mockCategory);
      jest.spyOn(productRepo, 'create').mockReturnValue(mockProduct);
      jest.spyOn(productRepo, 'save').mockResolvedValue(mockProduct);
      jest.spyOn(stockMovementRepo, 'create').mockReturnValue(mockMovement);
      jest.spyOn(stockMovementRepo, 'save').mockResolvedValue(mockMovement);
      jest.spyOn(productRepo, 'findOne').mockResolvedValue({ ...mockProduct, categories: [mockCategory], movements: [mockMovement] } as any);

      const result = await service.createProduct({
        sku: 'TEST-001',
        name: 'Test Product',
        price: 10.00,
        categoryCodes: ['Electronics'],
        initialStock: 50
      });

      expect(categoryRepo.findOne).toHaveBeenCalledWith({ where: { name: 'Electronics' } });
      expect(categoryRepo.create).toHaveBeenCalledWith({ name: 'Electronics' });
      expect(stockMovementRepo.create).toHaveBeenCalledWith({ product: mockProduct, quantity: 50, reason: 'Initial stock' });
      expect(result?.movements).toHaveLength(1);
    });

    it('should create product without initial stock', async () => {
      const mockProduct = { id: 1, sku: 'TEST-002', name: 'Test Product 2', priceCents: 2000 } as Product;

      jest.spyOn(productRepo, 'create').mockReturnValue(mockProduct);
      jest.spyOn(productRepo, 'save').mockResolvedValue(mockProduct);
      jest.spyOn(productRepo, 'findOne').mockResolvedValue({ ...mockProduct, categories: [], movements: [] } as any);
      const createMovementSpy = jest.spyOn(stockMovementRepo, 'create');

      const result = await service.createProduct({
        sku: 'TEST-002',
        name: 'Test Product 2',
        price: 20.00
      });

      expect(result?.movements).toHaveLength(0);
      expect(createMovementSpy).not.toHaveBeenCalled();
    });

    it('should auto-provision new categories', async () => {
      const mockCategory1 = { id: 1, name: 'Books' } as Category;
      const mockCategory2 = { id: 2, name: 'Fiction' } as Category;
      const mockProduct = { id: 1, sku: 'BOOK-001' } as Product;

      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(categoryRepo, 'create').mockReturnValueOnce(mockCategory1).mockReturnValueOnce(mockCategory2);
      jest.spyOn(categoryRepo, 'save').mockResolvedValueOnce(mockCategory1).mockResolvedValueOnce(mockCategory2);
      jest.spyOn(productRepo, 'create').mockReturnValue(mockProduct);
      jest.spyOn(productRepo, 'save').mockResolvedValue(mockProduct);
      jest.spyOn(productRepo, 'findOne').mockResolvedValue({ ...mockProduct, categories: [mockCategory1, mockCategory2] } as any);

      await service.createProduct({
        sku: 'BOOK-001',
        name: 'Test Book',
        categoryCodes: ['Books', 'Fiction']
      });

      expect(categoryRepo.create).toHaveBeenCalledTimes(2);
      expect(categoryRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should use existing categories when available', async () => {
      const mockCategory = { id: 1, name: 'Electronics' } as Category;
      const mockProduct = { id: 1, sku: 'ELEC-001' } as Product;

      jest.spyOn(categoryRepo, 'findOne').mockResolvedValue(mockCategory);
      const createSpy = jest.spyOn(categoryRepo, 'create');
      const saveSpy = jest.spyOn(categoryRepo, 'save');
      jest.spyOn(productRepo, 'create').mockReturnValue(mockProduct);
      jest.spyOn(productRepo, 'save').mockResolvedValue(mockProduct);
      jest.spyOn(productRepo, 'findOne').mockResolvedValue({ ...mockProduct, categories: [mockCategory] } as any);

      await service.createProduct({
        sku: 'ELEC-001',
        name: 'Electronics Product',
        categoryCodes: ['Electronics']
      });

      expect(createSpy).not.toHaveBeenCalled();
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should handle both price and priceCents formats', async () => {
      const mockProduct1 = { id: 1, sku: 'PRICE-001', priceCents: 0, price: 0 } as Product;
      const mockProduct2 = { id: 2, sku: 'PRICE-002', priceCents: 0, price: 0 } as Product;

      jest.spyOn(productRepo, 'create').mockReturnValueOnce(mockProduct1).mockReturnValueOnce(mockProduct2);
      jest.spyOn(productRepo, 'save').mockResolvedValueOnce(mockProduct1).mockResolvedValueOnce(mockProduct2);
      jest.spyOn(productRepo, 'findOne').mockResolvedValueOnce({ ...mockProduct1 } as any).mockResolvedValueOnce({ ...mockProduct2 } as any);

      const result1 = await service.createProduct({ sku: 'PRICE-001', name: 'Test 1', price: 10.50 });
      expect(result1).toBeDefined();

      const result2 = await service.createProduct({ sku: 'PRICE-002', name: 'Test 2', priceCents: 1599 });
      expect(result2).toBeDefined();
    });
  });

  // adjustStock() tests
  describe('adjustStock', () => {
    it('should increment stock with positive quantity', async () => {
      const mockProduct = { id: 1, sku: 'TEST-001' } as Product;
      const mockMovement = { id: 1, product: mockProduct, quantity: 10, reason: 'Restock' } as StockMovement;

      jest.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct);
      jest.spyOn(service, 'getStock').mockResolvedValue(50);
      jest.spyOn(stockMovementRepo, 'create').mockReturnValue(mockMovement);
      jest.spyOn(stockMovementRepo, 'save').mockResolvedValue(mockMovement);

      const result = await service.adjustStock('TEST-001', 10, 'Restock');

      expect(result).toEqual({ sku: 'TEST-001', previous: 50, new: 60, stock: 60, reason: 'Restock' });
      expect(stockMovementRepo.create).toHaveBeenCalledWith({ product: mockProduct, quantity: 10, reason: 'Restock' });
    });

    it('should decrement stock with negative quantity', async () => {
      const mockProduct = { id: 1, sku: 'TEST-001' } as Product;
      const mockMovement = { id: 1, product: mockProduct, quantity: -5, reason: 'Sale' } as StockMovement;

      jest.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct);
      jest.spyOn(service, 'getStock').mockResolvedValue(50);
      jest.spyOn(stockMovementRepo, 'create').mockReturnValue(mockMovement);
      jest.spyOn(stockMovementRepo, 'save').mockResolvedValue(mockMovement);

      const result = await service.adjustStock('TEST-001', -5, 'Sale');

      expect(result).toEqual({ sku: 'TEST-001', previous: 50, new: 45, stock: 45, reason: 'Sale' });
    });

    it('should throw BadRequestException when stock would go negative', async () => {
      const mockProduct = { id: 1, sku: 'TEST-001' } as Product;

      jest.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct);
      jest.spyOn(service, 'getStock').mockResolvedValue(5);

      await expect(service.adjustStock('TEST-001', -10, 'Sale')).rejects.toThrow('Insufficient stock for decrement');
    });

    it('should throw BadRequestException for zero or non-integer quantity', async () => {
      await expect(service.adjustStock('TEST-001', 0, 'Test')).rejects.toThrow('Quantity must be a non-zero integer');
      await expect(service.adjustStock('TEST-001', 1.5, 'Test')).rejects.toThrow('Quantity must be a non-zero integer');
    });
  });

  // getStock() tests
  describe('getStock', () => {
    it('should calculate stock from multiple movements', async () => {
      const mockProduct = { id: 1, sku: 'TEST-001' } as Product;
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ stock: '75' })
      };

      jest.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct);
      jest.spyOn(stockMovementRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const stock = await service.getStock('TEST-001');

      expect(stock).toBe(75);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('m.product_id = :pid', { pid: 1 });
    });

    it('should throw NotFoundException for invalid SKU', async () => {
      jest.spyOn(productRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getStock('INVALID-SKU')).rejects.toThrow('Product with sku INVALID-SKU not found');
    });
  });

  // deleteProduct() tests
  describe('deleteProduct', () => {
    it('should successfully delete existing product', async () => {
      const mockProduct = { id: 1, sku: 'TEST-001' } as Product;

      jest.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct);
      jest.spyOn(productRepo, 'remove').mockResolvedValue(mockProduct);

      const result = await service.deleteProduct('TEST-001');

      expect(result).toBe(true);
      expect(productRepo.remove).toHaveBeenCalledWith(mockProduct);
    });

    it('should return false for non-existent product', async () => {
      jest.spyOn(productRepo, 'findOne').mockResolvedValue(null);
      const removeSpy = jest.spyOn(productRepo, 'remove');

      const result = await service.deleteProduct('INVALID-SKU');

      expect(result).toBe(false);
      expect(removeSpy).not.toHaveBeenCalled();
    });
  });
});
