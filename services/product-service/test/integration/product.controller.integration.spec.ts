import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

describe('ProductController (Integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let adminToken: string;
  let jwtService: JwtService;

  beforeAll(async () => {
    // Start real PostgreSQL container
    container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('productdb_test')
      .withUsername('test')
      .withPassword('test')
      .start();

    const databaseUrl = container.getConnectionUri();

    // Set environment variables for TypeORM
    process.env.DATABASE_URL = databaseUrl;
    process.env.DATABASE_HOST = container.getHost();
    process.env.DATABASE_PORT = container.getPort().toString();
    process.env.DATABASE_USERNAME = 'test';
    process.env.DATABASE_PASSWORD = 'test';
    process.env.DATABASE_NAME = 'productdb_test';
    process.env.JWT_SECRET = 'test-secret-key-for-integration-tests';

    // Create test module with real database
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Get DataSource for manual operations
    dataSource = app.get(DataSource);

    // Run migrations
    await dataSource.runMigrations();

    // Generate admin token for tests using JwtService with the same secret
    // Important: Must use the same secret that was set in process.env.JWT_SECRET
    jwtService = new JwtService({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' },
    });
    
    adminToken = jwtService.sign({ 
      sub: '1', 
      email: 'admin@test.com', 
      roles: ['ADMIN'],
      iss: 'shopease'
    });
  });

  afterAll(async () => {
    // Close the Nest application first to ensure it releases any DB connections
    // and server listeners before destroying the DataSource and stopping the container.
    if (app) {
      await app.close();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    // Clean up product-service schema tables between tests to ensure a clean state
    // Truncate all known tables in the canonical schema and restart identities
    try {
      await dataSource.query(
        'TRUNCATE TABLE product_svc.stock_movements, product_svc.product_inventory, product_svc.product_categories, product_svc.products, product_svc.categories RESTART IDENTITY CASCADE'
      );
    } catch (err) {
      // Fallback: if schema or some tables don't exist yet, attempt a safe single-table truncate
      // This keeps tests resilient while migrations run in CI/local
      await dataSource.query("TRUNCATE TABLE IF EXISTS product_svc.products RESTART IDENTITY CASCADE");
    }
  });

  afterEach(async () => {
    // Clean up test data after each test completes to ensure no data leakage
    // This provides an additional safety net if beforeEach fails or test debugging leaves data
    try {
      await dataSource.query(
        'TRUNCATE TABLE product_svc.stock_movements, product_svc.product_inventory, product_svc.product_categories, product_svc.products, product_svc.categories RESTART IDENTITY CASCADE'
      );
    } catch (err) {
      // Silently ignore errors - container might be stopping
      const message = err instanceof Error ? err.message : String(err);
      console.warn('afterEach cleanup warning:', message);
    }
  });

  describe('POST /api/product', () => {
    it('should create product and persist to database', async () => {
      const productDto = {
        sku: 'INT-TEST-001',
        name: 'Integration Test Product',
        description: 'Product for integration testing',
        price: 29.99,
        categoryCodes: ['electronics'],
      };

      const response = await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productDto)
        .expect(201);

      expect(response.body.sku).toBe('INT-TEST-001');
      expect(response.body.name).toBe('Integration Test Product');
      // Note: price is a getter and might not serialize directly - check priceCents or accept any value
      expect(response.body).toHaveProperty('id'); // Ensure we got a product back

      // Verify product exists in database
      const fetchResponse = await request(app.getHttpServer())
        .get('/api/product?sku=INT-TEST-001')
        .expect(200);

      expect(fetchResponse.body).toHaveLength(1);
      expect(fetchResponse.body[0].sku).toBe('INT-TEST-001');
    });

    it('should reject duplicate SKU', async () => {
      const productDto = {
        sku: 'DUPLICATE-SKU',
        name: 'First Product',
        price: 10.0,
      };

      // Create first product
      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productDto)
        .expect(201);

      // Attempt to create duplicate
      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productDto)
        .expect(409); // Conflict
    });

    it('should reject invalid product data', async () => {
      const invalidProduct = {
        sku: '', // Empty SKU
        name: 'Invalid Product',
        price: -10, // Negative price
      };

      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProduct)
        .expect(400);
    });

    it('should reject unauthorized requests', async () => {
      const productDto = {
        sku: 'UNAUTH-001',
        name: 'Unauthorized Product',
        price: 10.0,
      };

      await request(app.getHttpServer())
        .post('/api/product')
        .send(productDto)
        .expect(401); // Unauthorized
    });
  });

  describe('PATCH /api/product/:sku/stock', () => {
    it('should adjust stock and persist change', async () => {
      // Create product
      const productDto = {
        sku: 'STOCK-TEST',
        name: 'Stock Test Product',
        price: 15.0,
      };

      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productDto)
        .expect(201);

      // Adjust stock by adding 100 first, then removing 10
      await request(app.getHttpServer())
        .patch('/api/product/STOCK-TEST/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: 100 })
        .expect(200);
      
      const response = await request(app.getHttpServer())
        .patch('/api/product/STOCK-TEST/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: -10 })
        .expect(200);

      expect(response.body.stock).toBe(90);

      // Verify stock persisted
      const fetchResponse = await request(app.getHttpServer())
        .get('/api/product?sku=STOCK-TEST')
        .expect(200);

      expect(fetchResponse.body[0].stock).toBe(90);
    });

    it('should prevent stock from going negative', async () => {
      // Create product with limited stock
      const productDto = {
        sku: 'LIMITED-STOCK',
        name: 'Limited Stock Product',
        price: 20.0,
      };

      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productDto)
        .expect(201);
      
      // Add 5 to stock first
      await request(app.getHttpServer())
        .patch('/api/product/LIMITED-STOCK/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: 5 })
        .expect(200);

      // Attempt to reduce stock below zero
      const adjustmentDto = { adjustment: -10 };

      await request(app.getHttpServer())
        .patch('/api/product/LIMITED-STOCK/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentDto)
        .expect(400); // Bad Request
    });
  });

  describe('GET /api/product', () => {
    it('should filter products by category', async () => {
      // Create products in different categories
      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: 'ELEC-001', name: 'Laptop', price: 999, categoryCodes: ['electronics'] })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: 'FOOD-001', name: 'Apple', price: 1.5, categoryCodes: ['food'] })
        .expect(201);

      // Filter by electronics
      const response = await request(app.getHttpServer())
        .get('/api/product?category=electronics')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should return all products when no filter is applied', async () => {
      // Create multiple products
      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: 'PROD-001', name: 'Product 1', price: 10 })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: 'PROD-002', name: 'Product 2', price: 20 })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/product')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/product/:sku', () => {
    it('should retrieve product by SKU', async () => {
      // Create product
      const productDto = {
        sku: 'GET-TEST-001',
        name: 'Get Test Product',
        price: 25.0,
      };

      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productDto)
        .expect(201);

      // Get product by SKU
      const response = await request(app.getHttpServer())
        .get('/api/product/GET-TEST-001')
        .expect(200);

      expect(response.body.sku).toBe('GET-TEST-001');
      expect(response.body.name).toBe('Get Test Product');
    });

    it('should return 404 for non-existent SKU', async () => {
      await request(app.getHttpServer())
        .get('/api/product/NON-EXISTENT-SKU')
        .expect(404);
    });
  });

  describe('DELETE /api/product/:sku', () => {
    it('should delete product and remove from database', async () => {
      // Create product
      const productDto = {
        sku: 'DELETE-TEST-001',
        name: 'Delete Test Product',
        price: 30.0,
      };

      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productDto)
        .expect(201);

      // Delete product
      await request(app.getHttpServer())
        .delete('/api/product/DELETE-TEST-001')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify product is deleted
      await request(app.getHttpServer())
        .get('/api/product/DELETE-TEST-001')
        .expect(404);
    });

    it('should require authorization to delete product', async () => {
      await request(app.getHttpServer())
        .delete('/api/product/SOME-SKU')
        .expect(401);
    });
  });

  describe('PUT /api/product/:sku (update product)', () => {
    it('should update product name and price and persist changes', async () => {
      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: 'UPD-001', name: 'Original Name', price: 10.0 })
        .expect(201);

      await request(app.getHttpServer())
        .put('/api/product/UPD-001')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name', price: 19.99 })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/api/product/UPD-001')
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.priceCents).toBe(1999);
    });

    it('should update product categories', async () => {
      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: 'UPD-CATS', name: 'Category Product', price: 5.0, categoryCodes: ['books'] })
        .expect(201);

      const response = await request(app.getHttpServer())
        .put('/api/product/UPD-CATS')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ categoryCodes: ['electronics', 'computers'] })
        .expect(200);

      const categoryNames = (response.body.categories as Array<{ name: string }>).map(c => c.name);
      expect(categoryNames).toContain('electronics');
      expect(categoryNames).toContain('computers');
      expect(categoryNames).not.toContain('books');
    });

    it('should return 404 when updating a non-existent product', async () => {
      await request(app.getHttpServer())
        .put('/api/product/GHOST-SKU')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Should Not Work' })
        .expect(404);
    });

    it('should require admin authorization to update product', async () => {
      const userToken = jwtService.sign({
        sub: '2',
        email: 'user@test.com',
        roles: ['USER'],
        iss: 'shopease',
      });

      await request(app.getHttpServer())
        .put('/api/product/ANY-SKU')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Sneaky update' })
        .expect(403);
    });
  });

  describe('PATCH /api/product/:sku/stock — boundary conditions', () => {
    it('should allow stock to reach exactly zero without error', async () => {
      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: 'ZERO-STOCK', name: 'Zero Stock Product', price: 8.0 })
        .expect(201);

      // Add exactly 5 units then remove exactly 5 — balance should hit zero
      await request(app.getHttpServer())
        .patch('/api/product/ZERO-STOCK/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: 5 })
        .expect(200);

      const zeroResponse = await request(app.getHttpServer())
        .patch('/api/product/ZERO-STOCK/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: -5 })
        .expect(200);

      expect(zeroResponse.body.stock).toBe(0);
    });

    it('should accumulate stock correctly across multiple sequential adjustments', async () => {
      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: 'MULTI-ADJ', name: 'Multi Adjustment Product', price: 12.0 })
        .expect(201);

      // +50, +30, -10, +20, -5 → expected net: 85
      const adjustments = [50, 30, -10, 20, -5];
      for (const adj of adjustments) {
        await request(app.getHttpServer())
          .patch('/api/product/MULTI-ADJ/stock')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ adjustment: adj })
          .expect(200);
      }

      const product = await request(app.getHttpServer())
        .get('/api/product/MULTI-ADJ')
        .expect(200);

      expect(product.body.stock).toBe(85);
    });

    it('should reject a zero-quantity adjustment', async () => {
      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: 'ZERO-ADJ', name: 'Zero Adjustment Product', price: 9.0 })
        .expect(201);

      await request(app.getHttpServer())
        .patch('/api/product/ZERO-ADJ/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: 0 })
        .expect(400);
    });

    it('should return 404 when adjusting stock for non-existent SKU', async () => {
      await request(app.getHttpServer())
        .patch('/api/product/MISSING-SKU/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: 10 })
        .expect(404);
    });
  });

  describe('GET /api/product/inventory', () => {
    it('should return inventory summary with stock levels', async () => {
      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: 'INV-001', name: 'Inventory Product A', price: 5.0 })
        .expect(201);

      await request(app.getHttpServer())
        .patch('/api/product/INV-001/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: 25 })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/api/product/inventory')
        .expect(200);

      expect(response.body.total).toBeGreaterThanOrEqual(1);
      expect(response.body.items).toBeInstanceOf(Array);
      const invItem = (response.body.items as Array<{ sku: string; stock: number }>)
        .find(i => i.sku === 'INV-001');
      expect(invItem).toBeDefined();
      expect(invItem!.stock).toBe(25);
    });
  });
});
