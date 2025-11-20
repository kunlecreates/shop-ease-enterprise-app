FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
COPY target/user-service-*.jar app.jar
USER 1000
EXPOSE 8081
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]