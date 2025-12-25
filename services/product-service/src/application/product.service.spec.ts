import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../domain/product.entity';
import { Category } from '../domain/category.entity';
import { StockMovement } from '../domain/stock-movement.entity';
import { ProductInventory } from '../domain/product-inventory.entity';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ type: 'sqlite', database: ':memory:', dropSchema: true, entities: [Product, Category, StockMovement, ProductInventory], synchronize: true }),
        TypeOrmModule.forFeature([Product, Category, StockMovement, ProductInventory])
      ],
      providers: [ProductService]
    }).compile();
    service = moduleRef.get(ProductService);
  });

  it('creates product and adjusts stock', async () => {
    const created = await service.createProduct({ sku: 'ABC123', name: 'Test Product', price: 9.99, categoryCodes: ['books'] });
    expect(created.id).toBeDefined();
    const afterInc = await service.adjustStock('ABC123', 10, 'initial load');
    expect(afterInc.new).toBe(10);
    const afterDec = await service.adjustStock('ABC123', -3, 'sale');
    expect(afterDec.new).toBe(7);
    const stock = await service.getStock('ABC123');
    expect(stock).toBe(7);
  });
});