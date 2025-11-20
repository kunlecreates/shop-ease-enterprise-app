# User Service (ShopEase)

Authentication, authorization (RBAC), and profile management.

## Stack
- Spring Boot 3.3
- Java 21
- Oracle DB (PDB: FREEPDB1)
- Flyway migrations
- OpenTelemetry + Micrometer Prometheus

## Running
```bash
./mvnw spring-boot:run
```

## Environment Variables (required)
| Variable | Purpose |
|----------|---------|
| ORACLE_HOST | Oracle hostname/service name |
| ORACLE_PDB | Pluggable DB (default FREEPDB1) |
| ORACLE_USER | Schema user (USER_SVC_APP) |
| ORACLE_PASSWORD | Password (never commit) |
| OTEL_EXPORTER_OTLP_ENDPOINT | Collector endpoint |

## Security Notes
- All secrets must come from Kubernetes Secrets / GitHub Actions secrets.
- Use bcrypt for password hashing (implemented in later phase).