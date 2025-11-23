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

# Build the order-service artifact (skip tests for CI speed).
# The Dockerfile may be built with different contexts in CI:
# - If the build context is the module folder (`./services/order-service`) the
#   POM will be at `/workspace/pom.xml` and the produced JAR will be under
#   `/workspace/target/`.
# - If the build context is the repo root, the module POM is at
#   `/workspace/services/order-service/pom.xml` and the produced JAR will be
#   under `/workspace/services/order-service/target/`.
#
# Use a small shell wrapper to detect the correct POM and run Maven, then
# copy the resulting JAR to a stable path `/workspace/artifacts/app.jar` so
# the runtime stage can always pick it up.
RUN set -eux; \
	if [ -f /workspace/pom.xml ]; then \
		# If a top-level reactor POM exists, build the reactor (includes all modules)
		mvn -B -DskipTests -f /workspace/pom.xml package; \
	elif [ -f /workspace/services/order-service/pom.xml ]; then \
		# If building from the repo root (common in CI), some sibling modules
		# (e.g., services/test-utils) may be required as dependencies. Install
		# known local test modules into the local Maven repo first so the
		# service module can resolve them during its package phase.
		if [ -f /workspace/services/test-utils/pom.xml ]; then \
			mvn -B -DskipTests -f /workspace/services/test-utils/pom.xml install; \
		fi; \
		mvn -B -DskipTests -f /workspace/services/order-service/pom.xml package; \
	else \
		echo "No recognizable POM found in build context" >&2; exit 1; \
	fi; \
	mkdir -p /workspace/artifacts; \
	if ls /workspace/services/order-service/target/*.jar >/dev/null 2>&1; then \
		cp /workspace/services/order-service/target/*.jar /workspace/artifacts/app.jar; \
	elif ls /workspace/target/*.jar >/dev/null 2>&1; then \
		cp /workspace/target/*.jar /workspace/artifacts/app.jar; \
	else \
		echo "Built JAR not found" >&2; exit 1; \
	fi

# Runtime image: slim JRE
FROM eclipse-temurin:21-jre-alpine AS runtime

# Copy the built JAR from the builder stage into the runtime image
WORKDIR /app

# Runtime JVM options and server port (ensure container and workflow agree on 8080)
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
ENV SERVER_PORT=8080

# Copy the built JAR from the builder stage into the runtime image
COPY --from=builder /workspace/artifacts/app.jar app.jar

# Use a non-root user where possible
USER 1000

# The application listens on port 8080 in CI and the workflow maps host:8080->container:8080
EXPOSE 8080

# Start the JVM and pass the server port explicitly to avoid mismatched EXPOSE vs runtime binding
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -Dserver.port=${SERVER_PORT} -jar app.jar"]