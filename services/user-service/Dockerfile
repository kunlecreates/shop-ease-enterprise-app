FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /workspace
# Copy only Maven metadata first to leverage layer caching
# The repo uses the official Maven base image, so the Maven wrapper and .mvn
# directory aren't required inside the build context. Copy pom.xml and sources
# and run Maven directly inside the image to avoid failing builds when mvnw
# or .mvn are absent.
COPY pom.xml ./
COPY src ./src

# Build the application jar (skip tests in CI build image)
RUN mvn -B -DskipTests -f pom.xml package

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
# Copy the built artifact from the builder stage
COPY --from=builder /workspace/target/user-service-*.jar /app/app.jar

# Use a non-root user
USER appuser

# Expose the application port
EXPOSE 8081

# Healthcheck (best-effort): adjust path to your health endpoint if different
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- --no-check-certificate http://localhost:8081/actuator/health || exit 1

ENTRYPOINT ["java","-jar","/app/app.jar"]