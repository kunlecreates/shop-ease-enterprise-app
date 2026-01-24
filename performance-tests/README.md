# Performance Testing with JMeter

This directory contains JMeter test plans for load testing all microservices in the ShopEase application.

## Prerequisites

- Apache JMeter 5.6+ installed
- All services running (user-service, order-service, product-service, notification-service)
- Valid JWT token for authenticated endpoints

## Test Plans

| Service | Test Plan File | Default URL | Threads | Loops | Status |
|---------|---------------|-------------|---------|-------|--------|
| User Service | `user-service-load-test.jmx` | http://localhost:8081 | 50 | 10 | ✅ |
| Product Service | `product-service-load-test.jmx` | http://localhost:3000 | 100 | 10 | ✅ |
| Order Service | `order-service-load-test.jmx` | http://localhost:8082 | 50 | 10 | ✅ |
| Notification Service | `notification-service-load-test.jmx` | http://localhost:8083 | 30 | 10 | ✅ |
| All Services | `all-services-load-test.jmx` | (parameterized) | 200 | 5 | ✅ |

**Note:** For frontend performance testing, see [Frontend Performance Testing](#frontend-performance-testing) section below.

## Running Load Tests

### Basic Run (GUI Mode)
```bash
jmeter -t user-service-load-test.jmx
```

### CLI Mode with Custom Parameters
```bash
# User Service
jmeter -n -t user-service-load-test.jmx \
  -JBASE_URL=http://localhost:8081 \
  -JJWT_TOKEN=your-jwt-token \
  -l results/user-service-results.jtl \
  -e -o results/user-service-report

# Order Service
jmeter -n -t order-service-load-test.jmx \
  -JBASE_URL=http://localhost:8083 \
  -JJWT_TOKEN=your-jwt-token \
  -l results/order-service-results.jtl \
  -e -o results/order-service-report

# Product Service
jmeter -n -t product-service-load-test.jmx \
  -JBASE_URL=http://localhost:8082 \
  -JJWT_TOKEN=your-jwt-token \
  -l results/product-service-results.jtl \
  -e -o results/product-service-report

# Notification Service
jmeter -n -t notification-service-load-test.jmx \
  -JBASE_URL=http://localhost:8084 \
  -JJWT_TOKEN=your-jwt-token \
  -l results/notification-service-results.jtl \
  -e -o results/notification-service-report
```

### Run All Services Test
```bash
jmeter -n -t all-services-load-test.jmx \
  -JUSER_SERVICE_URL=http://localhost:8081 \
  -JORDER_SERVICE_URL=http://localhost:8083 \
  -JPRODUCT_SERVICE_URL=http://localhost:8082 \
  -JNOTIFICATION_SERVICE_URL=http://localhost:8084 \
  -JJWT_TOKEN=your-jwt-token \
  -l results/all-services-results.jtl \
  -e -o results/all-services-report
```

## Generating JWT Token

Use one of these methods to generate a valid JWT token:

### Method 1: cURL (Login)
```bash
# Get JWT token from user-service
JWT_TOKEN=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.token')

echo "JWT_TOKEN=$JWT_TOKEN"
```

### Method 2: Generate Test Token (Python)
```python
import jwt
import datetime

payload = {
    'sub': '1',
    'email': 'admin@example.com',
    'roles': ['ADMIN'],
    'iss': 'shopease',
    'iat': datetime.datetime.utcnow(),
    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
}

token = jwt.encode(payload, 'test-secret-for-jwt-verification', algorithm='HS256')
print(f"JWT_TOKEN={token}")
```

## Load Test Scenarios

### User Service
- **GET /health** - Health check (public)
- **GET /api/user** - List users (requires JWT)
- **GET /api/user/{id}** - Get user by ID (requires JWT, ownership validation)
- **PUT /api/user/{id}** - Update user (requires JWT, ownership validation)

### Order Service
- **GET /health** - Health check (public)
- **GET /api/order** - List orders (requires JWT, filtered by user)
- **POST /api/order** - Create order (requires JWT, extracts userRef from token)
- **GET /api/order/{id}** - Get order by ID (requires JWT, ownership validation)

### Product Service
- **GET /health** - Health check (public)
- **GET /api/product** - List products (public)
- **POST /api/product** - Create product (requires ADMIN JWT)
- **PATCH /api/product/{sku}/stock** - Adjust stock (requires ADMIN JWT)

### Notification Service
- **GET /health** - Health check (public)
- **GET /api/notification/test** - Test endpoint (requires JWT)

## Performance Metrics

### Expected Response Times (95th percentile)
| Service | Endpoint | Expected Response Time |
|---------|----------|------------------------|
| User Service | GET /health | < 50ms |
| User Service | GET /api/user | < 200ms |
| Order Service | GET /health | < 50ms |
| Order Service | POST /api/order | < 500ms |
| Product Service | GET /health | < 50ms |
| Product Service | GET /api/product | < 200ms |
| Notification Service | GET /health | < 50ms |

### Throughput Targets
- User Service: > 500 requests/second
- Order Service: > 200 requests/second
- Product Service: > 800 requests/second
- Notification Service: > 300 requests/second

## Analyzing Results

### View HTML Report
After running tests with `-e -o`, open the HTML report:
```bash
# Linux/Mac
open results/user-service-report/index.html

# Or start a simple HTTP server
python3 -m http.server 8000 --directory results/user-service-report
# Then visit http://localhost:8000
```

### Key Metrics to Monitor
1. **Response Time (Latency)**
   - Average: Should be within acceptable range
   - 95th/99th percentile: Watch for outliers
   
2. **Throughput**
   - Requests per second
   - Should meet or exceed targets

3. **Error Rate**
   - Target: < 0.1% errors
   - Monitor for 401, 403, 500 errors

4. **Resource Utilization**
   - Monitor CPU, memory, database connections during tests
   - Use `docker stats` or Kubernetes metrics

## Frontend Performance Testing

**JMeter is NOT suitable for frontend performance testing.** JMeter tests HTTP APIs (backend services), not browser rendering, JavaScript execution, or user experience metrics.

### Recommended Tools for Frontend Performance

#### 1. **Lighthouse CI (Recommended)** ⭐
Lighthouse provides Web Vitals metrics that matter for user experience:
- **LCP** (Largest Contentful Paint): Should be < 2.5s
- **FID** (First Input Delay): Should be < 100ms
- **CLS** (Cumulative Layout Shift): Should be < 0.1
- **TTI** (Time to Interactive): Should be < 3.8s

**Setup:**
```yaml
# .github/workflows/lighthouse-ci.yml
name: Frontend Performance — Lighthouse CI

on:
  workflow_run:
    workflows: ["CD — Kubernetes Deploy (Helm)"]
    types: [completed]
  workflow_dispatch:

jobs:
  lighthouse:
    runs-on: arc-runnerset-instance
    steps:
      - uses: actions/checkout@v4
      
      - name: Use Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Lighthouse CI
        run: npm install -g @lhci/cli@0.13.x
      
      - name: Run Lighthouse CI
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
        run: |
          lhci autorun \
            --collect.url=https://shop.kunlecreates.org \
            --collect.numberOfRuns=3 \
            --assert.preset=lighthouse:recommended \
            --upload.target=temporary-public-storage
      
      - name: Upload Lighthouse Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: lighthouse-report
          path: .lighthouseci/
```

**Lighthouse Configuration** (`lighthouserc.json`):
```json
{
  "ci": {
    "collect": {
      "url": ["https://shop.kunlecreates.org"],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "throttling": {
          "rttMs": 40,
          "throughputKbps": 10240,
          "cpuSlowdownMultiplier": 1
        }
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 300}]
      }
    }
  }
}
```

#### 2. **Playwright Performance Testing** (Already Available)
You can extend existing Playwright E2E tests to capture performance metrics:

```typescript
// e2e/tests/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Frontend Performance', () => {
  test('Home page loads within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('https://shop.kunlecreates.org');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Assert load time < 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Get Web Vitals via Performance API
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries.map(e => ({
            name: e.name,
            value: e.startTime
          })));
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        setTimeout(() => resolve([]), 5000);
      });
    });
    
    console.log('Performance metrics:', metrics);
  });
  
  test('Product page renders within budget', async ({ page }) => {
    await page.goto('https://shop.kunlecreates.org/products');
    
    // Check for large images that could slow down loading
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src) {
        console.log(`Checking image: ${src}`);
        // Could add size checks here
      }
    }
  });
});
```

#### 3. **Bundle Size Monitoring**
Monitor JavaScript bundle sizes to prevent bloat:

```bash
# In your frontend build
npm run build -- --stats

# Check bundle sizes
npx bundlesize
```

---

## Backend Performance Testing (JMeter)

### Continuous Performance Testing in CI/CD

Integrate JMeter tests into your Kubernetes-based CI/CD pipeline:

```yaml
# .github/workflows/performance-tests.yml
name: Performance Tests — JMeter

on:
  schedule:
    - cron: '0 3 * * 1'  # Weekly on Monday at 3 AM UTC
  workflow_dispatch:
    inputs:
      test_plan:
        description: 'Test plan to run (all-services, user, product, order, notification)'
        required: true
        default: 'all-services'
      target_env:
        description: 'Target environment (staging, prod)'
        required: true
        default: 'staging'

jobs:
  jmeter-load-test:
    runs-on: arc-runnerset-instance
    env:
      STAGING_BASE_URL: https://shop.kunlecreates.org
      PROD_BASE_URL: https://shop.kunlecreates.org  # Update when prod is different
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Set up kubectl
        uses: azure/setup-kubectl@v4
        with:
          version: v1.30.0
      
      - name: Verify services are running
        run: |
          set -euo pipefail
          echo "Checking service health in staging..."
          
          NAMESPACES="shopease-user shopease-product shopease-order shopease-notification"
          for ns in $NAMESPACES; do
            echo "Namespace: $ns"
            kubectl get pods -n $ns -l 'app.kubernetes.io/name in (user-service,product-service,order-service,notification-service)'
            
            # Ensure at least 1 pod is Ready
            READY=$(kubectl get pods -n $ns -l 'app.kubernetes.io/name in (user-service,product-service,order-service,notification-service)' -o jsonpath='{range .items[*]}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}' | grep -c "True" || echo "0")
            
            if [ "$READY" -lt 1 ]; then
              echo "ERROR: No ready pods in $ns"
              exit 1
            fi
          done
      
      - name: Install JMeter
        run: |
          if [ ! -d "$HOME/apache-jmeter-5.6.3" ]; then
            echo "Installing JMeter 5.6.3..."
            cd $HOME
            wget -q https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.3.tgz
            tar -xzf apache-jmeter-5.6.3.tgz
            rm apache-jmeter-5.6.3.tgz
          else
            echo "JMeter already installed"
          fi
          
          echo "$HOME/apache-jmeter-5.6.3/bin" >> $GITHUB_PATH
      
      - name: Get JWT Token for authenticated tests
        id: jwt
        run: |
          set -euo pipefail
          
          BASE_URL="${{ env.STAGING_BASE_URL }}"
          if [ "${{ inputs.target_env }}" = "prod" ]; then
            BASE_URL="${{ env.PROD_BASE_URL }}"
          fi
          
          echo "Getting JWT token from ${BASE_URL}/user-service/api/user/login..."
          
          JWT_TOKEN=$(curl -sS -X POST "${BASE_URL}/user-service/api/user/login" \
            -H "Content-Type: application/json" \
            -H "CF-Access-Client-Id: ${{ secrets.CF_ACCESS_CLIENT_ID }}" \
            -H "CF-Access-Client-Secret: ${{ secrets.CF_ACCESS_CLIENT_SECRET }}" \
            -d '{"email":"loadtest@shopease.com","password":"${{ secrets.LOADTEST_USER_PASSWORD }}"}' \
            | jq -r '.token')
          
          if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" = "null" ]; then
            echo "ERROR: Failed to obtain JWT token"
            exit 1
          fi
          
          echo "::add-mask::$JWT_TOKEN"
          echo "JWT_TOKEN=$JWT_TOKEN" >> $GITHUB_OUTPUT
      
      - name: Run JMeter Test
        run: |
          set -euo pipefail
          
          BASE_URL="${{ env.STAGING_BASE_URL }}"
          TEST_PLAN="${{ inputs.test_plan }}"
          
          mkdir -p results
          
          case "$TEST_PLAN" in
            user)
              jmeter -n -t performance-tests/user-service-load-test.jmx \
                -JBASE_URL="${BASE_URL}/user-service" \
                -JJWT_TOKEN="${{ steps.jwt.outputs.JWT_TOKEN }}" \
                -l results/user-results.jtl \
                -e -o results/user-report \
                -j results/jmeter.log
              ;;
            product)
              jmeter -n -t performance-tests/product-service-load-test.jmx \
                -JBASE_URL="${BASE_URL}/product-service" \
                -JJWT_TOKEN="${{ steps.jwt.outputs.JWT_TOKEN }}" \
                -l results/product-results.jtl \
                -e -o results/product-report \
                -j results/jmeter.log
              ;;
            order)
              jmeter -n -t performance-tests/order-service-load-test.jmx \
                -JBASE_URL="${BASE_URL}/order-service" \
                -JJWT_TOKEN="${{ steps.jwt.outputs.JWT_TOKEN }}" \
                -l results/order-results.jtl \
                -e -o results/order-report \
                -j results/jmeter.log
              ;;
            notification)
              jmeter -n -t performance-tests/notification-service-load-test.jmx \
                -JBASE_URL="${BASE_URL}/notification-service" \
                -l results/notification-results.jtl \
                -e -o results/notification-report \
                -j results/jmeter.log
              ;;
            all-services)
              jmeter -n -t performance-tests/all-services-load-test.jmx \
                -JUSER_BASE_URL="${BASE_URL}/user-service" \
                -JPRODUCT_BASE_URL="${BASE_URL}/product-service" \
                -JORDER_BASE_URL="${BASE_URL}/order-service" \
                -JNOTIFICATION_BASE_URL="${BASE_URL}/notification-service" \
                -JJWT_TOKEN="${{ steps.jwt.outputs.JWT_TOKEN }}" \
                -l results/all-services-results.jtl \
                -e -o results/all-services-report \
                -j results/jmeter.log
              ;;
            *)
              echo "Unknown test plan: $TEST_PLAN"
              exit 1
              ;;
          esac
      
      - name: Parse Results and Check Thresholds
        run: |
          set -euo pipefail
          
          echo "=== JMeter Test Results ==="
          
          # Parse the JTL file for key metrics
          if [ -f results/*-results.jtl ]; then
            echo "Response times (ms):"
            awk -F',' 'NR>1 {sum+=$2; count++} END {print "Average:", sum/count}' results/*-results.jtl
            awk -F',' 'NR>1 {print $2}' results/*-results.jtl | sort -n | awk '{a[NR]=$1} END {print "95th percentile:", a[int(NR*0.95)]}'
            
            echo ""
            echo "Error rate:"
            awk -F',' 'NR>1 {total++; if($8=="false") errors++} END {print errors/total*100 "%"}' results/*-results.jtl
            
            # Fail if error rate > 1%
            ERROR_RATE=$(awk -F',' 'NR>1 {total++; if($8=="false") errors++} END {print errors/total*100}' results/*-results.jtl)
            if (( $(echo "$ERROR_RATE > 1.0" | bc -l) )); then
              echo "ERROR: Error rate ${ERROR_RATE}% exceeds threshold of 1%"
              exit 1
            fi
          fi
      
      - name: Upload JMeter Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: jmeter-results-${{ inputs.test_plan }}-${{ github.run_number }}
          path: |
            results/**/*
            !results/**/*.jtl
          retention-days: 30
      
      - name: Comment PR with Results (if PR context)
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const resultsPath = 'results/all-services-report/statistics.json';
            
            if (fs.existsSync(resultsPath)) {
              const stats = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
              
              let comment = '## 📊 JMeter Performance Test Results\n\n';
              comment += '| Metric | Value |\n';
              comment += '|--------|-------|\n';
              comment += `| Total Requests | ${stats.Total.sampleCount} |\n`;
              comment += `| Error Rate | ${stats.Total.errorPct}% |\n`;
              comment += `| Avg Response Time | ${stats.Total.meanResTime}ms |\n`;
              comment += `| 95th Percentile | ${stats.Total.pct3ResTime}ms |\n`;
              comment += `| Throughput | ${stats.Total.throughput} req/s |\n`;
              
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }
```

## Troubleshooting

### JWT Token Expired
Generate a new token with longer expiration or refresh during test execution.

### Connection Refused
Ensure all services are running and accessible at specified URLs.

### High Error Rate
- Check service logs for errors
- Verify database connections
- Ensure sufficient resources (CPU/memory)
- Reduce concurrent threads if overwhelming services

## PRD Compliance

These load tests validate:
- **FR016**: Testing & Quality Assurance (performance validation)
- **NFR002**: Performance targets (response times, throughput)
- **NFR008**: Testability (automated performance testing in CI/CD)

## Quick Start Guide

### 1. Create Load Test User
Before running load tests, create a dedicated test user:

```bash
curl -X POST https://shop.kunlecreates.org/user-service/api/user/register \
  -H "Content-Type: application/json" \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  -d '{
    "email": "loadtest@shopease.com",
    "password": "secure-test-password-123",
    "firstName": "Load",
    "lastName": "Test"
  }'
```

Store the password in GitHub Secrets as `LOADTEST_USER_PASSWORD`.

### 2. Run Manual Test
```bash
# Get JWT token
JWT_TOKEN=$(curl -sS -X POST https://shop.kunlecreates.org/user-service/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"loadtest@shopease.com","password":"your-password"}' \
  | jq -r '.token')

# Run test
jmeter -n -t performance-tests/all-services-load-test.jmx \
  -JUSER_BASE_URL=https://shop.kunlecreates.org/user-service \
  -JPRODUCT_BASE_URL=https://shop.kunlecreates.org/product-service \
  -JORDER_BASE_URL=https://shop.kunlecreates.org/order-service \
  -JNOTIFICATION_BASE_URL=https://shop.kunlecreates.org/notification-service \
  -JJWT_TOKEN=$JWT_TOKEN \
  -l results.jtl \
  -e -o report/

# View results
open report/index.html
```

### 3. Trigger CI/CD Test
```bash
gh workflow run performance-tests.yml \
  --field test_plan=all-services \
  --field target_env=staging
```

---

**Last Updated**: January 24, 2026
