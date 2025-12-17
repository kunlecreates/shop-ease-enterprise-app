FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /workspace
# Copy repository modules required for build from the repo root context.
# We run Maven inside the builder image and install any local helper modules
# (e.g. services/test-utils) into the local Maven repo so service builds
# that depend on them can succeed without requiring a published package.
# Copy only the files we need to keep the context small.
# Copy test-utils (if present) and install it into local repo first.
COPY services/test-utils/pom.xml services/test-utils/pom.xml
COPY services/test-utils/src services/test-utils/src
RUN if [ -f services/test-utils/pom.xml ]; then mvn -B -DskipTests -f services/test-utils/pom.xml install; fi

# Copy the service sources and build the service jar (skip tests in CI build image)
COPY services/user-service/pom.xml ./pom.xml
COPY services/user-service/src ./src
RUN mvn -B -DskipTests -f pom.xml package

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
# Copy the built artifact from the builder stage
COPY --from=builder /workspace/services/user-service/target/user-service-*.jar /app/app.jar

# Use a non-root user
USER appuser

# Expose the application port
EXPOSE 8081

# Healthcheck (best-effort): adjust path to your health endpoint if different
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- --no-check-certificate http://localhost:8081/actuator/health || exit 1

ENTRYPOINT ["java","-jar","/app/app.jar"]