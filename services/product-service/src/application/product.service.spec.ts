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
    if (process.env.TEST_POSTGRES === '1') {
      // Use Testcontainers-provided Postgres for tests. Ensure helper has started and set env vars.
      // The test runner should start the container via test/testcontainers-postgres.ts before running tests,
      // but we support starting here lazily as well.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { startPostgresAndMigrate } = require('../../test/testcontainers-postgres');
      // start and run migrations
      // await startPostgresAndMigrate();
      await startPostgresAndMigrate();
      const moduleRef = await Test.createTestingModule({
        imports: [
          TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.PRODUCT_DB_HOST,
            port: +(process.env.PRODUCT_DB_PORT || '5432'),
            username: process.env.PRODUCT_DB_USER,
            password: process.env.PRODUCT_DB_PASSWORD,
            database: process.env.PRODUCT_DB_NAME,
            entities: [Product, Category, StockMovement, ProductInventory],
            synchronize: false
          }),
          TypeOrmModule.forFeature([Product, Category, StockMovement, ProductInventory])
        ],
        providers: [ProductService]
      }).compile();
      service = moduleRef.get(ProductService);
      return;
    }
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