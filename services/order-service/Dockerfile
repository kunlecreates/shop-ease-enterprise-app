### Multi-stage Dockerfile: build the JAR inside the image to avoid requiring
### an externally-built artifact. This makes CI fallback builds reliable.

# Builder: use an official Maven image with JDK 21 to build the service
FROM maven:3.9.6-jdk-21 AS builder
WORKDIR /workspace

# Copy the repository into the build context. We intentionally copy the whole
# workspace so multi-module Maven builds and relative parent POM references
# resolve correctly inside the container.
COPY . /workspace

# Build the order-service artifact (skip tests for CI speed). This will
# produce the expected JAR under services/order-service/target/.
RUN mvn -B -DskipTests -f services/order-service/pom.xml package

# Runtime image: slim JRE
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"

# Copy the built JAR from the builder stage into the runtime image
COPY --from=builder /workspace/services/order-service/target/order-service-*.jar app.jar

# Use a non-root user where possible
USER 1000
EXPOSE 8083
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]