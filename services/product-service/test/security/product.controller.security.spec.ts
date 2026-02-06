import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ProductController } from '../../src/presentation/product.controller';
import { HealthController } from '../../src/presentation/health.controller';
import { ProductService } from '../../src/application/product.service';
import { JwtAuthGuard } from '../../src/config/jwt-auth.guard';
import { JwtStrategy } from '../../src/config/jwt.config';

describe('Product Controller Security (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  
  const JWT_SECRET = 'test-secret-for-jwt-verification';

  const mockProductService = {
    listProducts: jest.fn().mockResolvedValue([
      { sku: 'TEST-001', name: 'Test Product', price: 10.00 },
    ]),
    createProduct: jest.fn().mockResolvedValue({
      sku: 'TEST-002',
      name: 'New Product',
      price: 20.00,
    }),
    adjustStock: jest.fn().mockResolvedValue({
      sku: 'TEST-001',
      stock: 100,
    }),
  };

  beforeAll(async () => {
    // Set JWT_SECRET before creating the module
    process.env.JWT_SECRET = JWT_SECRET;
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '60m' },
        }),
      ],
      controllers: [ProductController, HealthController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
        JwtStrategy,
        JwtAuthGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  const generateToken = (userId: string, email: string, roles: string[]) => {
    return jwtService.sign({
      sub: userId,
      email,
      roles,
      iss: 'shopease',
    });
  };

  describe('GET /api/product', () => {
    it('should allow public access to list products', () => {
      return request(app.getHttpServer())
        .get('/api/product')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should allow authenticated users to list products', () => {
      const token = generateToken('100', 'user@example.com', ['USER']);
      return request(app.getHttpServer())
        .get('/api/product')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('POST /api/product', () => {
    it('should reject create product without JWT (401)', () => {
      return request(app.getHttpServer())
        .post('/api/product')
        .send({
          sku: 'TEST-003',
          name: 'Unauthorized Product',
          price: 30.00,
        })
        .expect(401);
    });

    it('should reject create product with non-admin JWT (403)', () => {
      const token = generateToken('100', 'user@example.com', ['USER']);
      return request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: 'TEST-003',
          name: 'User Product',
          price: 30.00,
        })
        .expect(403);
    });

    it('should allow create product with admin JWT (201)', () => {
      const token = generateToken('1', 'admin@example.com', ['ADMIN']);
      return request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: 'TEST-003',
          name: 'Admin Product',
          price: 30.00,
        })
        .expect(201)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('sku');
          expect(res.body).toHaveProperty('name');
        });
    });
  });

  describe('PATCH /api/product/:sku/stock', () => {
    it('should reject adjust stock without JWT (401)', () => {
      return request(app.getHttpServer())
        .patch('/api/product/TEST-001/stock')
        .send({ adjustment: 10 })
        .expect(401);
    });

    it('should reject adjust stock with non-admin JWT (403)', () => {
      const token = generateToken('100', 'user@example.com', ['USER']);
      return request(app.getHttpServer())
        .patch('/api/product/TEST-001/stock')
        .set('Authorization', `Bearer ${token}`)
        .send({ adjustment: 10 })
        .expect(403);
    });

    it('should allow adjust stock with admin JWT (200)', () => {
      const token = generateToken('1', 'admin@example.com', ['ADMIN']);
      return request(app.getHttpServer())
        .patch('/api/product/TEST-001/stock')
        .set('Authorization', `Bearer ${token}`)
        .send({ adjustment: 10 })
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('sku');
          expect(res.body).toHaveProperty('stock');
        });
    });
  });

  describe('Health Endpoints', () => {
    it('should allow public access to health check', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200);
    });
  });

  describe('JWT Token Validation', () => {
    it('should reject expired token', () => {
      // Mock expired token verification
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Token expired');
      });

      return request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', 'Bearer expired-token')
        .send({ sku: 'TEST-004', name: 'Product', price: 40.00 })
        .expect(401);
    });

    it('should reject malformed token', () => {
      return request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', 'Bearer not-a-valid-token')
        .send({ sku: 'TEST-005', name: 'Product', price: 50.00 })
        .expect(401);
    });

    it('should reject request without Bearer prefix', () => {
      const token = generateToken('1', 'admin@example.com', ['ADMIN']);
      return request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', token) // Missing 'Bearer ' prefix
        .send({ sku: 'TEST-006', name: 'Product', price: 60.00 })
        .expect(401);
    });
  });
});
