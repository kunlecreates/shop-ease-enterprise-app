# Builder: use Maven image to build the service artifact
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /workspace
# Copy repository modules required for build from the repo root context.
# We run Maven inside the builder image and install any local helper modules
# into the local Maven repo so service builds that depend on them can succeed
# without requiring a published package. Copy only the files we need to keep
# the context small.

# Copy the service sources and build the service jar (skip tests in CI build image)
COPY services/user-service/pom.xml ./pom.xml
COPY services/user-service/src ./src
# Build the service jar (skip tests in CI build image). Rely on Maven Central.
RUN mvn -B -DskipTests -f pom.xml package

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
# Copy the built artifact from the builder stage
COPY --from=builder /workspace/target/user-service-*.jar /app/app.jar

# Use a non-root user
USER appuser

# Expose the application port
EXPOSE 8081

# Healthcheck (best-effort): adjust path to your health endpoint if different
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- --no-check-certificate http://localhost:8081/actuator/health || exit 1

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -Duser.timezone=UTC -Doracle.jdbc.timezoneAsRegion=false"

# Use sh -c so the `JAVA_OPTS` environment variable is expanded at container start
# and the JVM respects container memory limits (MaxRAMPercentage).
ENTRYPOINT ["sh","-c","exec java $JAVA_OPTS -jar /app/app.jar"]