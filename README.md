# ShopEase eCommerce Platform

![CI Tests](https://github.com/kunlecreates/shop-ease-enterprise-app/actions/workflows/e2e.yml/badge.svg)
![CI Builds](https://github.com/kunlecreates/shop-ease-enterprise-app/actions/workflows/build-images.yaml/badge.svg)
![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/kunlecreates/shop-ease-enterprise-app/coverage-badge/badge.json)
![Stars](https://img.shields.io/github/stars/kunlecreates/shop-ease-enterprise-app?style=flat)
![Visitors](https://hits.sh/github.com/kunlecreates/shop-ease-enterprise-app.svg?label=Visitors&style=flat&color=0e75b6)
![License](https://img.shields.io/github/license/kunlecreates/shop-ease-enterprise-app)

> **A production-grade microservices eCommerce platform** demonstrating enterprise-level patterns: Domain-Driven Design, Test-Driven Development, GitOps, multi-database polyglot persistence, comprehensive observability, and zero-trust security on Kubernetes.

---

## 🎯 Project Status

**Overall Completion**: 97% (Production-Ready)  
**Current Phase**: Phase 7 Complete — Test Coverage Optimization  
**Last Updated**: March 2026

### What's Operational ✅
- ✅ **4 Microservices**: User, Product, Order, Notification (all deployed)
- ✅ **Next.js 15 Frontend**: React 19 + App Router + shadcn/ui
- ✅ **CI/CD Pipeline**: GitHub Actions → GHCR → Kubernetes via Helm
- ✅ **Test Automation**: Unit, Integration (Testcontainers), API Contracts, E2E (Playwright)
- ✅ **Coverage Authority**: Automated aggregate code coverage tracking (~85%+ current)
- ✅ **Kubernetes Deployment**: MicroK8s + Helm + NGINX Ingress + NetworkPolicies
- ✅ **Observability Stack**: Prometheus, Grafana, Jaeger, Elasticsearch/Kibana (deployed externally)
- ✅ **Security**: JWT authentication, bcrypt passwords, email verification, password reset
- ✅ **Cross-Service Integration**: Order → Notification, Product inventory management

### In Progress 🚧
- 🚧 **Grafana Dashboards**: Infrastructure ready, service-specific dashboards pending
- 🚧 **Performance Testing**: JMeter plans exist, baseline not yet established
- 🚧 **Grafana Alert Rules**: Alertmanager deployed, rules pending configuration

---

## 🏗️ Architecture

### High-Level Design

```
┌──────────────────────────────────────────────────────────────────┐
│                   Cloudflare Tunnel + Access                     │
│              (shop-ease.kunlecreates.org)                        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                    NGINX Ingress Controller                      │
│             (TLS termination, path-based routing)                │
└──────┬──────────────┬──────────────┬──────────────┬──────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐
  │  User   │  │ Product  │  │   Order   │  │ Notification │
  │ Service │  │ Service  │  │  Service  │  │   Service    │
  └────┬────┘  └────┬─────┘  └─────┬─────┘  └──────┬───────┘
       │            │              │               │
       ▼            ▼              ▼               ▼
  ┌─────────┐  ┌──────────┐  ┌─────────┐   ┌─────────────┐
  │ Oracle  │  │PostgreSQL│  │  MSSQL  │   │ Email API   │
  │   DB    │  │    DB    │  │   DB    │   │  (Mock)     │
  └─────────┘  └──────────┘  └─────────┘   └─────────────┘
```

**Observability Layer** (External):
- **Prometheus** → Metrics collection (HTTP, JVM, DB)
- **Grafana** → Dashboards and alerting
- **Jaeger** → Distributed tracing
- **Elasticsearch + Kibana** → Log aggregation and search
- **OpenTelemetry Operator** → Auto-instrumentation for Java services

---

## 🛠️ Tech Stack

### Backend Services

| Service | Language/Framework | Database | Key Features |
|---------|-------------------|----------|--------------|
| **user-service** | Java 21 + Spring Boot 3.3 | Oracle DB | Authentication, Authorization, Email verification, Password reset |
| **order-service** | Java 21 + Spring Boot 3.3 | MS SQL Server | Order management, Cart operations, Payment processing, Notification integration |
| **product-service** | Node.js 20 + NestJS 10 | PostgreSQL 15 | Product catalog, Search (full-text), Inventory tracking, Categories |
| **notification-service** | Python 3.12 + FastAPI | N/A (stateless) | Email templates (Jinja2), SMTP integration, Order confirmations |

### Frontend
- **Next.js 15.5** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** for component library
- **API Proxies**: Server-side routes forward to backend ClusterIP services
- **Authentication**: JWT-based with HttpOnly cookies

### Infrastructure & DevOps
- **Kubernetes**: MicroK8s 1.30+ (single-node development cluster)
- **Container Registry**: GitHub Container Registry (GHCR)
- **CI/CD**: GitHub Actions with self-hosted ARC runner
- **IaC**: Helm charts (per-service + umbrella chart)
- **Service Mesh**: NetworkPolicies for zero-trust networking
- **Ingress**: NGINX Ingress Controller + Cloudflare Tunnel
- **Secret Management**: Kubernetes Secrets (Vault integration planned)

### Testing & Quality
- **Unit Tests**: JUnit 5 + Mockito (Java), Jest (TypeScript/JavaScript), pytest (Python)
- **Integration Tests**: Testcontainers (real databases in CI)
- **API Contract Tests**: Supertest (NestJS), RestAssured (Java)
- **E2E Tests**: Playwright (browser-based, post-deployment)
- **Coverage Authority**: Automated multi-workflow aggregation (~85%+ current)
- **Performance Tests**: JMeter (load testing framework)

---

## 📂 Repository Structure

```
ShopEase-dbs/
│
├── services/                         # Microservices (each with own Helm chart)
│   ├── user-service/                 # Spring Boot 3 + Oracle DB
│   │   ├── src/                      # DDD structure: domain/application/infrastructure/interfaces
│   │   ├── test/                     # Unit + Integration tests (Testcontainers)
│   │   ├── helm/                     # Kubernetes deployment manifests
│   │   └── pom.xml
│   ├── order-service/                # Spring Boot 3 + MS SQL Server
│   │   ├── src/
│   │   ├── test/
│   │   ├── helm/
│   │   └── pom.xml
│   ├── product-service/              # NestJS 10 + PostgreSQL
│   │   ├── src/                      # NestJS modules: domain/application/presentation
│   │   ├── test/                     # Jest unit + integration + security tests
│   │   ├── helm/
│   │   └── package.json
│   └── notification-service/         # Python 3.12 + FastAPI
│       ├── app/
│       ├── tests/                    # pytest unit + integration tests
│       ├── helm/
│       └── requirements.txt
│
├── frontend/                         # Next.js 15 App Router + React 19
│   ├── app/                          # Pages and API routes (server-side proxies)
│   ├── components/                   # shadcn/ui components
│   ├── contexts/                     # React contexts (Auth, Cart)
│   ├── lib/                          # Utilities (API client, cart store)
│   └── __tests__/                    # Jest component tests
│
├── observability/                    # OpenTelemetry auto-instrumentation
│   ├── README.md                     # Observability directory overview
│   └── instrumentation/              # Language-specific Instrumentation CRs
│       ├── deploy.sh                 # Deployment script for all CRs
│       ├── nodejs-instrumentation*.yaml     # Node.js services (product, frontend)
│       ├── python-instrumentation.yaml      # Python services (notification)
│       └── java-instrumentation*.yaml       # Java services (user, order)
│
├── api-tests/                        # Post-deployment API contract tests
│   ├── contracts/                    # Service-to-service contract validation
│   ├── flows/                        # End-to-end business flow tests
│   └── framework/                    # Test utilities, schemas, HTTP clients
│
├── e2e/                              # Playwright browser-based E2E tests
│   ├── tests/                        # User journey tests (auth, checkout, admin)
│   └── playwright.config.ts
│
├── helm-charts/                      # Umbrella chart (optional, for full-stack deploys)
│   ├── templates/                    # Global ingress, RBAC
│   ├── values-staging.yaml           # Staging environment configuration
│   └── Chart.yaml
│
├── .github/workflows/                # CI/CD pipelines
│   ├── ci-{service}.yml              # Per-service CI (test → build → deploy)
│   ├── coverage-authority.yml        # Aggregate coverage from all services
│   ├── api-tests.yml                 # Post-deployment contract validation
│   ├── e2e.yml                       # Playwright E2E tests
│   └── infra-provisioning.yml        # Database and infrastructure setup
│
├── docs/                             # Architecture, PRD, ADRs, guides
│   ├── PRD_COMPLETION_ASSESSMENT.md  # Feature completion tracking
│   ├── PROJECT_COMPLETION_STATUS.md  # Overall project status
│   ├── coverage-gap-analysis-*.md    # Test coverage analysis reports
│   └── guides/                       # How-to guides (observability, testing, etc.)
│
├── performance-tests/                # JMeter load testing
│   └── shopease-load-test.jmx
│
├── scripts/                          # Utility scripts
│   ├── local-dev-setup.sh            # Local development environment
│   └── cleanup-*.sh                  # Cleanup scripts for local resources
│
└── tmp/                              # Temporary build artifacts (gitignored)
```

---

## 🧪 Testing Strategy

This project implements a **comprehensive 4-layer testing pyramid** with clear ownership boundaries.

### Test Pyramid Architecture

```
        /\
       /E2E\         ← Playwright (browser, full system, post-deployment)
      /-----\
     /  API  \       ← API Contract Tests (HTTP, post-deployment)
    /---------\
   /Integration\     ← Testcontainers (real DB, pre-deployment, blocks CI)
  /-------------\
 /     Unit      \   ← Mocked dependencies (fast, blocks PR)
/_________________\
```

### Layer 1: Unit Tests (Per-Service)
**Location**: `services/*/test/`  
**Runs**: On every push, before PR merge  
**Purpose**: Validate individual classes/functions with mocked dependencies  
**Tools**:
- Java: JUnit 5 + Mockito
- TypeScript: Jest + Supertest
- Python: pytest + unittest.mock

**Example**: `AuthServiceTest.java` → Tests authentication logic with mocked UserRepository

### Layer 2: Integration Tests (Per-Service)
**Location**: `services/*/test/integration/`  
**Runs**: On every push, before Docker build, **blocks PR merge**  
**Purpose**: Validate full stack (Controller → Service → DB) with real databases  
**Tools**:
- **Testcontainers** (PostgreSQL, MSSQL, Oracle containers)
- Real HTTP requests to service endpoints
- Database state verification

**Example**: `ProductControllerIT.ts` → Creates product via API, verifies PostgreSQL persistence

**Key Benefit**: Catches database migration issues, query bugs, and transaction problems **before deployment** (5 min vs 20+ min feedback loop)

### Layer 3: API Contract Tests (Cross-Service)
**Location**: `/api-tests/contracts/`  
**Runs**: After deployment to staging/dev cluster  
**Purpose**: Validate API contracts between services  
**Test Types**:
- **Contract Tests**: Schema validation, required fields, error codes
  - Example: `user-product.contract.test.ts` → Validates product-service API matches user-service expectations
- **Flow Tests**: Multi-service business flows
  - Example: `checkout.flow.test.ts` → User login → Browse products → Add to cart → Checkout → Order confirmation

**Environment**: Tests against **live deployed services** in Kubernetes (real ingress, auth, networking)

### Layer 4: End-to-End (E2E) Tests
**Location**: `/e2e/`  
**Runs**: After deployment (does not block PR merge)  
**Purpose**: Validate real user journeys via browser  
**Tools**: Playwright (Chromium, Firefox, WebKit)  
**Coverage**:
- User registration with email verification
- Product search and filtering
- Shopping cart and checkout flow
- Admin product management
- Payment processing simulation

**Example**: `checkout.spec.ts` → Full browser automation from landing page to order confirmation

### Coverage Tracking
**Current Coverage**: ~85%+ aggregate (Target: 90%)  
**Coverage Authority Workflow**: Aggregates coverage from all 5 service CI runs after completion  
**Report**: Published to `coverage-badge` branch, displayed in README badge  
**Gap Analysis**: [docs/coverage-gap-analysis-2025-01.md](docs/coverage-gap-analysis-2025-01.md) — Priority 1 tests completed in Phase 7

---

## 🚀 CI/CD Pipeline

### Workflow Architecture

```
Developer Push
      │
      ├─► Per-Service CI (Parallel, blocks PR)
      │   ├─ user-service: Unit → Integration → Build Docker
      │   ├─ order-service: Unit → Integration → Build Docker
      │   ├─ product-service: Unit → Integration → Build Docker
      │   ├─ notification-service: Unit → Integration → Build Docker
      │   └─ frontend: Unit → Build Docker
      │
      ├─► Coverage Authority (Aggregates after all 5 complete)
      │   ├─ Downloads coverage artifacts from each service
      │   ├─ Normalizes to unified JSON schema
      │   ├─ Calculates aggregate coverage
      │   └─ Publishes badge to coverage-badge branch
      │
      └─► PR Merge (if all checks pass)
          │
          ├─► Build & Push Images (GHCR)
          │
          ├─► Deploy to Kubernetes (Helm)
          │   ├─ Update ConfigMaps/Secrets
          │   ├─ Helm upgrade --install
          │   └─ Wait for rollout completion
          │
          ├─► API Contract Tests (Post-deployment validation)
          │
          └─► Playwright E2E Tests (Optional, non-blocking)
```

### Key Workflows

| Workflow | Trigger | Blocks PR? | Purpose |
|----------|---------|-----------|---------|
| `ci-{service}.yml` | Push to service files | ✅ Yes | Unit + Integration tests, Docker build |
| `ci-frontend-tests.yml` | Push to frontend files | ✅ Yes | Frontend Jest unit tests |
| `coverage-authority.yml` | After all service CIs complete | ✅ Yes | Aggregate coverage tracking |
| `api-tests.yml` | After deployment | ✅ Yes (configurable) | Cross-service contract validation |
| `e2e.yml` | After deployment | ❌ No | Browser-based user journey tests |
| `infra-provisioning.yml` | Manual trigger | N/A | Database setup (Oracle, MSSQL, PostgreSQL) |

### CI/CD Best Practices Implemented
- ✅ **Fail Fast**: Unit tests run before integration tests
- ✅ **Real Databases**: Testcontainers prevents "works on my machine" issues
- ✅ **Parallel Execution**: All 5 services test independently (3-5 min total)
- ✅ **Artifact Reuse**: Docker images built once, reused across environments
- ✅ **GitOps**: Infrastructure changes tracked in Git, deployed via Helm
- ✅ **Self-Hosted Runners**: GitHub ARC runner on local cluster (faster, cost-effective)

---

## 🔭 Observability & Monitoring

### Deployed Stack (External to ShopEase)
The observability infrastructure is **fully deployed** in separate namespaces. OpenTelemetry auto-instrumentation configurations for all ShopEase services are managed in the [observability/](observability/) directory.

| Component | Namespace | Purpose | Status |
|-----------|-----------|---------|--------|
| **Prometheus** | `prometheus-system` | Metrics collection (HTTP, JVM, DB) | ✅ Operational |
| **Grafana** | `grafana-system` | Dashboards and visualizations | ✅ Operational |
| **Jaeger v2** | `opentelemetry-system` | Distributed tracing | ✅ Operational |
| **Elasticsearch + Kibana** | `observability-system` | Log aggregation and search | ✅ Operational |
| **OpenTelemetry Operator** | `opentelemetry-system` | Auto-instrumentation for Java | ✅ Operational |

### Service Integration Status
- ✅ **All Services**: Auto-instrumented via OpenTelemetry Operator (optimized for minimal overhead)
  - Java services (user, order): Java Agent auto-instrumentation
  - Node.js services (product, frontend): Node.js auto-instrumentation
  - Python service (notification): Python auto-instrumentation
- ✅ **Prometheus Endpoints**: All services expose `/actuator/prometheus` or `/metrics`
- ✅ **Optimized Instrumentation**: Only instrumenting libraries actually used (40-60% overhead reduction)
- 🚧 **Grafana Dashboards**: Infrastructure ready, service-specific dashboards pending
- 🚧 **Alert Rules**: Alertmanager deployed, rules pending configuration

### What You Get Out-of-the-Box
- **Request Rate**: HTTP requests per second per service
- **Error Rate**: 4xx/5xx HTTP error percentages
- **Duration**: P50/P95/P99 latency metrics
- **JVM Metrics**: Heap usage, GC pauses, thread counts (Java services)
- **Database Metrics**: Connection pool usage, query duration
- **Distributed Traces**: Full request path across services with timing breakdown

**Documentation**:
- [Observability Directory README](observability/README.md) - Quick start and configuration
- [Instrumentation Guide](observability/instrumentation/README.md) - Detailed per-service setup
- [Complete Implementation Summary](docs/OTEL_COMPLETE_IMPLEMENTATION_SUMMARY.md) - Full technical details

---

## 🔐 Security Architecture

### Authentication & Authorization
- **JWT-based authentication** with RS256 signing
- **Bcrypt password hashing** (cost factor 12)
- **Email verification** required before full access
- **Password reset** with time-limited, single-use tokens (bcrypt-hashed)
- **Role-based access control** (CUSTOMER, ADMIN)
- **HttpOnly cookies** for JWT storage (frontend)

### Network Security
- **Zero-trust NetworkPolicies**: Services can only talk to explicitly allowed destinations
- **TLS termination** at NGINX Ingress
- **Cloudflare Access** for external access control
- **Service-to-service mTLS** (planned via service mesh)

### Secret Management
- **Kubernetes Secrets** for sensitive data (DB credentials, JWT keys)
- **GitHub Secrets** for CI/CD credentials
- **Environment-specific configuration** (dev, staging, production)
- **HashiCorp Vault integration** (planned for production)

### Compliance & Best Practices
- ✅ OWASP Top 10 mitigations (SQL injection prevention, XSS protection, CSRF tokens)
- ✅ Secure headers (CSP, HSTS, X-Frame-Options)
- ✅ Input validation on all API endpoints
- ✅ Rate limiting (via NGINX Ingress)
- ✅ Audit logging (all authentication events)

---

## 🚀 Getting Started

### Prerequisites
- **Docker**: 26+ (for Testcontainers)
- **Kubernetes**: MicroK8s 1.30+ or equivalent
- **Helm**: 3.15+
- **Java**: 21 (LTS)
- **Node.js**: 20.x (LTS)
- **Python**: 3.12+
- **kubectl**: Configured for your cluster

### Quick Start (Local Development)

#### 1. Clone Repository
```bash
git clone https://github.com/kunlecreates/shop-ease-enterprise-app.git
cd shop-ease-enterprise-app
```

#### 2. Setup Databases (One-Time)
```bash
# Deploy PostgreSQL, MSSQL, Oracle to Kubernetes
.github/workflows/infra-provisioning.yml  # Review and run manually
```

#### 3. Run Individual Service Tests
```bash
# User Service (Java + Oracle)
cd services/user-service
mvn clean test                     # Unit tests
mvn verify                         # Integration tests (Testcontainers)

# Product Service (NestJS + PostgreSQL)
cd services/product-service
npm ci
npm run test:unit                  # Unit tests
npm run test:integration           # Integration tests (Testcontainers)

# Order Service (Java + MSSQL)
cd services/order-service
mvn clean test
mvn verify

# Notification Service (Python)
cd services/notification-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pytest tests/unit                  # Unit tests
pytest tests/integration           # Integration tests
```

#### 4. Deploy to Kubernetes
```bash
# Deploy all services
helm upgrade --install shopease helm-charts/ \
  -f helm-charts/values-staging.yaml \
  --namespace shopease-system --create-namespace

# Or deploy individual services
cd services/user-service/helm
helm upgrade --install user-service . \
  --namespace shopease-user --create-namespace

# Check deployment status
kubectl get pods -n shopease-user
kubectl logs -f deployment/user-service -n shopease-user
```

#### 5. Access Services
```bash
# Via Cloudflare Tunnel (if configured)
curl https://shop-ease.kunlecreates.org/api/user/health

# Via Port-Forward (local development)
kubectl port-forward svc/user-service -n shopease-user 8080:8080
curl http://localhost:8080/api/user/health
```

#### 6. Run E2E Tests
```bash
cd e2e
npm ci
npx playwright install --with-deps
E2E_BASE_URL=https://shop-ease.kunlecreates.org npx playwright test
```

### Sparse Checkout (Work on Single Service)
```bash
# Clone with sparse support
git clone --filter=blob:none --sparse git@github.com:kunlecreates/shop-ease-enterprise-app.git
cd shop-ease-enterprise-app

# Check out only the service you need
git sparse-checkout set services/order-service

# Add more services later
git sparse-checkout add services/product-service frontend
```

---

## 📖 Documentation

### Architecture & Design
- [ShopEase-PRD.md](ShopEase-PRD.md) - Product Requirements Document
- [docs/PRD_COMPLETION_ASSESSMENT.md](docs/PRD_COMPLETION_ASSESSMENT.md) - Feature completion tracking
- [docs/PROJECT_COMPLETION_STATUS.md](docs/PROJECT_COMPLETION_STATUS.md) - Overall project status
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - AI-assisted development guidelines

### Developer Guides
- [DEVELOPER_WORKFLOWS.md](DEVELOPER_WORKFLOWS.md) - Local development workflows
- [docs/guides/OBSERVABILITY_INTEGRATION_GUIDE.md](docs/guides/OBSERVABILITY_INTEGRATION_GUIDE.md) - Connect services to observability stack
- [docs/coverage-gap-analysis-2025-01.md](docs/coverage-gap-analysis-2025-01.md) - Test coverage improvement roadmap
- [docs/implementation-tracking/INTEGRATION_TESTING_STRATEGY.md](docs/implementation-tracking/INTEGRATION_TESTING_STRATEGY.md) - Testing philosophy

### API Documentation
- [Postman Collection](docs/postman/) - API request examples
- [OpenAPI Specs](docs/api/) - Auto-generated from code

---

## 🎯 Roadmap

### Completed ✅
- [x] Microservices architecture (4 services + frontend)
- [x] Database migrations (Flyway + manual SQL)
- [x] JWT authentication with email verification
- [x] Product catalog with full-text search
- [x] Order management with cart operations
- [x] Email notifications (order confirmation, shipping)
- [x] Comprehensive test automation (unit, integration, API, E2E)
- [x] CI/CD pipeline (GitHub Actions → GHCR → Kubernetes)
- [x] Kubernetes deployment with Helm
- [x] NetworkPolicies for zero-trust security
- [x] Observability stack deployment (Prometheus, Grafana, Jaeger, ECK)
- [x] Coverage authority workflow (aggregate coverage tracking)
- [x] OpenTelemetry SDK integration — all 5 services auto-instrumented (40-60% overhead optimized)
- [x] Frontend Jest unit tests (cart-store, api-client) — 53 tests across 5 test files
- [x] E2E expanded (homepage, products, security, smoke, cross-service specs)
- [x] Admin dashboard CRUD (ProductFormModal, order status management)
- [x] User account status management (PATCH /api/user/:id/status)

### In Progress 🚧
- [ ] Grafana dashboard creation (infrastructure ready, dashboards pending)
- [ ] Alert rule configuration (Alertmanager ready, rules pending)
- [ ] Performance testing baseline (JMeter plans exist, needs execution)

### Planned 📅
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Real email provider (SendGrid/AWS SES)
- [ ] HashiCorp Vault for secret management
- [ ] Service mesh (Istio/Linkerd) for mTLS
- [ ] Blue-green deployment strategy
- [ ] Multi-cluster deployment (staging + production)
- [ ] Performance optimization (caching, read replicas)
- [ ] User profile with order history
- [ ] Product reviews and ratings

---

## 🤝 Contributing

This is a personal portfolio project demonstrating enterprise-level patterns. While not actively seeking contributors, feedback and suggestions are welcome via GitHub Issues.

### Development Principles
1. **Domain-Driven Design**: Business logic is isolated in domain layer
2. **Test-Driven Development**: Tests written before implementation
3. **Clean Architecture**: Dependencies point inward, business logic is framework-agnostic
4. **Security First**: Follow OWASP guidelines, assume zero trust
5. **Observability Native**: All services emit metrics, traces, and structured logs

---

## 📊 Project Metrics

- **Total Lines of Code**: ~35,000 (excluding tests)
- **Test Coverage**: ~85%+ (Target: 90%)
- **Total Tests**: 330+ across all layers (unit: 277, E2E: 7 spec files, API flows & contracts: 18 files)
- **CI/CD Success Rate**: 100% (last 30 runs)
- **Deployment Time**: ~5 minutes (code push → live)
- **Services**: 4 backend + 1 frontend
- **Databases**: 3 (Oracle, PostgreSQL, MSSQL)
- **API Endpoints**: ~55 across all services
- **E2E Spec Files**: 7 user journey specs (auth, cart-checkout, cross-service, homepage, products, security, smoke)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Kunle Ogunlana**  
Infrastructure & DevOps Engineer | Kubernetes Specialist | Full-Stack Developer  

🔗 [kunlecreates.org](https://kunlecreates.org)  
💼 [LinkedIn](https://linkedin.com/in/kunlecreates)  
🐙 [GitHub](https://github.com/kunlecreates)

---

## 🙏 Acknowledgments

- **Spring Boot** team for excellent auto-configuration
- **NestJS** community for TypeScript best practices
- **Testcontainers** for revolutionizing integration testing
- **Playwright** team for reliable E2E testing framework
- **Kubernetes** and **Helm** communities for deployment tooling
- **OpenTelemetry** project for observability standardization

---

**⭐ Star this repo if you find it useful!**

*Last Updated: March 2026*