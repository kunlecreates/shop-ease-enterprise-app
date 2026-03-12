<div align="center">

# 🛒 ShopEase Platform

**A production-grade microservices eCommerce platform demonstrating enterprise patterns at scale**

[![CI Tests](https://github.com/kunlecreates/shop-ease-enterprise-app/actions/workflows/e2e.yml/badge.svg)](https://github.com/kunlecreates/shop-ease-enterprise-app/actions)
[![CI Builds](https://github.com/kunlecreates/shop-ease-enterprise-app/actions/workflows/build-images.yaml/badge.svg)](https://github.com/kunlecreates/shop-ease-enterprise-app/actions)
[![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/kunlecreates/shop-ease-enterprise-app/coverage-badge/badge.json)](https://github.com/kunlecreates/shop-ease-enterprise-app)
[![Stars](https://img.shields.io/github/stars/kunlecreates/shop-ease-enterprise-app?style=flat)](https://github.com/kunlecreates/shop-ease-enterprise-app/stargazers)
[![Last Commit](https://img.shields.io/github/last-commit/kunlecreates/shop-ease-enterprise-app?style=flat&color=blue)](https://github.com/kunlecreates/shop-ease-enterprise-app/commits)
[![License](https://img.shields.io/github/license/kunlecreates/shop-ease-enterprise-app)](LICENSE)
[![Visitors](https://hits.sh/github.com/kunlecreates/shop-ease-enterprise-app.svg?label=Visitors&style=flat&color=0e75b6)](https://github.com/kunlecreates/shop-ease-enterprise-app)

**[🌐 Live Demo](https://shop.kunlecreates.org)** &nbsp;·&nbsp; **[📖 Docs](docs/)** &nbsp;·&nbsp; **[📊 Project Status](#-project-status)** &nbsp;·&nbsp; **[🐛 Issues](https://github.com/kunlecreates/shop-ease-enterprise-app/issues)**

</div>

---

## 🧭 About the Project

ShopEase is a **full-stack, cloud-native eCommerce platform** built to demonstrate enterprise-grade software engineering at scale. Every service is independently deployable, domain-modelled, fully tested, continuously integrated, and monitored in production.

This project was built as a **living demonstration** of real-world engineering practices that are often discussed but rarely shown together in a single repository:

- **Domain-Driven Design (DDD)** — business logic isolated in domain layers, bounded contexts per service
- **Test-Driven Development (TDD)** — tests written before implementation across 5 distinct test layers
- **GitOps** — infrastructure declared in Git, applied via Helm to Kubernetes (~5 min deploy time)
- **Polyglot persistence** — best-fit database per domain (Oracle, PostgreSQL, MSSQL)
- **Production observability** — OpenTelemetry auto-instrumentation, Prometheus, Grafana, Jaeger, ECK
- **Zero-trust security** — JWT/RS256, NetworkPolicies, email verification, RBAC

> 🌐 **Live at**: [shop.kunlecreates.org](https://shop.kunlecreates.org)

---

## ✨ Key Features

- 🏪 **Complete shopping experience** — product catalog, full-text search, cart, checkout, order management
- 🔐 **Enterprise-grade security** — JWT/RS256, email verification, bcrypt (cost 12), RBAC, zero-trust NetworkPolicies
- 🧪 **330+ tests across 5 layers** — unit, frontend unit, integration (real DBs via Testcontainers), API contracts, Playwright E2E
- 📊 **85%+ code coverage** — aggregate tracking via Coverage Authority workflow, badge auto-updated on every push
- 🔭 **Full-stack observability** — distributed traces (Jaeger), metrics (Prometheus/Grafana), logs (ECK), all auto-instrumented via OTel Operator
- 🚀 **GitOps CI/CD** — GitHub Actions → GHCR → Kubernetes, parallel builds per service, ~5 min end-to-end deploy
- ☸️ **Production Kubernetes** — Helm charts, NGINX Ingress, Cloudflare Tunnel, MicroK8s cluster
- 🗄️ **Polyglot persistence** — 3 independent databases: Oracle DB, PostgreSQL 15, MS SQL Server
- 👨‍💼 **Admin Dashboard** — product CRUD, order status management, user administration

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [Project Status](#-project-status)
- [Architecture](#️-architecture)
- [Tech Stack](#️-tech-stack)
- [Built With](#-built-with)
- [Repository Structure](#-repository-structure)
- [Testing Strategy](#-testing-strategy)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Observability & Monitoring](#-observability--monitoring)
- [Security Architecture](#-security-architecture)
- [Documentation](#-documentation)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [FAQ](#-faq)
- [Project Metrics](#-project-metrics)
- [License](#-license)
- [Author](#-author)
- [Acknowledgments](#-acknowledgments)

---

## 🚀 Quick Start

### Prerequisites

| Tool | Min Version | Purpose |
|------|-------------|---------|
| [Docker](https://docker.com/) | 26+ | Testcontainers, image builds |
| [Java](https://openjdk.org/) | 21 (LTS) | User & Order services |
| [Node.js](https://nodejs.org/) | 20.x (LTS) | Product service, Frontend |
| [Python](https://python.org/) | 3.12+ | Notification service |
| [kubectl](https://kubernetes.io/docs/tasks/tools/) | 1.30+ | Cluster management |
| [Helm](https://helm.sh/) | 3.15+ | Kubernetes deployments |

### 1. Clone the Repository

```bash
git clone https://github.com/kunlecreates/shop-ease-enterprise-app.git
cd shop-ease-enterprise-app
```

### 2. Run Service Tests (No Kubernetes Required)

```bash
# Product Service (NestJS + PostgreSQL)
cd services/product-service && npm ci && npm run test:unit

# User Service (Java + Oracle)
cd services/user-service && mvn clean test

# Order Service (Java + MSSQL)
cd services/order-service && mvn clean test

# Notification Service (Python)
cd services/notification-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && pytest tests/unit
```

Integration tests require Docker (spins up real database containers via Testcontainers):

```bash
mvn verify              # Java services — runs integration tests
npm run test:integration # Product service
```

### 3. Deploy to Kubernetes

```bash
# Deploy all services via umbrella chart
helm upgrade --install shopease helm-charts/ \
  -f helm-charts/values-staging.yaml \
  --namespace shopease-system --create-namespace

# Verify rollout
kubectl get pods -n shopease-system

# Access health endpoint
curl https://shop.kunlecreates.org/api/user/health
```

### 4. Run E2E Tests (Post-Deployment)

```bash
cd e2e
npm ci && npx playwright install --with-deps
E2E_BASE_URL=https://shop.kunlecreates.org npx playwright test
```

### Sparse Checkout — Work on a Single Service

```bash
git clone --filter=blob:none --sparse git@github.com:kunlecreates/shop-ease-enterprise-app.git
cd shop-ease-enterprise-app
git sparse-checkout set services/product-service  # fetch only what you need
git sparse-checkout add frontend                  # add more as needed
```

<p align="right"><a href="#-shopease-platform">↑ back to top</a></p>

---

## 🎯 Project Status

**Overall Completion**: 97% (Production-Ready)  
**Current Phase**: Phase 7 Complete — Test Coverage Optimization  
**Last Updated**: March 2026

### What's Operational ✅

- ✅ **4 Microservices**: User, Product, Order, Notification (all deployed and live)
- ✅ **Next.js 15 Frontend**: React 19 + App Router + shadcn/ui
- ✅ **CI/CD Pipeline**: GitHub Actions → GHCR → Kubernetes via Helm
- ✅ **Test Automation**: 5-layer pyramid (unit, frontend unit, integration, API contracts, E2E)
- ✅ **Coverage Authority**: Automated aggregate coverage tracking (~85%+ current)
- ✅ **Kubernetes Deployment**: MicroK8s + Helm + NGINX Ingress + NetworkPolicies
- ✅ **Observability Stack**: Prometheus, Grafana, Jaeger, Elasticsearch/Kibana (all operational)
- ✅ **Security**: JWT/RS256, bcrypt passwords, email verification, password reset, RBAC
- ✅ **Cross-Service Integration**: Order → Notification, Product inventory management

### In Progress 🚧

- 🚧 **Grafana Dashboards**: Infrastructure ready, service-specific dashboards pending
- 🚧 **Performance Testing**: JMeter plans exist, baseline not yet established
- 🚧 **Grafana Alert Rules**: Alertmanager deployed, rules pending configuration

<p align="right"><a href="#-shopease-platform">↑ back to top</a></p>

---

## 🏗️ Architecture

### High-Level Design

```
┌──────────────────────────────────────────────────────────────────┐
│                   Cloudflare Tunnel + Access                     │
│                   (shop.kunlecreates.org)                   │
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

**Observability Layer** (External namespaces):
- **Prometheus** → Metrics collection (HTTP, JVM, DB connection pools)
- **Grafana** → Dashboards and alerting
- **Jaeger** → Distributed tracing
- **Elasticsearch + Kibana** → Log aggregation and search
- **OpenTelemetry Operator** → Auto-instrumentation for all 5 services

<p align="right"><a href="#-shopease-platform">↑ back to top</a></p>

---

## 🛠️ Tech Stack

### Backend Services

| Service | Language/Framework | Database | Key Features |
|---------|-------------------|----------|--------------|
| **user-service** | Java 21 + Spring Boot 3.3 | Oracle DB | Authentication, Authorization, Email verification, Password reset |
| **order-service** | Java 21 + Spring Boot 3.3 | MS SQL Server | Order management, Cart operations, Payment processing, Notification integration |
| **product-service** | Node.js 20 + NestJS 10 | PostgreSQL 15 | Product catalog, Full-text search, Inventory tracking, Categories |
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

## 🔧 Built With

<div align="center">

| Backend | Frontend | Infrastructure | Observability | Testing |
|---------|----------|----------------|---------------|---------|
| [![Java](https://img.shields.io/badge/Java_21-ED8B00?style=flat&logo=openjdk&logoColor=white)](https://openjdk.org/) | [![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/) | [![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat&logo=kubernetes&logoColor=white)](https://kubernetes.io/) | [![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat&logo=prometheus&logoColor=white)](https://prometheus.io/) | [![JUnit](https://img.shields.io/badge/JUnit_5-25A162?style=flat&logo=junit5&logoColor=white)](https://junit.org/junit5/) |
| [![Spring Boot](https://img.shields.io/badge/Spring_Boot_3-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot) | [![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/) | [![Helm](https://img.shields.io/badge/Helm_3-0F1689?style=flat&logo=helm&logoColor=white)](https://helm.sh/) | [![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat&logo=grafana&logoColor=white)](https://grafana.com/) | [![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)](https://jestjs.io/) |
| [![NestJS](https://img.shields.io/badge/NestJS_10-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/) | [![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org/) | [![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com/) | [![Jaeger](https://img.shields.io/badge/Jaeger-66CFE3?style=flat&logo=jaeger&logoColor=black)](https://jaegertracing.io/) | [![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white)](https://playwright.dev/) |
| [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/) | [![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/) | [![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=githubactions&logoColor=white)](https://github.com/features/actions) | [![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-000000?style=flat&logo=opentelemetry&logoColor=white)](https://opentelemetry.io/) | [![pytest](https://img.shields.io/badge/pytest-0A9EDC?style=flat&logo=pytest&logoColor=white)](https://pytest.org/) |

</div>

<p align="right"><a href="#-shopease-platform">↑ back to top</a></p>

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
│   ├── README.md
│   └── instrumentation/              # Language-specific Instrumentation CRs
│       ├── deploy.sh
│       ├── nodejs-instrumentation*.yaml
│       ├── python-instrumentation.yaml
│       └── java-instrumentation*.yaml
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
├── helm-charts/                      # Umbrella chart (full-stack deploys)
│   ├── templates/                    # Global ingress, RBAC
│   ├── values-staging.yaml
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
│   ├── PRD_COMPLETION_ASSESSMENT.md
│   ├── PROJECT_COMPLETION_STATUS.md
│   ├── coverage-gap-analysis-*.md    # Test coverage analysis reports
│   └── guides/                       # How-to guides (observability, testing, etc.)
│
├── performance-tests/                # JMeter load testing
└── scripts/                          # Utility and setup scripts
```

<p align="right"><a href="#-shopease-platform">↑ back to top</a></p>

---

## 🧪 Testing Strategy

This project implements a **comprehensive 5-layer testing pyramid** with clear ownership boundaries and execution order.

### Test Pyramid Architecture

```
            /\
           /E2E\         ← Playwright (browser, full system, post-deployment)
          /-----\
         /  API  \       ← API Contract Tests (HTTP, post-deployment)
        /---------\
       /Integration\     ← Testcontainers (real DB, pre-deployment, blocks CI)
      /-------------\
     /Frontend Unit  \   ← Jest (frontend/__tests__/, per-push)
    /-----------------\
   /      Unit         \ ← Mocked dependencies (fast, blocks PR)
  /______________________\
```

### Layer 1: Unit Tests (Per-Service)

**Location**: `services/*/test/`  
**Runs**: On every push, before PR merge  
**Purpose**: Validate individual classes/functions with mocked dependencies  
**Tools**: JUnit 5 + Mockito (Java) · Jest + Supertest (TypeScript) · pytest + unittest.mock (Python)

**Example**: `AuthServiceTest.java` — tests authentication logic with mocked `UserRepository`

### Layer 2: Frontend Unit Tests

**Location**: `frontend/__tests__/`  
**Runs**: On every push via `ci-frontend-tests.yml`  
**Purpose**: Validate React store logic, API client behaviour, and component utilities  
**Tools**: Jest

**Coverage**: 53 tests across cart-store, api-client, and related utilities  
**Example**: `cart-store.test.ts` — validates Zustand store actions (add, remove, quantity, totals)

### Layer 3: Integration Tests (Per-Service)

**Location**: `services/*/test/integration/`  
**Runs**: On every push, before Docker build — **blocks PR merge**  
**Purpose**: Validate full stack (Controller → Service → DB) with real databases  
**Tools**: Testcontainers (PostgreSQL, MSSQL, Oracle containers) + real HTTP requests

**Example**: `ProductControllerIT.ts` — creates a product via the REST API, verifies PostgreSQL persistence

**Key Benefit**: Catches migration issues, query bugs, and transaction problems *before deployment* (5 min vs 20+ min feedback loop)

### Layer 4: API Contract Tests (Cross-Service)

**Location**: `/api-tests/contracts/` and `/api-tests/flows/`  
**Runs**: After deployment to staging/dev cluster  
**Purpose**: Validate API contracts between services and multi-service business flows  

**Test Types**:
- **Contract Tests** — schema validation, required fields, error codes
  - Example: `user-product.contract.test.ts` — validates product-service API matches user-service expectations
- **Flow Tests** — multi-service business workflows
  - Example: `checkout.flow.test.ts` — login → browse → add to cart → checkout → order confirmation

**Environment**: Tests run against **live deployed services** in Kubernetes (real ingress, auth, networking)

### Layer 5: End-to-End (E2E) Tests

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

**Example**: `cart-checkout.spec.ts` — full browser automation from landing page to order confirmation

### Coverage Tracking

**Current Coverage**: ~85%+ aggregate (Target: 90%)  
**Coverage Authority Workflow**: Aggregates coverage from all 5 service CI runs after completion  
**Report**: Published to `coverage-badge` branch, displayed in README badge  
**Gap Analysis**: [docs/coverage-gap-analysis-2025-01.md](docs/coverage-gap-analysis-2025-01.md)

<p align="right"><a href="#-shopease-platform">↑ back to top</a></p>

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

- ✅ **Fail Fast**: Unit tests run before integration tests in every pipeline
- ✅ **Real Databases**: Testcontainers prevents "works on my machine" issues
- ✅ **Parallel Execution**: All 5 services test independently (3–5 min total)
- ✅ **Artifact Reuse**: Docker images built once, reused across environments
- ✅ **GitOps**: Infrastructure changes tracked in Git, deployed via Helm
- ✅ **Self-Hosted Runners**: GitHub ARC runner on local cluster (faster, cost-effective)

<p align="right"><a href="#-shopease-platform">↑ back to top</a></p>

---

## 🔭 Observability & Monitoring

### Deployed Stack (External Namespaces)

The observability infrastructure is **fully deployed** alongside ShopEase. OpenTelemetry auto-instrumentation configs for all services are managed in the [observability/](observability/) directory.

| Component | Namespace | Purpose | Status |
|-----------|-----------|---------|--------|
| **Prometheus** | `prometheus-system` | Metrics collection (HTTP, JVM, DB) | ✅ Operational |
| **Grafana** | `grafana-system` | Dashboards and visualizations | ✅ Operational |
| **Jaeger v2** | `opentelemetry-system` | Distributed tracing | ✅ Operational |
| **Elasticsearch + Kibana** | `observability-system` | Log aggregation and search | ✅ Operational |
| **OpenTelemetry Operator** | `opentelemetry-system` | Auto-instrumentation for all services | ✅ Operational |

### Service Integration Status

- ✅ All 5 services auto-instrumented via OpenTelemetry Operator (optimized — 40–60% overhead reduction)
  - Java services (user, order): Java Agent auto-instrumentation
  - Node.js services (product, frontend): Node.js auto-instrumentation
  - Python service (notification): Python auto-instrumentation
- ✅ All services expose Prometheus metrics endpoints (`/actuator/prometheus` or `/metrics`)
- 🚧 Service-specific Grafana dashboards pending
- 🚧 Alertmanager rules pending configuration

### Out-of-the-Box Metrics

- **Request Rate**: HTTP requests/sec per service and endpoint
- **Error Rate**: 4xx/5xx percentage per service
- **Latency**: P50/P95/P99 response time histograms
- **JVM Metrics**: Heap usage, GC pauses, thread counts (Java services)
- **Database**: Connection pool utilization, query duration
- **Distributed Traces**: Full request path across services with per-span timing

**Documentation**:
- [observability/README.md](observability/README.md) — Quick start and configuration
- [docs/OTEL_COMPLETE_IMPLEMENTATION_SUMMARY.md](docs/OTEL_COMPLETE_IMPLEMENTATION_SUMMARY.md) — Full technical details

<p align="right"><a href="#-shopease-platform">↑ back to top</a></p>

---

## 🔐 Security Architecture

### Authentication & Authorization

- **JWT-based authentication** with RS256 signing
- **Bcrypt password hashing** (cost factor 12)
- **Email verification** required before full account access
- **Password reset** with time-limited, single-use tokens (bcrypt-hashed)
- **Role-based access control** (CUSTOMER, ADMIN)
- **HttpOnly cookies** for JWT storage (frontend)

### Network Security

- **Zero-trust NetworkPolicies**: Services can only communicate with explicitly allowed peers
- **TLS termination** at NGINX Ingress
- **Cloudflare Access** for external access control
- **Service-to-service mTLS** (planned via service mesh)

### Secret Management

- **Kubernetes Secrets** for sensitive data (DB credentials, JWT keys)
- **GitHub Secrets** for CI/CD credentials
- **Environment-specific configuration** (dev, staging, production)
- **HashiCorp Vault integration** (planned for production)

### Compliance & Best Practices

- ✅ OWASP Top 10 mitigations (parameterized queries, XSS protection, CSRF tokens)
- ✅ Secure headers (CSP, HSTS, X-Frame-Options)
- ✅ Input validation on all API endpoints
- ✅ Rate limiting (via NGINX Ingress)
- ✅ Audit logging (all authentication events)

<p align="right"><a href="#-shopease-platform">↑ back to top</a></p>

---

## 📖 Documentation

### Architecture & Design
- [ShopEase-PRD.md](ShopEase-PRD.md) — Product Requirements Document
- [docs/PRD_COMPLETION_ASSESSMENT.md](docs/PRD_COMPLETION_ASSESSMENT.md) — Feature completion tracking
- [docs/PROJECT_COMPLETION_STATUS.md](docs/PROJECT_COMPLETION_STATUS.md) — Overall project status
- [.github/copilot-instructions.md](.github/copilot-instructions.md) — AI-assisted development guidelines

### Developer Guides
- [DEVELOPER_WORKFLOWS.md](DEVELOPER_WORKFLOWS.md) — Local development workflows
- [docs/guides/OBSERVABILITY_INTEGRATION_GUIDE.md](docs/guides/OBSERVABILITY_INTEGRATION_GUIDE.md) — Observability stack setup
- [docs/coverage-gap-analysis-2025-01.md](docs/coverage-gap-analysis-2025-01.md) — Test coverage improvements roadmap

### API Documentation
- [Postman Collection](docs/postman/) — API request examples
- [OpenAPI Specs](docs/api/) — Auto-generated from code annotations

<p align="right"><a href="#-shopease-platform">↑ back to top</a></p>

---

## 🎯 Roadmap

### Completed ✅

- [x] Microservices architecture (4 services + frontend)
- [x] Database migrations (Flyway + manual SQL)
- [x] JWT authentication with email verification and password reset
- [x] Product catalog with full-text search
- [x] Order management with cart operations
- [x] Email notifications (order confirmation, shipping updates)
- [x] Comprehensive test automation (5-layer pyramid — 330+ tests)
- [x] CI/CD pipeline (GitHub Actions → GHCR → Kubernetes)
- [x] Kubernetes deployment with Helm + NetworkPolicies
- [x] Observability stack (Prometheus, Grafana, Jaeger, ECK)
- [x] Coverage Authority workflow (aggregate tracking with auto-updated badge)
- [x] OpenTelemetry SDK — all 5 services auto-instrumented (40–60% overhead optimized)
- [x] Frontend Jest unit tests (53 tests across cart-store, api-client, and utilities)
- [x] E2E test expansion (7 spec files: auth, cart-checkout, cross-service, homepage, products, security, smoke)
- [x] Admin dashboard CRUD (ProductFormModal, order status management)
- [x] User account status management

### In Progress 🚧

- [ ] Grafana dashboard creation (infrastructure ready, dashboards pending)
- [ ] Alert rule configuration (Alertmanager deployed, rules pending)
- [ ] Performance testing baseline (JMeter plans exist, needs execution)

### Planned 📅

- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Real email provider (SendGrid/AWS SES)
- [ ] HashiCorp Vault for secret management
- [ ] Service mesh (Istio/Linkerd) for mTLS
- [ ] Blue-green deployment strategy
- [ ] Multi-cluster deployment (staging + production)
- [ ] User profile with order history and reviews
- [ ] Product reviews and ratings

<p align="right"><a href="#-shopease-platform">↑ back to top</a></p>

---

## 🤝 Contributing

This is a personal portfolio project demonstrating enterprise-level patterns. While not actively seeking contributors, feedback and suggestions are welcome via [GitHub Issues](https://github.com/kunlecreates/shop-ease-enterprise-app/issues).

### Development Principles

1. **Domain-Driven Design**: Business logic is isolated in the domain layer; controllers and DB adapters are implementation details
2. **Test-Driven Development**: Write a failing test before writing implementation code
3. **Clean Architecture**: Dependencies point inward — business logic must not depend on frameworks
4. **Security First**: Follow OWASP guidelines; assume zero trust between services and at the perimeter
5. **Observability Native**: All new code must emit structured logs, metrics, and traces

### If You Want to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Follow the TDD workflow — write tests first
4. Ensure all existing tests pass: `mvn verify` / `npm test` / `pytest`
5. Open a Pull Request with a clear description of what changes and why

<p align="right"><a href="#-shopease-platform">↑ back to top</a></p>

---

## ❓ FAQ

<details>
<summary><strong>Testcontainers won't start — "Cannot connect to Docker daemon"</strong></summary>

Ensure Docker is running and your user has socket access:

```bash
sudo usermod -aG docker $USER && newgrp docker
docker ps  # should list running containers without sudo
```

For CI, ensure the runner has a Docker socket mount or Docker-in-Docker (DinD) configured.
</details>

<details>
<summary><strong>kubectl auth fails against the cluster</strong></summary>

Verify your context is pointing at the right cluster:

```bash
kubectl config get-contexts
kubectl config use-context <your-context-name>
kubectl cluster-info
```

For GitHub Actions, confirm the `KUBE_CONFIG` secret is current. It must be a base64-encoded kubeconfig with sufficient RBAC permissions.
</details>

<details>
<summary><strong>Helm deployment fails with "connection refused" or RBAC errors</strong></summary>

Check RBAC permissions and do a dry-run before applying:

```bash
kubectl auth can-i create deployments --namespace shopease-system
helm upgrade --debug --dry-run shopease helm-charts/ -f helm-charts/values-staging.yaml
```
</details>

<details>
<summary><strong>Coverage badge shows "unknown" or "invalid"</strong></summary>

The badge reads from the `coverage-badge` branch. If the Coverage Authority workflow has not run yet (or all service CI runs haven't completed), trigger it manually in the GitHub Actions tab. The badge updates automatically within a few minutes of a successful run.
</details>

<details>
<summary><strong>Product service integration tests fail with "port already in use"</strong></summary>

Testcontainers maps random host ports. If you see conflicts, ensure no other PostgreSQL instances are running on your machine:

```bash
docker ps | grep postgres
# Stop any conflicting containers
docker stop <container-id>
```
</details>

<details>
<summary><strong>Is this project suitable for use in production?</strong></summary>

ShopEase demonstrates production patterns but is a portfolio/learning project. Before using in a real production system, you would need:

- Real email provider (replace the SMTP mock with SendGrid or AWS SES)
- HashiCorp Vault for secret management (replacing Kubernetes Secrets)
- A live payment processor (Stripe or PayPal integration)
- Multi-node Kubernetes cluster (currently single-node MicroK8s)
- HPA tuning and load testing baseline

</details>

<p align="right"><a href="#-shopease-platform">↑ back to top</a></p>

---

## 📊 Project Metrics

| Metric | Value |
|--------|-------|
| **Total Lines of Code** | ~35,000 (excluding tests) |
| **Test Coverage** | ~85%+ (Target: 90%) |
| **Total Tests** | 330+ across all layers |
| **Unit Tests** | 277 (Java: 135, TypeScript: 78, Python: 64) |
| **Frontend Tests** | 53 (Jest — cart-store, api-client, utilities) |
| **E2E Spec Files** | 7 (auth, cart-checkout, cross-service, homepage, products, security, smoke) |
| **API Test Files** | 18 (7 contracts + 11 flows) |
| **CI/CD Success Rate** | 100% (last 30 runs) |
| **Deployment Time** | ~5 minutes (code push → live) |
| **Backend Services** | 4 (user, product, order, notification) |
| **Databases** | 3 (Oracle DB, PostgreSQL 15, MS SQL Server) |
| **API Endpoints** | ~55 across all services |
| **Live URL** | [shop.kunlecreates.org](https://shop.kunlecreates.org) |

<p align="right"><a href="#-shopease-platform">↑ back to top</a></p>

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Kunle Ogunlana**  
Infrastructure & DevOps Engineer | Kubernetes Specialist | Full-Stack Developer

🔗 [kunlecreates.org](https://kunlecreates.org) &nbsp;·&nbsp; 💼 [LinkedIn](https://linkedin.com/in/kunlecreates) &nbsp;·&nbsp; 🐙 [GitHub](https://github.com/kunlecreates)

---

## 🙏 Acknowledgments

- **Spring Boot** team for excellent auto-configuration and production-ready defaults
- **NestJS** community for TypeScript best practices and modular architecture
- **Testcontainers** for revolutionizing integration testing (no more "it works on my machine")
- **Playwright** team for the most reliable E2E testing framework available
- **Kubernetes** and **Helm** communities for making deployments reproducible
- **OpenTelemetry** project for standardizing observability across every language and framework

---

<div align="center">

**⭐ Star this repo if you found it useful!**

*Last Updated: March 2026*

</div>
