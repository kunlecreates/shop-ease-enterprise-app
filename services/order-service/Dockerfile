### Multi-stage Dockerfile: build the JAR inside the image to avoid requiring
### an externally-built artifact. This makes CI fallback builds reliable.

# Builder: use an official Maven image with JDK 21 to build the service
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /workspace

# Install Maven in the builder image to avoid depending on a specific
# pre-built `maven:` image tag that may not be present on all registries.
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
	apt-get install -y --no-install-recommends maven && \
	rm -rf /var/lib/apt/lists/*

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