# GitHub Copilot Instructions

## 🧠 Project Context

This repository contains a **microservices-based web application** organized with **Domain-Driven Design (DDD)** principles and **Test-Driven Development (TDD)** practices.  
Each service is independently deployable, owns its own database, and runs inside a **Kubernetes cluster**.  
Continuous Integration and Deployment (CI/CD) is handled by **GitHub Actions** using Docker, Helm, and Flyway for migrations.

### 🏗️ High-Level Architecture

| Tier             | Service                | Stack / DB                          | Responsibilities                                    | Test Automation |
|------------------|------------------------|-------------------------------------|-----------------------------------------------------|-------------------|
| **Frontend**     | `web-frontend`         | React + TypeScript + Tailwind CSS   | Storefront, Admin UI                                | Playwright for E2E + Jest for UI components |
| **Core Backend** | `user-service`         | Spring Boot + Oracle DB             | Authentication, Authorization, Profiles             | JUnit + Mockito + Testcontainers |
|                  | `product-service`      | NestJS + PostgreSQL                 | Products, Categories, Inventory, Pricing            | Jest + Supertest |
|                  | `order-service`        | Spring Boot + MS SQL Server         | Orders, Carts, Payments and order lifecycle events  | JUnit + Mockito + Testcontainers |
| **Utility**      | `notification-service` | Python + Mail API                   | Email/SMS notifications, async event listeners      | pytest + unittest |
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
│       └── java/com/acegrocer/user/   # Unit + Integration tests + e2e tests
├── pom.xml
├── Dockerfile
├── helm/                              # Default to aggregating all service Helm charts via a parent chart or use this
│   └── values.yaml
└── README.md
```
#### Stack:

- Spring Boot 3.3+, Java 21, Flyway, Oracle DB
- Tests: JUnit 5, Mockito, Testcontainers
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
│   └── e2e/
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
│       └── java/org/kunlecreates/order/  # Unit + Integration tests + e2e tests
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
  - `interface/` → REST controllers, DTOs, input/output ports
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
- Use **Jest** for unit tests and **Supertest** for e2e tests.

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

## 🚀 CI/CD Expectations

- All services must build and pass tests before deploy.
- Database migrations run automatically using **Flyway** inside CI/CD.
- Docker images are built and pushed to **GitHub Container Registry (GHCR)**.
- Helm deploys the latest image tag (`${{ github.sha }}`) to the target K8s namespace.
- Secrets are stored in **GitHub Secrets** (`KUBE_CONFIG`, `FLYWAY_URL_*`, etc.).
- PRs to `main` trigger automated build, test, migration, and deploy steps.

---

## 🧰 Copilot Guidance

When generating or suggesting code:
1. **Respect service boundaries** — do not mix domain logic between services.
2. **Favor clean architecture** — business logic should not depend on frameworks.
3. **Generate meaningful tests first** if user context suggests TDD.
4. **Follow database ownership rules** — each service manages its own schema.
5. **Output consistent commit messages**, e.g., `feat(product): add stock decrement use case`.
6. **Use interfaces and dependency injection** for extensibility and testability.
7. **Never hardcode secrets or connection URLs.**
8. **Avoid business logic in controllers.**
9. **Include test coverage for all order and payment scenarios.**
10. **Exceptions and validations** Always include proper validation and error handling for nulls, exceptions, and validation.
11. **Write concise, modular service methods.**

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

