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

## Deployment
See `helm/README.md` for Helm values and Secrets required in Kubernetes.

## CI: Including Oracle JDBC (ojdbc11) in builds
If you need the Oracle JDBC driver included in CI-built images, create a Maven `settings.xml` that configures access to Oracle's Maven repository and store it as a GitHub Actions secret named `ORACLE_SETTINGS_XML`.

Example minimal `settings.xml` (replace username/password/token as appropriate):

```xml
<settings>
	<servers>
		<server>
			<id>oracle-maven</id>
			<username>YOUR_ORACLE_USERNAME</username>
			<password>YOUR_ORACLE_TOKEN</password>
		</server>
	</servers>
	<profiles>
		<profile>
			<id>oracle</id>
			<repositories>
				<repository>
					<id>oracle-maven</id>
					<url>https://maven.oracle.com</url>
				</repository>
			</repositories>
		</profile>
	</profiles>
	<activeProfiles>
		<activeProfile>oracle</activeProfile>
	</activeProfiles>
</settings>
```

How to add the secret in GitHub:

1. Go to your repository → Settings → Secrets → Actions → New repository secret.
2. Name: `ORACLE_SETTINGS_XML`.
3. Value: paste the full `settings.xml` content (the example above).

The CI workflow will detect this secret, pass it to BuildKit as a secret during the Docker build, and the Dockerfile will use it when running Maven so `ojdbc11` can be resolved securely.

If you cannot register with Oracle or do not want to provide credentials, host the `ojdbc11.jar` in your internal Maven repository (Artifactory/Nexus or GitHub Packages) and configure Maven to use that repository instead.