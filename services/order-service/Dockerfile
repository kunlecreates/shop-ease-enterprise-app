FROM maven:3.9.6-eclipse-temurin-21 AS builder
ARG MAVEN_PROFILES=""
WORKDIR /workspace
# Copy repository modules required for build from the repo root context.
# Note: shared `services/test-utils` is deprecated. Per-service test helpers
# should be included inside each service's test sources so builds do not need
# to copy or install a shared test artifact.

# Copy the service sources and build the service jar (skip tests in CI build image)
COPY services/order-service/pom.xml ./pom.xml
COPY services/order-service/src ./src
RUN if [ -n "$MAVEN_PROFILES" ]; then \
			mvn -B -DskipTests -P"$MAVEN_PROFILES" -f pom.xml package; \
		else \
			mvn -B -DskipTests -f pom.xml package; \
		fi

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
# Copy the built artifact from the builder stage
COPY --from=builder /workspace/target/order-service-*.jar /app/app.jar

# Use a non-root user
USER appuser

# Expose the application port
EXPOSE 8083

# Healthcheck (best-effort): adjust path to your health endpoint if different
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- --no-check-certificate http://localhost:8083/actuator/health || exit 1

ENTRYPOINT ["java","-jar","/app/app.jar"]
# ci-trigger: rebuild-images on feat/dev-tests at 2026-01-01