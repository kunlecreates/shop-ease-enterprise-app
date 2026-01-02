# ShopEase eCommerce Web Application

A Microservices superstore application designed with CI/CD, Integration Testing & Deployment in a cloud-native environment.

## Overview

This repository contains a **production-style microservices platform** built with a **polyglot technology stack** and deployed to **Kubernetes**.  
It demonstrates **real-world CI/CD**, **service isolation**, **system integration testing**, and **end-to-end validation** practices.

The project intentionally separates:
- **Service ownership**
- **Cross-service integration**
- **Build and deployment**
- **End-to-end user flows**

This separation mirrors how mature teams operate at scale.

---

## Architecture

### Services

| Service | Tech Stack | Database |
|------|-----------|----------|
| user-service | Spring Boot (Java) | Oracle |
| order-service | Spring Boot (Java) | MSSQL |
| product-service | NestJS (Node.js) | PostgreSQL |
| notification-service | Python | External Mail API |

Each service:
- Owns its database
- Is independently testable
- Is independently deployable

---

## Repository Structure

```
root/
├── frontend/                     # React + TypeScript app
├── services/
│   ├── user-service/             # Spring Boot + Oracle DB
│   ├── product-service/          # NestJS + PostgreSQL
│   ├── order-service/            # Spring Boot + MS SQL Server
│   └── notification-service/     # Python
│
├── db/
│ ├── user-service/ # Flyway migrations (Oracle DB)
│ ├── product-service/ # Flyway migrations (PostgreSQL)
│ └── order-service/ # Flyway migrations (MSSQL)
│
├── integration-tests/
|
├── e2e/                          # Playwright system-level E2E tests
│   ├── playwright.config.ts
│   ├── tests/
│   │   ├── auth.spec.ts
│   │   ├── product-browse.spec.ts
│   │   ├── checkout.spec.ts
│   │   └── admin-flow.spec.ts
│   └── fixtures/
│       └── test-users.ts
|
├── helm-charts/                  # Helm deployment manifests
│   ├── user-service/
│   ├── product-service/
│   ├── order-service/
│   ├── notification-service/
│   └── global-values.yaml
|
└── .github/workflows/ # GitHub Actions CI/CD pipelines
├── docs/                         # Architecture, PRDs, ADRs, API specs
├── scripts/                      # Utility or setup scripts
└── README.md
```

---

## Testing Strategy

Testing is intentionally layered.

### 1. Per-Service CI (Component Tests)

**Location:** `services/*`  
**Runs:** On pull request  
**Purpose:**  
- Unit tests  
- Service-local integration tests (DB, messaging, Testcontainers)

These tests:
- Run in parallel per service
- Block PR merge if failing
- Do not depend on other services

---

### 2. System Integration Tests (Cross-Service)

**Location:** `integration-tests/`  
**Runs:** After deployment to cluster  
**Purpose:**  
- Validate service-to-service contracts
- Validate multi-service business flows
- Validate data consistency across services
- Validate observability and trace propagation

These tests:
- Execute against **live services deployed in Kubernetes**
- Do not build services locally
- Use HTTP APIs only (black-box testing)
- Block merge to `main` if configured via branch protection

#### Test Types

**Contract Tests**
```text
contracts/
├── user-product.contract.test.ts
├── user-order.contract.test.ts
```

Validate:
- API compatibility
- Required fields and schemas
- Error handling between services

**Flow Tests**
```text
flows/
├── checkout.flow.test.ts
├── stock-consistency.flow.test.ts
```

Validate:
- End-to-end business flows across services
- State transitions across multiple databases

---

### 3. Playwright End-to-End Tests

**Location:** `e2e/`  
**Runs:** After deploy  
**Purpose:**  
- Validate real browser navigation
- Validate frontend to backend integration
- Validate Cloudflare Access-protected routes

These tests:
- Do not block PR merge
- Run against deployed environments
- Use service tokens or Access cookies where required

---

## CI/CD Workflow Model

### Workflow Order

```text
PR opened
│
├─ Per-service CI (blocks PR)
│
├─ System Integration Tests (blocks PR)
│
└─ Merge to main
    │
    ├─ Build Images
    ├─ Deploy to Kubernetes
    └─ Playwright E2E
```

### Gating Rules

| Workflow | Gate |
|--------|------|
| Per-service CI | Blocks PR merge |
| System Integration Tests | Blocks PR merge |
| Build Images | Post-merge |
| Deploy | Post-build |
| Playwright E2E | Post-deploy |

---

## Why Integration Tests Run Against the Cluster

Integration tests intentionally run against **real deployments**, not Docker Compose.

Reasons:
- Matches production topology
- Uses real ingress, networking, and auth
- Catches config and environment drift
- Validates Helm, secrets, and runtime wiring

Local service testing remains the responsibility of per-service CI.

---

## Environment Configuration

Integration tests are environment-driven.

```text
integration-tests/env/
├── local.env
├── ci.env
└── staging.env
```

Example:
```bash
BASE_URL=https://api.example.com
AUTH_CLIENT_ID=****
AUTH_CLIENT_SECRET=****
```

---

## Security & Access

- Cloudflare Access protects external endpoints
- CI uses **service tokens** (client ID + secret)
- Tokens are injected as headers or cookies for API and browser tests
- No interactive authentication is required in CI

---

## Observability Validation

Integration tests include:
- Trace propagation checks
- Correlation ID validation
- Failure path verification

This ensures the observability stack is not only deployed, but working.

---

## Design Principles

- Test **behavior**, not implementation
- Prefer **black-box testing**
- Avoid shared test state
- Fail fast in CI, observe deeply in integration
- Separate responsibility by workflow, not by tool

---

## Status

This repository is actively evolving to reflect:
- Real-world CI/CD patterns
- Platform-level testing maturity
- Production-grade Kubernetes deployments
