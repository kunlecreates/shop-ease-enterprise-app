# GitHub Copilot Instructions

## 🧠 Project Context

This repository contains a **microservices-based web application** organized with **Domain-Driven Design (DDD)** principles and **Test-Driven Development (TDD)** practices.  

Each service:
- Is independently deployable
- Owns its own database
- Is deployed to **Kubernetes using Helm**
- Is built and tested via **GitHub Actions**

End-to-end (E2E) testing is treated as a **system-level concern**, not a service-level concern.

---

### 🏗️ High-Level Architecture

| Tier             | Service                | Stack / DB                          | Responsibilities                                    | Test Automation |
|------------------|------------------------|-------------------------------------|-----------------------------------------------------|-------------------|
| **Frontend**     | `web-frontend`         | React + TypeScript + Tailwind CSS   | Storefront, Admin UI                                | Jest for UI components |
| **Core Backend** | `user-service`         | Spring Boot + Oracle DB             | Authentication, Authorization, Profiles             | JUnit + Mockito + Testcontainers |
|                  | `product-service`      | NestJS + PostgreSQL                 | Products, Categories, Inventory, Pricing            | Jest + Supertest |
|                  | `order-service`        | Spring Boot + MS SQL Server         | Orders, Carts, Payments and order lifecycle events  | JUnit + Mockito + Testcontainers |
| **Utility**      | `notification-service` | Python + Mail API                   | Email/SMS notifications, async event listeners      | pytest + unittest |
| **E2E Testing**  | E2E Platform Tests     | Playwright                          | Cross-service user journeys via browser             | Playwright (post-deploy) |
| **Infra**        | Observability Stack    | OTel, Jaeger, Prometheus, Grafana, ECK | Metrics, Traces, Logs                            | Grafana + Prometheus |

---

### Toolchain Versions
- Java: 21 (LTS)
- Node.js: 20.x (LTS)
- Python: 3.12+
- Docker: 26+
- Helm: 3.15+
- Kubernetes: 1.30+


## ⚙️ Folder Structure

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

## 🚧 Development Phases

| **Phase**   | **Goal**                                  | **Key Deliverables**                                               | **Tools / Stack**                   |
| ----------- | ----------------------------------------- | ------------------------------------------------------------------ | ----------------------------------- |
| **Phase 0** | Foundations                               | Repository setup, project scaffolds, CI/CD skeleton                | GitHub Actions, Docker, Maven, npm  |
| **Phase 1** | Domain-Driven Architecture                | Implement DDD structure for backend and define React folder layout | Spring Boot or NestJS etc.          |
| **Phase 2** | Test-Driven Development Core              | Establish testing frameworks and test-first workflow               | JUnit/Postman, Jest, Playwright     |
| **Phase 3** | Business Features (Domain Implementation) | Build initial domain (e.g., Product or User) following DDD + TDD   | PostgreSQL, MSSQL, Oracle DB        |
| **Phase 4** | CI/CD Integration                         | Automate tests and builds in pipeline                              | GitHub Actions                      |
| **Phase 5** | E2E Automation & Performance Testing      | Add Playwright and JMeter stages                                   | Playwright, JMeter                  |
| **Phase 6** | Observability and Deployment              | Add Helm, monitoring, and deploy to MicroK8s                       | Helm, Prometheus, Grafana           |


## 🧩 Service Substructures

Each service follows DDD-aligned modular organization:

### User Service sub-structure (Java Spring Boot)
```
user-service/
├── src/
│   ├── main/
│   │   ├── java/org/kunlecreates/user/
│   │   │   ├── application/           # Application services (use cases)
│   │   │   ├── domain/                # Entities, Value Objects, Aggregates
│   │   │   ├── infrastructure/        # Repositories, external adapters
│   │   │   └── interfaces/            # Controllers, DTOs, mappers
│   │   └── resources/
│   │       ├── application.yaml
│   │       └── db/migration/          # Flyway SQL migration scripts
│   │            └── sql/
│   │            ├── V1__init.sql
│   │            ├── V2__add_user_roles.sql
│   │            └── flyway.conf
│   └── test/
│       └── java/com/acegrocer/user/   # Unit + Integration tests
├── pom.xml
├── Dockerfile
├── helm/                              # Default to aggregating all service Helm charts via a parent chart or use this
│   └── values.yaml
└── README.md
```
#### Stack:

- Spring Boot 3.3+, Java 21, Flyway, Oracle DB
- Tests: JUnit 5, Mockito, Testcontainers with gvenzl/oracle-free or gvenzl/oracle-xe images
- Build: Maven

### Product Service sub-structure (TypeScript NestJS)
```
product-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
|   ├── common/
│   ├── config/                     # Environment, DB, and service configs
│   ├── domain/                     # Entities, interfaces, domain events
│   ├── application/                # Use cases, DTOs, business logic
│   ├── infrastructure/             # Repositories, adapters, ORM entities
│   ├── presentation/               # REST controllers
│   ├── modules/
│   │   ├── products/
│   │   ├── categories/
│   │   └── inventory/
│   └── migrations/                 # Flyway migration scripts
│       └── sql/
│           ├── V1__init.sql
│           └── flyway.conf
├── test/
│   ├── unit/
│   └── integration/
├── package.json
├── nest-cli.json
├── tsconfig.json
├── Dockerfile
└── README.md
```
#### Stack:

- NestJS 10+, TypeORM or Prisma for entities definition, PostgreSQL 8+, Flyway via CI job for migrations
- Test: Jest, Supertest

### Order Service sub-structure (Java Spring Boot)
```
order-service/
├── src/
│   ├── main/
│   │   ├── java/org/kunlecreates/order/
│   │   │   ├── application/
│   │   │   ├── domain/
│   │   │   ├── infrastructure/
│   │   │   └── interfaces/
│   │   └── resources/
│   │       ├── application.yaml
│   │       └── db/migration/
│   │            └── sql/
│   │               ├── V1__init.sql
│   │               └── flyway.conf
│   └── test/
│       └── java/org/kunlecreates/order/  # Unit + Integration tests
├── pom.xml
├── Dockerfile
└── README.md

```
#### Stack:

- Spring Boot 3.3+, Java 21, Flyway, MS SQL Server
- Payment: mock or internal adapter
- Build: Maven

### Notification Service sub-structure (Python)
```
notification-service/
├── app/
│   ├── main.py
│   ├── api/
│   ├── models/
│   ├── services/
│   ├── config.py
│   └── utils/
├── requirements.txt
├── Dockerfile
└── README.md
```
#### Stack:
- FastAPI 0.68+, SQLAlchemy, Oracle DB
- Test: pytest
- Build: Docker

### Frontend sub-structure (React + TypeScript)
```
frontend/                          # Web Frontend (React + TypeScript)
├── package.json
├── vite.config.ts
├── src/
│   ├── components/
│   ├── pages/
│   ├── api/
│   └── styles/
├── public/
└── Dockerfile

```
#### Stack:
- Next.js 15 (React 19), Tailwind CSS 4, shadcn/ui, TypeScript 5, Playwright for E2E tests
- Deployed as: Static containerized service via Helm behind shared ingress

### Helm Charts (Umbrella Deployment)
```
helm/                              # Helm umbrella chart (manages all services)
├── Chart.yaml
├── values.yaml
├── templates/
├── charts/
│   ├── user-service/
│   ├── product-service/
│   ├── order-service/
│   └── notification-service/
└── secrets/                       # Values encrypted via SOPS or sealed-secrets
```
- This Global chart manages ingress, namespace, and secrets references. Includes an optional Flyway migration Job template:
```
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ include 'service.fullname' . }}-migration"
spec:
  template:
    spec:
      containers:
        - name: flyway
          image: flyway/flyway:10
          command: ["flyway", "migrate"]
          envFrom:
            - secretRef:
                name: "{{ include 'service.fullname' . }}-db-secrets"
      restartPolicy: Never
```

### 📈 Observability & Telemetry

- Each service exports traces, metrics, and logs using OpenTelemetry SDK.
- Traces → Jaeger, Metrics → Prometheus, Logs → Elasticsearch (ECK).
- Use:
    - Java: @WithSpan annotations
    - NestJS: @Span() decorators
- Integrate custom metrics (Micrometer for Java, @opentelemetry/api for TS).

### CI/CD Pipelines (GitHub Actions)
Each workflow:
1. Checks out code
2. Runs unit/integration tests
3. Runs DB migrations (Flyway job)
4. Builds Docker image
5. Pushes to GHCR
6. Helm Deploy to Kubernetes

Matrix Example:
```
strategy:
  matrix:
    service: [user-service, product-service, order-service, notification-service]
```

Each pipeline uses:
- Secrets: KUBE_CONFIG, FLYWAY_URL_*, REGISTRY_TOKEN, etc.
- Environment: prod, staging, dev via branch mapping

## 🧩 Coding Conventions

### General
- Follow **DDD** modularization:
  - `domain/` → core domain models, aggregates, entities, value objects
  - `application/` → use cases and service logic
  - `infrastructure/` → repositories, adapters, persistence, HTTP clients
  - `interfaces/` → REST controllers, DTOs, input/output ports
- Implement **TDD**: write tests before writing business logic.
- Ensure all code is covered by **unit and integration tests**.
- Use **JWT** for stateless authentication.
- Maintain **strict typing** in all TypeScript code.
- Follow clean architecture and single responsibility principles.
- Use **@Transactional** for write operations.
- Implement **domain events** where necessary (e.g., `OrderCreatedEvent`).
- All service responses follow a consistent response wrapper (`ResponseFormat<T>` for Java; DTOs for TypeScript).

### Java (Spring Boot)
- Use latest LTS Java version (21 or higher).
- Use **Maven Wrapper (`mvnw`)** for builds.
- Prefer **Records** for DTOs where applicable.
- Keep controller → service → repository layers cleanly separated.
- Prefer reactive streams using **Reactive Spring Data (R2DBC)** (`Mono`, `Flux`) for service methods.
- For database logic, mock repositories or use `@DataR2dbcTest`.
- Prefer **constructor-based dependency injection** (`@RequiredArgsConstructor`).
- Use **Spring Security 6** for auth.
- Follow naming conventions:
  - `UserService.java`
  - `UserRepository.java`
  - `UserController.java`

### TypeScript (NestJS)
- Use **Nest CLI** conventions for module generation.
- Use decorators (`@Controller`, `@Injectable`, `@Entity`) appropriately.
- Prefer async/await syntax.
- Maintain clear module boundaries (`ProductModule`, `InventoryModule`, etc.).
- Use `class-validator` and `class-transformer` for input validation.
- Use **Flyway migrations** or **TypeORM migrations** for schema management.
- TypeScript → use Jest
- NestJS → use Jest + Supertest for service-level API integration tests
- Playwright → reserved exclusively for system-level E2E in `/e2e`

- Return DTOs, not entities, from controllers.
- Keep business logic in the `application/` layer.
- Write `*.spec.ts` files alongside source files.
- Inject dependencies via Nest’s DI container (`@Injectable`).

### Testing
- All new features must include a unit test.
- For Load Testing, use JMeter where applicable for performance validation under realistic loads.
- Use Postman for RESTful APIs testing.
- Mock repositories for unit tests.
- Java → use **JUnit 5**, **Testcontainers** and **Mockito** for Tests.
- TypeScript → use **Jest** with `@testing-library` utilities.
- Write tests under `src/test` (Java) and `test/` (TypeScript).
- Use test containers if integration tests require live DB connections.

---

## 🧪 Testing Strategy (Authoritative)

### Test Pyramid Architecture

This project follows the industry-standard **Test Pyramid** with four distinct test layers:

```
        /\
       /E2E\         ← Playwright (browser, full system)
      /------\
     /  API  \       ← HTTP to deployed services (post-deployment)
    /----------\
   /Integration\     ← Testcontainers (real DB, in CI)
  /--------------\
 /     Unit      \   ← Mocked dependencies (fast)
/------------------\
```

### Test Type Definitions

| Test Type | Scope | Location | Database | When Runs | Example File |
|-----------|-------|----------|----------|-----------|--------------|
| **Unit** | Single class/module | `src/test/java/unit/` or `test/unit/` | Mocked or H2 | Every push | `UserServiceTest.java`, `product.service.spec.ts` |
| **Integration** | Controller→Service→Repo→DB | `src/test/java/integration/` or `test/integration/` | Testcontainers | Every push (before build) | `UserControllerIT.java`, `product.controller.integration.spec.ts` |
| **API Contract** | Cross-service HTTP | `/api-tests/` | Staging DB | After deployment | `customer-checkout.flow.test.ts` |
| **E2E** | Browser + Full system | `/e2e/` | Staging DB | After deployment | `cart-checkout.spec.ts` (Playwright) |

### Test Naming Conventions

**Java (Spring Boot)**:
- Unit tests: `*Test.java` (e.g., `UserServiceTest.java`)
- Integration tests: `*IT.java` (e.g., `UserControllerIT.java`)
- Maven Surefire runs `*Test.java`, Failsafe runs `*IT.java`

**TypeScript (NestJS)**:
- Unit tests: `*.spec.ts` (e.g., `product.service.spec.ts`)
- Integration tests: `*.integration.spec.ts` (e.g., `product.controller.integration.spec.ts`)
- npm scripts: `test:unit` and `test:integration`

**Python (FastAPI)**:
- Unit tests: `test_*.py` in `tests/unit/`
- Integration tests: `test_*_integration.py` in `tests/integration/`

### Integration Testing with Testcontainers

**Purpose**: Validate persistence logic with real database before Docker build.

**Key Principles**:
- Run in CI **before** Docker image build (fast feedback: 5 min vs 20+ min)
- Use Testcontainers to spin up ephemeral database containers
- Test full stack: Controller → Service → Repository → Real Database
- No mocks allowed in integration tests
- Each test gets a clean database state (via cleanup hooks)

**Example Structure (Java)**:
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ContextConfiguration(initializers = FlywayTestInitializer.class)
public class UserControllerIT {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void registerUser_shouldPersistToDatabase() {
        // Test REST endpoint with real DB persistence
    }
}
```

**Example Structure (TypeScript)**:
```typescript
describe('ProductController (Integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  
  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15-alpine').start();
    // Start NestJS app with real PostgreSQL
  });
  
  it('should create product and persist to database', async () => {
    // Test with supertest + real DB
  });
});
```

### Test Ownership Model

| Test Type | Scope | Location |
|----|----|----|
| Unit Tests | Single class/module | Inside each service |
| Integration Tests | DB, messaging, REST | Inside each service |
| Contract Tests | API compatibility | Inside each service |
| **End-to-End (E2E)** | **Full system** | **`/e2e` (root-level)** |

### 🚫 Prohibited Patterns

- ❌ Playwright tests inside service repositories
- ❌ Playwright tests inside the frontend project
- ❌ Mocking backend services in E2E tests
- ❌ Running Playwright before deployment

---

## 🌐 End-to-End (E2E) Testing with Playwright

### Definition

Playwright E2E tests validate **real user journeys** across the **entire deployed system**, including:

- Browser
- Frontend
- Ingress / Gateway
- Multiple backend services
- Real databases

These tests treat the system as a **black box**.

### Location

```
/e2e
```

### Execution Rules

- Playwright runs **only after Helm deployment**
- Targets **real environments** (dev / staging / preview)
- Uses real ingress URLs (`E2E_BASE_URL`)
- No service mocking is allowed

### Example Playwright Config

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.E2E_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

---

## 🚀 CI/CD Expectations (E2E Correctness)

### Pipeline Order

1. Unit + integration tests (per service)
2. Docker build
3. Helm deployment to Kubernetes
4. **Playwright E2E tests**
5. Promotion or rollback decision

### Example CI Placement

```yaml
e2e:
  needs: deploy
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
      working-directory: e2e
    - run: npx playwright install --with-deps
    - run: npx playwright test
      working-directory: e2e
      env:
        E2E_BASE_URL: https://staging.acegrocer.io
```

## 🧩 Service Testing Rules

### Backend Services

Each backend service:
- Owns **unit tests**
- Owns **integration tests**
- Uses **Testcontainers** for real DB validation
- Does **not** own E2E tests

Example (Java services):

```
src/test/java/
├── unit/
├── integration/
```

---

## 🚀 CI/CD Expectations

- All services must build and pass tests before deploy.
- Database migrations run automatically using **Flyway** inside CI/CD.
- Docker images are built and pushed to **GitHub Container Registry (GHCR)**.
- Helm deploys the latest image tag (`${{ github.sha }}`) to the target K8s namespace.
- Secrets are stored in **GitHub Secrets** (`KUBE_CONFIG`, `FLYWAY_URL_*`, etc.).
- PRs to `main` trigger automated build, test, migration, and deploy steps.

---

## 🧰 Copilot Guidance

When generating or suggesting code, Copilot **must**:

1. **Never generate Playwright tests inside a service or frontend**
2. **Always place Playwright tests under `/e2e`**
3. Assume Playwright tests run against a **live deployed system**
4. Treat E2E tests as **environment-aware**
5. Respect service boundaries and database ownership
6. Prefer TDD for unit and integration tests
7. Never mock services in E2E tests
8. Never hardcode secrets or URLs
9. Generate production-grade, observable code
10. Follow DDD and Clean Architecture principles
11. **Respect service boundaries** — do not mix domain logic between services.
12. **Favor clean architecture** — business logic should not depend on frameworks.
13. **Generate meaningful tests first** if user context suggests TDD.
14. **Follow database ownership rules** — each service manages its own schema.
15. **Output consistent commit messages**, e.g., `feat(product): add stock decrement use case`.
16. **Use interfaces and dependency injection** for extensibility and testability.
17. **Never hardcode secrets or connection URLs.**
18. **Avoid business logic in controllers.**
19. **Include test coverage for all order and payment scenarios.**
20. **Exceptions and validations** Always include proper validation and error handling for nulls, exceptions, and validation.
21. **Write concise, modular service methods.**

---

## 🧪 Example Prompts for Copilot

Developers in this project may ask:
- “Generate a NestJS controller for creating and updating products.”
- “Write a JUnit test for the UserService class validating profile updates.”
- “Suggest a Flyway migration script for adding an email column to users table.”
- “Write a Kubernetes Helm template for the product-service Deployment.”

Copilot should:
- Infer the correct project context and conventions.
- Generate code compatible with the stack and architecture.
- Produce well-documented, type-safe, and testable implementations.

---

## ✅ Expected Output Quality
Generated code must meet the following criteria:
- Production-grade, secure, typed and maintainable.
- Fully tested (unit/integration).
- Pass existing tests or newly generated ones.
- Follow security best practices.
- Match naming conventions and folder structure.
- DDD and TDD compliant.
- Compatible with CI/CD and Helm deployment.
- Observable (traces, metrics, logs).

---

*This `.copilot.instructions.md` defines the architectural and behavioral contract for AI-assisted development within this repository — ensuring that all generated code remains consistent, modular, and production-ready.*

