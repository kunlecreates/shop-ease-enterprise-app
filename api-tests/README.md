# ShopEase API Contract Tests

This directory contains **API contract tests** that validate backend services directly via Kubernetes service URLs. These tests run **AFTER** deployment to verify API contracts, schemas, and business logic in isolation.

## 🏗️ Architecture: API Tests vs E2E Tests

### ✅ API Contract Tests (this directory)
**Purpose**: Test backend service APIs directly, in isolation
- **Target**: Direct Kubernetes service URLs (no ingress, no frontend proxy)
- **Access Method**: `http://product-service.shopease-product.svc.cluster.local/api/product`
- **Runs On**: `arc-runnerset-instance` (self-hosted runner with cluster access)
- **When**: After Kubernetes deployment (via CD workflow or manual trigger)

**Environment Variables**:
```bash
PRODUCT_SERVICE_URL=http://product-service.shopease-product.svc.cluster.local
USER_SERVICE_URL=http://user-service.shopease-user.svc.cluster.local
ORDER_SERVICE_URL=http://order-service.shopease-order.svc.cluster.local
TEST_JWT_SECRET=<shared-secret-for-jwt-generation>
```

### 🌐 E2E Tests (`/e2e` directory)
**Purpose**: Test full user journeys through the browser
- **Target**: Frontend ingress → Frontend → Backends
- **Access Method**: `https://shop.kunlecreates.org` (via Cloudflare)
- **Tool**: Playwright (browser automation)
- **Runs On**: `arc-runnerset-instance`

## 📋 Test Categories

### `contracts/` - Service-to-Service Contract Tests
Tests that validate API contracts between services:
- Request/response schemas
- Data models
- Service integrations
- **Example**: `user-product.contract.test.ts` validates product listing API

### `flows/` - Business Workflow Tests
Tests that validate multi-step business processes:
- Customer checkout flow
- Admin product management
- Stock consistency
- **Example**: `customer-checkout.flow.test.ts` tests cart → items → checkout

### `observability/` - Infrastructure Tests
Tests that validate monitoring and tracing:
- Metrics endpoints
- Trace header propagation
- **Example**: `trace-propagation.test.ts` validates OpenTelemetry headers

## 🚀 Running Tests

### Prerequisites
1. Access to Kubernetes cluster with deployed services
2. Self-hosted runner or `kubectl port-forward` to access services
3. Environment variables configured

### Local Development
```bash
# 1. Copy environment template
cp env/local.env .env

# 2. Set service URLs in .env
PRODUCT_SERVICE_URL=http://localhost:3001  # via port-forward
USER_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
TEST_JWT_SECRET=your-test-secret

# 3. Install dependencies
npm ci

# 4. Run all tests
npm test

# 5. Run specific test suite
npm test contracts/user-product
```

### CI/CD Execution
Tests run automatically after successful deployment:
```bash
# Trigger via workflow
gh workflow run api-tests.yml --ref feat/dev-tests
```

## 🏛️ Design Principles

### Why Direct Service URLs?

✅ **Benefits**:
1. **Isolation**: Tests API contract in isolation (not frontend + API)
2. **Speed**: No extra network hops through ingress/proxy
3. **Debugging**: Clear failure attribution (API vs infrastructure)
4. **Independence**: Frontend changes don't break API tests
5. **True Contracts**: Validates actual service-to-service communication

❌ **Why NOT test through ingress/frontend proxy**:
1. Not testing the API directly
2. Slower execution
3. Mixed concerns (proxy issues mask API issues)
4. Coupled to frontend deployment
5. Defeats contract testing purpose

### Separation of Concerns

| Concern | API Tests (this dir) | E2E Tests (`/e2e`) |
|---------|---------------------|-------------------|
| **What** | Backend API contracts | User journeys |
| **How** | Direct HTTP to services | Browser via ingress |
| **Where** | Kubernetes services | Frontend URL |
| **When** | After deployment | After deployment |
| **Tool** | Jest + Axios | Playwright |

## 📝 Writing New Tests

### Contract Test Template
```typescript
import { productHttp } from '../framework/http';
import { adminLogin } from '../framework/auth';

test('Product API: create product', async () => {
  const { token } = await adminLogin();
  const headers = { 'Authorization': `Bearer ${token}` };

  const resp = await productHttp.post('/api/product', 
    { name: 'Test Product', sku: 'TEST-001', price_cents: 1000 },
    { headers, validateStatus: () => true }
  );

  expect([201, 403]).toContain(resp.status);
});
```

### Best Practices
1. ✅ Use service-specific HTTP clients (`productHttp`, `userHttp`, `orderHttp`)
2. ✅ Set `validateStatus: () => true` to handle all status codes
3. ✅ Test both success and failure scenarios
4. ✅ Clean up created resources (use `framework/cleanup.ts`)
5. ✅ Use descriptive test names that explain what's being validated
6. ❌ Don't depend on test execution order
7. ❌ Don't hardcode URLs or credentials
8. ❌ Don't test frontend behavior (that's E2E)
