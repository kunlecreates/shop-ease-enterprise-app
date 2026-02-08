# 🧪 ShopEase Integration Testing Strategy

**Last Updated**: January 17, 2026  
**Status**: Implementation Guide

---

## Problem Statement

Current testing approach has **blurred boundaries** between test levels:

### ❌ Current Issues

1. **Integration tests in `/integration-tests/`** are actually **API contract tests** that run against deployed environment
   - These are closer to E2E tests
   - Depend on external deployment
   - Test cross-service communication

2. **Service-level tests** (e.g., `product.controller.security.spec.ts`) are labeled "e2e" but are actually **integration tests**
   - Test controller + service layer with mocked database
   - Don't test full application deployment
   - Should be part of service CI pipeline

3. **True E2E tests** in `/e2e/` are correctly positioned but overlap with `/integration-tests/`

4. **Workflow confusion**: `integration-tests.yml` workflow runs after deployment, making it more of a post-deployment validation

---

## Industry-Standard Test Pyramid

```
                   ┌───────────────┐
                   │   E2E Tests   │  ← Playwright, full system via browser
                   │   (slowest)   │     Run AFTER deployment
                   └───────────────┘     User journey validation
                         ▲
                         │
                   ┌─────────────────┐
                   │ Integration Tests│ ← REST API + Real DB (Testcontainers)
                   │   (moderate)     │    Run IN service CI pipeline
                   └─────────────────┘    Service boundary validation
                         ▲
                         │
                   ┌───────────────────┐
                   │   Unit Tests      │ ← Pure logic, mocked dependencies
                   │   (fastest)       │    Run IN service CI pipeline
                   └───────────────────┘    Business logic validation
```

---

## Correct Definition of Test Levels

### 1. **Unit Tests** (Inside Each Service)
**What**: Test individual functions/methods in isolation with all dependencies mocked  
**Scope**: Single class, single method  
**Where**: `services/{service}/src/test/java` or `services/{service}/test/unit/`  
**Tools**: JUnit/Mockito (Java), Jest (NestJS), pytest (Python)  
**Database**: None or H2/in-memory  
**External Services**: Mocked  
**CI Execution**: Every push, before Docker build

**Example** (Java):
```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock
    private OrderRepository orderRepository;
    
    @InjectMocks
    private OrderService orderService;
    
    @Test
    void createOrder_shouldSaveOrder() {
        // Pure logic test with mocked repository
    }
}
```

---

### 2. **Integration Tests** (Inside Each Service)
**What**: Test multiple components working together within ONE service with real infrastructure  
**Scope**: Controller → Service → Repository → **Real Database**  
**Where**: `services/{service}/src/test/java/integration/` or `test/integration/`  
**Tools**: 
- Java: `@SpringBootTest` + Testcontainers (Oracle, MSSQL, PostgreSQL)
- NestJS: `@nestjs/testing` + Testcontainers or test DB
- Python: FastAPI TestClient + test DB  
**Database**: **Real database** via Testcontainers or dedicated test instance  
**External Services**: Mocked or stubbed (WireMock, nock, responses)  
**CI Execution**: Every push, before Docker build

**Key Characteristics**:
- ✅ Real database with migrations applied
- ✅ Full Spring/NestJS context loaded
- ✅ HTTP requests to controllers
- ✅ Tests run **in isolation** (no deployed cluster needed)
- ❌ No cross-service calls (mock other services)
- ❌ No browser automation
- ❌ No deployed Kubernetes

**Example** (Java + Testcontainers):
```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
class OrderControllerIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void createOrder_shouldPersistToDatabaseAndReturn201() {
        OrderCreateDTO dto = new OrderCreateDTO("user-123", 99.99);
        
        ResponseEntity<Order> response = restTemplate.postForEntity(
            "/api/order", dto, Order.class
        );
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getId()).isNotNull();
        
        // Verify in database
        Order saved = orderRepository.findById(response.getBody().getId()).orElseThrow();
        assertThat(saved.getAmount()).isEqualByComparingTo("99.99");
    }
}
```

**Example** (NestJS + Testcontainers):
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { GenericContainer } from 'testcontainers';

describe('ProductController (Integration)', () => {
  let app: INestApplication;
  let postgresContainer;

  beforeAll(async () => {
    // Start real PostgreSQL via Testcontainers
    postgresContainer = await new GenericContainer('postgres:15')
      .withEnvironment({ POSTGRES_PASSWORD: 'test' })
      .withExposedPorts(5432)
      .start();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Full app context
    })
      .overrideProvider('DATABASE_URL')
      .useValue(`postgresql://postgres:test@${postgresContainer.getHost()}:${postgresContainer.getMappedPort(5432)}/test`)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await postgresContainer.stop();
  });

  it('POST /api/product should create product in real database', () => {
    return request(app.getHttpServer())
      .post('/api/product')
      .send({ sku: 'TEST-001', name: 'Integration Test Product', price: 19.99 })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201)
      .then((response) => {
        expect(response.body.sku).toBe('TEST-001');
      });
  });
});
```

---

### 3. **Contract Tests** (Cross-Service API Contracts)
**What**: Verify API contracts between services (consumer-driven contracts)  
**Scope**: Service A expects Service B to provide specific API shape  
**Where**: `services/{service}/test/contracts/` or separate `/contract-tests/`  
**Tools**: Pact, Spring Cloud Contract, or custom OpenAPI validation  
**Database**: Not needed  
**External Services**: Contract stubs  
**CI Execution**: Before integration with other services

**Example** (Pact):
```java
@PactVerification("notification-service")
@Test
void verifyOrderCreatedNotificationContract() {
    // Verify notification-service accepts expected payload
}
```

---

### 4. **End-to-End (E2E) Tests** (Full System)
**What**: Validate complete user journeys through browser across ALL services  
**Scope**: Browser → Frontend → Ingress → All Backend Services → Databases  
**Where**: `/e2e/` (root level, separate from services)  
**Tools**: Playwright  
**Database**: Real staging/preview environment databases  
**External Services**: Real deployed services  
**CI Execution**: **AFTER** Kubernetes deployment

**Key Characteristics**:
- ✅ Full deployed Kubernetes cluster
- ✅ Browser automation (Playwright)
- ✅ Tests user flows (login → browse → add to cart → checkout)
- ✅ Cross-service interactions
- ✅ Real frontend rendering
- ❌ Not run in service CI (run in deployment pipeline)

**Example** (Playwright):
```typescript
import { test, expect } from '@playwright/test';

test('Complete checkout flow', async ({ page }) => {
  await page.goto('https://shop.kunlecreates.org');
  
  // Login
  await page.getByLabel('Email').fill('customer@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Browse products
  await page.goto('/products');
  await page.getByRole('button', { name: 'Add to Cart' }).first().click();
  
  // Checkout
  await page.goto('/cart');
  await page.getByRole('button', { name: 'Checkout' }).click();
  
  // Verify order created
  await expect(page.getByText('Order Confirmation')).toBeVisible();
});
```

---

## Reorganization Plan

### Step 1: Rename `/integration-tests/` to `/api-tests/` or `/contract-tests/`
These tests validate API contracts across deployed services, not integration within a service.

```bash
mv integration-tests api-tests
```

Update workflow: `.github/workflows/api-tests.yml` (renamed from integration-tests.yml)

---

### Step 2: Create True Integration Tests Inside Each Service

#### Java Services (user-service, order-service)

**Structure**:
```
services/user-service/
├── src/
│   └── test/
│       └── java/org/kunlecreates/user/
│           ├── unit/                         # Pure unit tests
│           │   ├── UserServiceTest.java
│           │   └── PasswordHasherTest.java
│           └── integration/                  # Integration tests
│               ├── UserControllerIT.java     # REST API + DB
│               ├── UserRepositoryIT.java     # Repository + DB
│               └── AuthFlowIT.java           # End-to-end auth flow
```

**Example**: `UserControllerIT.java`
```java
package org.kunlecreates.user.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.testcontainers.containers.OracleContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.kunlecreates.user.interfaces.dto.RegisterRequest;
import org.kunlecreates.user.interfaces.dto.LoginRequest;
import org.kunlecreates.user.interfaces.dto.AuthResponse;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class UserControllerIT {

    @Container
    static OracleContainer oracle = new OracleContainer("gvenzl/oracle-free:23-slim");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", oracle::getJdbcUrl);
        registry.add("spring.datasource.username", oracle::getUsername);
        registry.add("spring.datasource.password", oracle::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void registerUser_shouldPersistToDatabase_andAllowLogin() {
        // Step 1: Register new user
        RegisterRequest registerDto = new RegisterRequest(
            "integration@test.com", 
            "SecurePass123!"
        );
        
        ResponseEntity<AuthResponse> registerResponse = restTemplate.postForEntity(
            "/api/user/register", 
            registerDto, 
            AuthResponse.class
        );
        
        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(registerResponse.getBody().getToken()).isNotEmpty();
        
        // Step 2: Login with registered user
        LoginRequest loginDto = new LoginRequest(
            "integration@test.com", 
            "SecurePass123!"
        );
        
        ResponseEntity<AuthResponse> loginResponse = restTemplate.postForEntity(
            "/api/user/login", 
            loginDto, 
            AuthResponse.class
        );
        
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody().getToken()).isNotEmpty();
        
        // Step 3: Verify JWT token works for protected endpoint
        String token = loginResponse.getBody().getToken();
        ResponseEntity<UserProfile> profileResponse = restTemplate
            .exchange(
                "/api/user/profile",
                HttpMethod.GET,
                new HttpEntity<>(createAuthHeaders(token)),
                UserProfile.class
            );
        
        assertThat(profileResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(profileResponse.getBody().getEmail()).isEqualTo("integration@test.com");
    }
    
    @Test
    void loginWithInvalidCredentials_shouldReturn401() {
        LoginRequest invalidLogin = new LoginRequest(
            "nonexistent@example.com", 
            "wrongpassword"
        );
        
        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
            "/api/user/login", 
            invalidLogin, 
            AuthResponse.class
        );
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
    
    private HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }
}
```

#### NestJS Service (product-service)

**Structure**:
```
services/product-service/
├── test/
│   ├── unit/                                # Unit tests
│   │   ├── product.service.spec.ts
│   │   └── stock.calculator.spec.ts
│   └── integration/                         # Integration tests
│       ├── product.controller.integration.spec.ts
│       ├── product.repository.integration.spec.ts
│       └── stock-adjustment.integration.spec.ts
```

**Example**: `product.controller.integration.spec.ts`
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';

describe('ProductController (Integration)', () => {
  let app: INestApplication;
  let postgresContainer: StartedTestContainer;
  let jwtService: JwtService;
  let adminToken: string;

  beforeAll(async () => {
    // Start real PostgreSQL container
    postgresContainer = await new GenericContainer('postgres:15-alpine')
      .withEnvironment({
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
        POSTGRES_DB: 'productdb',
      })
      .withExposedPorts(5432)
      .start();

    const databaseUrl = `postgresql://test:test@${postgresContainer.getHost()}:${postgresContainer.getMappedPort(5432)}/productdb`;

    // Create test module with real database
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('DATABASE_URL')
      .useValue(databaseUrl)
      .compile();

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

    jwtService = moduleFixture.get<JwtService>(JwtService);
    adminToken = jwtService.sign({
      sub: '1',
      email: 'admin@test.com',
      roles: ['ADMIN'],
    });
  });

  afterAll(async () => {
    await app.close();
    await postgresContainer.stop();
  });

  describe('POST /api/product', () => {
    it('should create product and persist to database', async () => {
      const productDto = {
        sku: 'INT-TEST-001',
        name: 'Integration Test Product',
        description: 'Product for integration testing',
        price: 29.99,
        stock: 100,
        category: 'Electronics',
      };

      const response = await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productDto)
        .expect(201);

      expect(response.body.sku).toBe('INT-TEST-001');
      expect(response.body.name).toBe('Integration Test Product');

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
        stock: 50,
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
  });

  describe('PATCH /api/product/:sku/stock', () => {
    it('should adjust stock and persist change', async () => {
      // Create product
      const productDto = {
        sku: 'STOCK-TEST',
        name: 'Stock Test Product',
        price: 15.0,
        stock: 100,
      };

      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productDto)
        .expect(201);

      // Adjust stock
      const adjustmentDto = { adjustment: -10 };

      const response = await request(app.getHttpServer())
        .patch('/api/product/STOCK-TEST/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentDto)
        .expect(200);

      expect(response.body.stock).toBe(90);

      // Verify stock persisted
      const fetchResponse = await request(app.getHttpServer())
        .get('/api/product?sku=STOCK-TEST')
        .expect(200);

      expect(fetchResponse.body[0].stock).toBe(90);
    });
  });

  describe('GET /api/product', () => {
    it('should filter products by category', async () => {
      // Create products in different categories
      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: 'ELEC-001', name: 'Laptop', price: 999, category: 'Electronics', stock: 10 })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: 'FOOD-001', name: 'Apple', price: 1.5, category: 'Food', stock: 50 })
        .expect(201);

      // Filter by Electronics
      const response = await request(app.getHttpServer())
        .get('/api/product?category=Electronics')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.every((p) => p.category === 'Electronics')).toBe(true);
    });
  });
});
```

#### Python Service (notification-service)

**Structure**:
```
services/notification-service/
├── tests/
│   ├── unit/                              # Unit tests
│   │   ├── test_email_service.py
│   │   └── test_jwt_validation.py
│   └── integration/                       # Integration tests
│       ├── test_notification_api.py
│       └── test_email_sending.py
```

**Example**: `test_notification_api.py`
```python
import pytest
from fastapi.testclient import TestClient
from jose import jwt
from datetime import datetime, timedelta
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def admin_token():
    payload = {
        "sub": "admin-123",
        "email": "admin@test.com",
        "roles": ["ADMIN"],
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, "test-jwt-secret", algorithm="HS256")

def test_send_email_integration(client, admin_token):
    """Integration test: Send email through API with real SMTP validation"""
    
    email_data = {
        "to": "recipient@example.com",
        "subject": "Integration Test",
        "body": "This is an integration test email"
    }
    
    response = client.post(
        "/api/notification/email",
        json=email_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    assert response.json()["status"] == "sent"

def test_send_order_confirmation_integration(client, admin_token):
    """Integration test: Order confirmation email with template rendering"""
    
    order_data = {
        "order_id": "ORDER-123",
        "customer_email": "customer@test.com",
        "amount": 99.99,
        "items": [
            {"name": "Product A", "quantity": 2, "price": 49.99}
        ]
    }
    
    response = client.post(
        "/api/notification/order-confirmation",
        json=order_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    assert response.json()["status"] == "sent"
    # Verify template was rendered correctly
    assert "ORDER-123" in response.json()["details"]

def test_unauthorized_access_returns_401(client):
    """Integration test: API security enforcement"""
    
    response = client.post(
        "/api/notification/email",
        json={"to": "test@test.com", "subject": "Test", "body": "Test"}
    )
    
    assert response.status_code == 401
```

---

### Step 3: Update CI/CD Pipelines

#### Service-Level CI (Before Docker Build)
Each service workflow should run:
1. Unit tests
2. **Integration tests** (with Testcontainers)
3. Docker build
4. Push to registry

**Example**: `.github/workflows/user-service-ci.yml`
```yaml
name: User Service CI

on:
  push:
    branches: [main]
    paths:
      - 'services/user-service/**'

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      
      - name: Run Unit Tests
        working-directory: services/user-service
        run: ./mvnw test -Dtest=*Test
      
      - name: Run Integration Tests (with Testcontainers)
        working-directory: services/user-service
        run: ./mvnw verify -Dtest=*IT
        env:
          TESTCONTAINERS_RYUK_DISABLED: false
      
      - name: Build Docker Image
        if: success()
        run: |
          docker build -t ghcr.io/${{ github.repository }}/user-service:${{ github.sha }} \
            services/user-service
      
      - name: Push to GHCR
        run: |
          echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/${{ github.repository }}/user-service:${{ github.sha }}
```

#### Post-Deployment Pipeline
After Kubernetes deployment:
1. **API/Contract tests** (formerly "integration-tests")
2. **E2E tests** (Playwright)

---

### Step 4: Update Documentation

**Update** `.github/copilot-instructions.md`:
```markdown
## Testing Strategy

### Unit Tests
- Location: `services/{service}/src/test/java/unit/` or `test/unit/`
- Scope: Single class, mocked dependencies
- Tools: JUnit/Mockito, Jest, pytest
- Run: Every push in service CI

### Integration Tests
- Location: `services/{service}/src/test/java/integration/` or `test/integration/`
- Scope: Controller → Service → Repository → Real Database (Testcontainers)
- Tools: @SpringBootTest + Testcontainers, NestJS TestingModule + Testcontainers, FastAPI TestClient
- Run: Every push in service CI (before Docker build)

### API/Contract Tests
- Location: `/api-tests/` (formerly `/integration-tests/`)
- Scope: Cross-service API contracts via HTTP
- Tools: Jest + Axios/Superagent
- Run: After Kubernetes deployment

### E2E Tests
- Location: `/e2e/`
- Scope: Full user journeys via browser
- Tools: Playwright
- Run: After Kubernetes deployment
```

---

## Implementation Checklist

- [ ] Rename `/integration-tests/` → `/api-tests/`
- [ ] Update workflow: `.github/workflows/integration-tests.yml` → `api-tests.yml`
- [ ] Create `/services/user-service/src/test/java/integration/` directory
- [ ] Move `UserServiceIntegrationTest.java` to integration folder
- [ ] Create `UserControllerIT.java` with REST API + Testcontainers
- [ ] Create `/services/order-service/src/test/java/integration/` directory
- [ ] Create `OrderControllerIT.java` with REST API + Testcontainers
- [ ] Create `/services/product-service/test/integration/` directory
- [ ] Create `product.controller.integration.spec.ts` with Testcontainers
- [ ] Create `/services/notification-service/tests/integration/` directory
- [ ] Create `test_notification_api.py` with FastAPI TestClient
- [ ] Update service CI workflows to run integration tests
- [ ] Update Maven/package.json to distinguish unit vs integration tests
- [ ] Update `.github/copilot-instructions.md` with correct test definitions
- [ ] Document integration test writing guidelines in each service README

---

## Benefits of This Approach

✅ **Clear Boundaries**: Each test level has distinct scope and purpose  
✅ **Fast Feedback**: Integration tests run in service CI, catching issues early  
✅ **True Isolation**: Integration tests don't depend on deployed cluster  
✅ **Parallel Execution**: All services can run integration tests simultaneously  
✅ **Better Coverage**: Real database interactions validated before deployment  
✅ **Cost Efficient**: Testcontainers are ephemeral and run in CI for free  
✅ **Industry Standard**: Follows Martin Fowler's Test Pyramid and Google Testing Blog principles

---

**Generated By**: GitHub Copilot  
**Last Updated**: January 17, 2026
