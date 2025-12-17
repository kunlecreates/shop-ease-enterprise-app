FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /workspace
# Copy only Maven metadata first to leverage layer caching
COPY pom.xml mvnw .mvn/ ./
COPY settings.xml* . 2>/dev/null || true
COPY src ./src

# Build the application jar (skip tests in CI build image)
RUN mvn -B -DskipTests package -DskipTests

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