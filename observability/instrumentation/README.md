# OpenTelemetry Auto-Instrumentation for ShopEase Services

This directory contains Kubernetes Instrumentation Custom Resources (CRs) for automatic OpenTelemetry instrumentation of all ShopEase microservices.

## 📁 Files

| File | Purpose | Service | Namespace |
|------|---------|---------|-----------|
| `nodejs-instrumentation.yaml` | Node.js/NestJS auto-instrumentation | product-service | shopease-product |
| `python-instrumentation.yaml` | Python/FastAPI auto-instrumentation | notification-service | shopease-notification |
| `java-instrumentation.yaml` | Java/Spring Boot auto-instrumentation | user-service | shopease-user |
| `java-instrumentation-order.yaml` | Java/Spring Boot auto-instrumentation | order-service | shopease-order |
| `nodejs-instrumentation-frontend.yaml` | Node.js/Next.js auto-instrumentation | frontend | shopease-frontend |
| `deploy.sh` | Automated deployment script | All services | All namespaces |
| `README.md` | This documentation | - | - |

## 🎯 Architecture Overview

All services export telemetry to the OpenTelemetry Collector which then routes to:
- **Traces** → Jaeger (via `jaeger-collector.observability.svc:4317`)
- **Metrics** → Prometheus (scrape endpoint)
- **Logs** → Elasticsearch (via `elasticsearch.observability.svc:9200`)

### Protocol & Port Configuration

| Language | Protocol | Port | Reason |
|----------|----------|------|--------|
| Node.js (product-service, frontend) | gRPC | 4317 | High performance, binary protocol |
| Python (notification-service) | HTTP/protobuf | 4318 | Python SDK requirement |
| Java (user-service, order-service) | HTTP/protobuf | 4318 | Java agent default |

## 🚀 Deployment

### Prerequisites

1. **OpenTelemetry Operator must be deployed**
   ```bash
   ~/remote/observability/deploy.sh
   ```

2. **Verify CRDs are installed**
   ```bash
   kubectl get crd instrumentations.opentelemetry.io
   ```

3. **Verify all namespaces exist**
   ```bash
   kubectl get ns shopease-product shopease-notification shopease-user shopease-order shopease-frontend
   ```

### Deploy All Instrumentation CRs

```bash
cd ~/remote/observability/values/instrumentation
./deploy.sh
```

Or deploy individually:
```bash
kubectl apply -f nodejs-instrumentation.yaml
kubectl apply -f python-instrumentation.yaml
kubectl apply -f java-instrumentation.yaml
kubectl apply -f java-instrumentation-order.yaml
kubectl apply -f nodejs-instrumentation-frontend.yaml
```

### Verify Deployment

```bash
# Check all Instrumentation CRs
kubectl get instrumentation -A

# Expected output:
# NAMESPACE                   NAME                     AGE
# shopease-frontend           nodejs-instrumentation   1m
# shopease-notification       python-instrumentation   1m
# shopease-order              java-instrumentation     1m
# shopease-product            nodejs-instrumentation   1m
# shopease-user               java-instrumentation     1m
```

### Restart Services to Apply Auto-Instrumentation

```bash
kubectl rollout restart deployment product-service -n shopease-product
kubectl rollout restart deployment notification-service -n shopease-notification
kubectl rollout restart deployment user-service -n shopease-user
kubectl rollout restart deployment order-service -n shopease-order
kubectl rollout restart deployment frontend -n shopease-frontend
```

## 🔧 Service-Specific Configuration

### product-service (Node.js/NestJS)

**Instrumentation CR**: `nodejs-instrumentation.yaml`  
**Namespace**: `shopease-product`  
**Language**: Node.js 20.x  
**Framework**: NestJS  
**Database**: PostgreSQL

**Auto-Instrumented**:
- ✅ HTTP/HTTPS requests (incoming/outgoing)
- ✅ Express framework
- ✅ NestJS controllers and providers
- ✅ PostgreSQL queries via `pg` driver

**Environment Variables**:
```yaml
OTEL_SERVICE_NAME=product-service
OTEL_NODE_ENABLED_INSTRUMENTATIONS=http,https,express,nestjs-core,pg
OTEL_RESOURCE_ATTRIBUTES=service.namespace=shopease,service.version=1.0.0,deployment.environment=staging
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.opentelemetry-system.svc:4317
```

---

### notification-service (Python/FastAPI)

**Instrumentation CR**: `python-instrumentation.yaml`  
**Namespace**: `shopease-notification`  
**Language**: Python 3.12  
**Framework**: FastAPI

**Auto-Instrumented**:
- ✅ HTTP requests (FastAPI routes)
- ✅ SMTP email operations
- ✅ Console logs (structured as OTel logs)
- ✅ Exception tracking

**Environment Variables**:
```yaml
OTEL_SERVICE_NAME=notification-service
OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED=true
OTEL_RESOURCE_ATTRIBUTES=service.namespace=shopease,service.version=1.0.0,deployment.environment=staging
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.opentelemetry-system.svc:4318
```

---

### user-service (Java/Spring Boot)

**Instrumentation CR**: `java-instrumentation.yaml`  
**Namespace**: `shopease-user`  
**Language**: Java 21  
**Framework**: Spring Boot 3.3+  
**Database**: Oracle DB

**Auto-Instrumented**:
- ✅ HTTP requests (Spring MVC controllers)
- ✅ JDBC database queries (Oracle)
- ✅ Spring components (services, repositories)
- ✅ Exception tracking
- ✅ Spring WebClient (outgoing HTTP)

**Environment Variables**:
```yaml
OTEL_SERVICE_NAME=user-service
OTEL_RESOURCE_ATTRIBUTES=service.namespace=shopease,service.version=1.0.0,deployment.environment=staging
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.opentelemetry-system.svc:4318
```

---

### order-service (Java/Spring Boot)

**Instrumentation CR**: `java-instrumentation-order.yaml`  
**Namespace**: `shopease-order`  
**Language**: Java 21  
**Framework**: Spring Boot 3.3+  
**Database**: MS SQL Server

**Auto-Instrumented**:
- ✅ HTTP requests (Spring MVC controllers)
- ✅ JDBC database queries (MS SQL)
- ✅ Spring components (services, repositories)
- ✅ Exception tracking
- ✅ Payment provider integrations

**Environment Variables**:
```yaml
OTEL_SERVICE_NAME=order-service
OTEL_RESOURCE_ATTRIBUTES=service.namespace=shopease,service.version=1.0.0,deployment.environment=staging
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.opentelemetry-system.svc:4318
```

---

### frontend (Node.js/Next.js)

**Instrumentation CR**: `nodejs-instrumentation-frontend.yaml`  
**Namespace**: `shopease-frontend`  
**Language**: Node.js 20.x  
**Framework**: Next.js 15 (App Router)

**Auto-Instrumented**:
- ✅ HTTP/HTTPS requests (server-side)
- ✅ API route handlers
- ✅ Server component rendering
- ✅ Outgoing HTTP calls to backend services

**Environment Variables**:
```yaml
OTEL_SERVICE_NAME=frontend
OTEL_NODE_ENABLED_INSTRUMENTATIONS=http,https
OTEL_RESOURCE_ATTRIBUTES=service.namespace=shopease,service.version=1.0.0,deployment.environment=staging
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.opentelemetry-system.svc:4317
```

> **Note**: Frontend auto-instrumentation only covers **server-side** operations (Next.js API routes, server components). Client-side browser tracing requires manual SDK integration.

## 🔍 Verification Steps

### 1. Check Init Container Injection

After deploying services, verify the `opentelemetry-auto-instrumentation` init container is injected:

```bash
# product-service
kubectl get pod -n shopease-product -o yaml | grep -A 10 initContainers

# notification-service
kubectl get pod -n shopease-notification -o yaml | grep -A 10 initContainers

# user-service
kubectl get pod -n shopease-user -o yaml | grep -A 10 initContainers

# order-service
kubectl get pod -n shopease-order -o yaml | grep -A 10 initContainers

# frontend
kubectl get pod -n shopease-frontend -o yaml | grep -A 10 initContainers
```

Expected: You should see an init container named `opentelemetry-auto-instrumentation`.

### 2. Check Pod Events

```bash
kubectl get events -n shopease-product | grep -i instrumentation
kubectl get events -n shopease-notification | grep -i instrumentation
kubectl get events -n shopease-user | grep -i instrumentation
kubectl get events -n shopease-order | grep -i instrumentation
kubectl get events -n shopease-frontend | grep -i instrumentation
```

Look for: `Created container opentelemetry-auto-instrumentation` and `Started container opentelemetry-auto-instrumentation`.

### 3. Check Application Logs

```bash
# Node.js services (product-service, frontend)
kubectl logs -n shopease-product -l app.kubernetes.io/name=product-service --tail=50 | grep -i opentelemetry
kubectl logs -n shopease-frontend -l app.kubernetes.io/name=frontend --tail=50 | grep -i opentelemetry

# Python service (notification-service)
kubectl logs -n shopease-notification -l app.kubernetes.io/name=notification-service --tail=50 | grep -i opentelemetry

# Java services (user-service, order-service)
kubectl logs -n shopease-user -l app.kubernetes.io/name=user-service --tail=50 | grep -i opentelemetry
kubectl logs -n shopease-order -l app.kubernetes.io/name=order-service --tail=50 | grep -i opentelemetry
```

Expected patterns:
- **Node.js**: `@opentelemetry/instrumentation Applying instrumentation...`
- **Python**: `opentelemetry.sdk Tracer provider created`
- **Java**: `[otel.javaagent] OpenTelemetry Javaagent`

### 4. Verify Telemetry in Jaeger

1. Access Jaeger UI (http://localhost:16686 or via ingress)
2. Select service from dropdown:
   - `product-service`
   - `notification-service`
   - `user-service`
   - `order-service`
   - `frontend`
3. Click "Find Traces"
4. Generate traffic to services (e.g., browse products, create user, place order)
5. Verify traces appear with proper span hierarchy

## 🛠️ Troubleshooting

### Init Container Not Injected

**Causes**:
1. Annotation in wrong place (must be `spec.template.metadata.annotations`)
2. Instrumentation CR not in same namespace as service
3. OpenTelemetry Operator not running

**Check**:
```bash
# Verify Operator is running
kubectl get pods -n opentelemetry-operator-system

# Check Operator logs
kubectl logs -l app.kubernetes.io/name=opentelemetry-operator -n opentelemetry-operator-system --follow
```

---

### No Traces in Jaeger

**Debug**:
1. Check OTel Collector is reachable:
   ```bash
   kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
     curl -v http://otel-collector.opentelemetry-system.svc:4317
   ```

2. Check application logs for OTel errors:
   ```bash
   kubectl logs <pod-name> -n <namespace> | grep -i error
   ```

3. Verify 100% sampling is enabled in Instrumentation CR:
   ```yaml
   sampler:
     type: parentbased_traceidratio
     argument: "1"  # 100%
   ```

4. Check Collector logs:
   ```bash
   kubectl logs -n opentelemetry-system -l app.kubernetes.io/name=otel-collector --tail=100
   ```

---

### High Memory Usage

**Solution**: Increase resource limits in Deployment or Instrumentation CR:

```yaml
# In Instrumentation CR
nodejs:
  resourceRequirements:
    limits:
      memory: 256Mi
```

Or update Deployment resource limits.

---

### Java Agent Errors

**Common Issues**:
- JVM version mismatch (requires Java 8+)
- Missing permissions (requires read/write to `/tmp`)
- Conflicting Java agents

**Check Java version**:
```bash
kubectl exec -n shopease-user <pod-name> -- java -version
```

## 📊 Expected Metrics in Prometheus

After successful instrumentation, these metrics should be available:

### HTTP Metrics (All Services)
```promql
http_server_duration_milliseconds{service="product-service"}
http_server_requests_total{service="user-service",status="200"}
http_server_active_requests{service="order-service"}
```

### Database Metrics (Java Services)
```promql
db_client_operation_duration{operation="SELECT",service="user-service"}
db_client_connections_active{db="oracle",service="user-service"}
```

### Custom Metrics
```promql
# Order processing
orders_created_total{service="order-service"}
payment_processing_duration{provider="stripe",service="order-service"}

# Email notifications
notifications_sent_total{type="email",service="notification-service"}
```

## 📚 Additional Resources

- [OpenTelemetry Operator Auto-Instrumentation](https://opentelemetry.io/docs/platforms/kubernetes/operator/automatic/)
- [OpenTelemetry Java Agent](https://opentelemetry.io/docs/zero-code/java/agent/)
- [OpenTelemetry Node.js SDK](https://opentelemetry.io/docs/languages/js/)
- [OpenTelemetry Python SDK](https://opentelemetry.io/docs/languages/python/)
- [ShopEase Observability Guide](../../../../docs/guides/OBSERVABILITY_INTEGRATION_GUIDE.md)

---

**Last Updated**: February 7, 2026  
**Status**: ✅ Complete - All 5 services configured for auto-instrumentation
