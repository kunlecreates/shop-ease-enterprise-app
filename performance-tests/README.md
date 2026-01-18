# Performance Testing with JMeter

This directory contains JMeter test plans for load testing all microservices in the ShopEase application.

## Prerequisites

- Apache JMeter 5.6+ installed
- All services running (user-service, order-service, product-service, notification-service)
- Valid JWT token for authenticated endpoints

## Test Plans

| Service | Test Plan File | Default URL | Threads | Loops |
|---------|---------------|-------------|---------|-------|
| User Service | `user-service-load-test.jmx` | http://localhost:8081 | 50 | 10 |
| Order Service | `order-service-load-test.jmx` | http://localhost:8083 | 50 | 10 |
| Product Service | `product-service-load-test.jmx` | http://localhost:8082 | 100 | 10 |
| Notification Service | `notification-service-load-test.jmx` | http://localhost:8084 | 30 | 10 |
| All Services | `all-services-load-test.jmx` | - | 200 | 10 |

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

## Continuous Performance Testing

Integrate JMeter tests into CI/CD pipeline:

```yaml
# .github/workflows/performance-tests.yml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  jmeter-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Start Services
        run: docker-compose up -d
      
      - name: Wait for Services
        run: sleep 30
      
      - name: Install JMeter
        run: |
          wget https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.3.tgz
          tar -xzf apache-jmeter-5.6.3.tgz
      
      - name: Run Performance Tests
        run: |
          JWT_TOKEN=$(curl -s -X POST http://localhost:8081/api/auth/login \
            -H "Content-Type: application/json" \
            -d '{"email":"admin@example.com","password":"admin123"}' \
            | jq -r '.token')
          
          apache-jmeter-5.6.3/bin/jmeter -n \
            -t performance-tests/all-services-load-test.jmx \
            -JJWT_TOKEN=$JWT_TOKEN \
            -l results.jtl \
            -e -o report
      
      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: jmeter-results
          path: report/
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

---

**Last Updated**: January 17, 2026
