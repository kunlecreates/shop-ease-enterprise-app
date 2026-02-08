# 🔭 ShopEase Observability Integration Guide

**Status**: ✅ **COMPLETE** - All Services Auto-Instrumented  
**Last Updated**: February 7, 2026

---

## Executive Summary

**All ShopEase services are now fully instrumented** using OpenTelemetry Operator-based auto-instrumentation:
- ✅ **All 5 Services**: Auto-instrumented (Java, Node.js, Python)
- ✅ **Optimized Configuration**: Only instrumenting libraries actually in use (40-60% overhead reduction)
- ✅ **Zero Code Changes**: Instrumentation via Kubernetes Operator
- ✅ **Full Observability Stack**: Prometheus, Grafana, Jaeger, Elasticsearch deployed externally

### Current Status

| Service | Language | Auto-Instrumentation | Status |
|---------|----------|---------------------|--------|
| **user-service** | Java 21 (Spring Boot) | Java Agent | ✅ Complete |
| **order-service** | Java 21 (Spring Boot) | Java Agent | ✅ Complete |
| **product-service** | Node.js 20 (NestJS) | Node.js SDK | ✅ Complete |
| **notification-service** | Python 3.12 (FastAPI) | Python SDK | ✅ Complete |
| **frontend** | Node.js 20 (Next.js 15) | Node.js SDK | ✅ Complete |

---

## 🚀 Quick Start

### 1. Deploy Instrumentation CRs

All Instrumentation Custom Resources are located in the `observability/` directory:

```bash
cd observability/instrumentation
./deploy.sh
```

This deploys optimized auto-instrumentation configurations for all 5 services.

### 2. Restart Services to Apply Auto-Instrumentation

```bash
kubectl rollout restart deployment product-service -n shopease-product
kubectl rollout restart deployment notification-service -n shopease-notification
kubectl rollout restart deployment user-service -n shopease-user
kubectl rollout restart deployment order-service -n shopease-order
kubectl rollout restart deployment frontend -n shopease-frontend
```

### 3. Verify Auto-Instrumentation

```bash
# Check Instrumentation CRs are deployed
kubectl get instrumentation -A

# Expected output:
# NAMESPACE                NAME                            AGE
# shopease-product         nodejs-instrumentation          10s
# shopease-notification    python-instrumentation          10s
# shopease-user            java-instrumentation            10s
# shopease-order           java-instrumentation-order      10s
# shopease-frontend        nodejs-instrumentation-frontend 10s

# Verify init container was injected (product-service example)
kubectl get pod -n shopease-product -l app=product-service -o jsonpath='{.items[0].spec.initContainers[*].name}'
# Expected: opentelemetry-auto-instrumentation

# Check environment variables
kubectl exec -n shopease-product deployment/product-service -- env | grep OTEL_
# Expected: OTEL_NODE_ENABLED_INSTRUMENTATIONS=http,https,express,nestjs-core,pg
```

---

## 🏗️ Architecture

### Telemetry Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                  ShopEase Kubernetes Cluster                     │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Frontend   │  │   product   │  │ notification│            │
│  │  (Node.js)  │  │ (Node.js)   │  │  (Python)   │            │
│  │  gRPC:4317  │  │ gRPC:4317   │  │ HTTP:4318   │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                 │                 │                   │
│         │                 └─────────────┬───┘                   │
│         │                               │                       │
│  ┌──────┴──────┐  ┌──────┴──────┐     │                       │
│  │    user     │  │    order    │     │                       │
│  │   (Java)    │  │   (Java)    │     │                       │
│  │ HTTP:4318   │  │ HTTP:4318   │     │                       │
│  └──────┬──────┘  └──────┬──────┘     │                       │
│         │                 │            │                       │
│         └─────────┬───────┴────────────┘                       │
│                   ▼                                            │
│         ┌──────────────────────┐                              │
│         │  OTel Collector      │                              │
│         │  - gRPC :4317        │                              │
│         │  - HTTP :4318        │                              │
│         └──────────┬───────────┘                              │
│                    │                                           │
│       ┌────────────┼────────────┐                             │
│       ▼            ▼            ▼                             │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐                   │
│  │ Jaeger  │ │Prometh- │ │Elasticsearch │                   │
│  │   v2    │ │  eus    │ │   + Kibana   │                   │
│  └─────────┘ └─────────┘ └──────────────┘                   │
└──────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Purpose | Endpoint |
|-----------|---------|----------|
| **OpenTelemetry Operator** | Injects auto-instrumentation into pods | N/A |
| **OpenTelemetry Collector** | Receives, processes, and exports telemetry | gRPC: 4317, HTTP: 4318 |
| **Jaeger v2** | Distributed tracing UI | http://jaeger-query:16686 |
| **Prometheus** | Metrics storage and querying | http://prometheus:9090 |
| **Grafana** | Visualization and dashboards | http://grafana:3000 |
| **Elasticsearch** | Log aggregation and storage | http://elasticsearch:9200 |
| **Kibana** | Log exploration UI | http://kibana:5601 |

---

## 📊 What You Get Out-of-the-Box

### Distributed Tracing (Jaeger)

**Automatic Trace Capture**:
- ✅ **HTTP Requests**: All incoming and outgoing HTTP calls
- ✅ **Database Queries**: PostgreSQL (product), Oracle (user), MS SQL (order)
- ✅ **Inter-Service Calls**: user→notification, order→notification
- ✅ **Framework Operations**: NestJS controllers, Spring Web handlers, FastAPI routes

**View Traces**:
1. Port-forward Jaeger UI:
   ```bash
   kubectl port-forward -n observability svc/jaeger-query 16686:16686
   ```
2. Open http://localhost:16686
3. Select service (e.g., `product-service`, `order-service`)
4. Search for traces

**Example Trace**:
```
POST /api/order/checkout
├─ order-service: POST /checkout
│  ├─ INSERT INTO orders (Spring Data JPA)
│  ├─ SELECT FROM products (HTTP → product-service)
│  └─ POST /notifications (WebClient → notification-service)
│     └─ Send email (FastAPI)
```

### Metrics (Prometheus)

**Automatic Metrics Collection**:
- ✅ **Runtime Metrics**: JVM heap/threads (Java), V8 heap (Node.js), Python GC
- ✅ **HTTP Metrics**: Request rate, duration, error rate
- ✅ **Database Metrics**: Connection pool, query duration
- ✅ **Framework Metrics**: Spring MVC, NestJS, FastAPI-specific metrics

**Query Metrics**:
1. Port-forward Prometheus:
   ```bash
   kubectl port-forward -n prometheus-system svc/prometheus 9090:9090
   ```
2. Open http://localhost:9090
3. Example queries:
   ```promql
   # Request rate (per second)
   rate(http_server_requests_seconds_count[5m])
   
   # P95 latency
   histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))
   
   # Error rate
   rate(http_server_requests_seconds_count{status=~"5.."}[5m])
   ```

### Logs (Elasticsearch + Kibana)

**Automatic Log Enrichment**:
- ✅ **Trace Context Injection**: All logs automatically tagged with `trace_id` and `span_id`
- ✅ **Structured Logging**: JSON-formatted logs with OpenTelemetry semantic conventions
- ✅ **Log Correlation**: Link logs to traces in Jaeger

**View Logs**:
1. Port-forward Kibana:
   ```bash
   kubectl port-forward -n observability svc/kibana 5601:5601
   ```
2. Open http://localhost:5601
3. Create index pattern: `logs-*`
4. Search by `trace_id` or `span_id` to correlate with traces

---

## 🔧 Configuration Details

### Service-to-Instrumentation Mapping

| Service | Instrumentation CR | Protocol | Port | Optimizations |
|---------|-------------------|----------|------|---------------|
| **product-service** | `nodejs-instrumentation.yaml` | gRPC | 4317 | Whitelist: http,https,express,nestjs-core,pg |
| **notification-service** | `python-instrumentation.yaml` | HTTP/protobuf | 4318 | Blacklist: httpx,aiohttp,requests,urllib,tornado |
| **user-service** | `java-instrumentation.yaml` | HTTP/protobuf | 4318 | Whitelist: Spring Web, JDBC, Hibernate, RestTemplate |
| **order-service** | `java-instrumentation-order.yaml` | HTTP/protobuf | 4318 | Whitelist: Spring Web, WebFlux, Reactor, JDBC, Hibernate |
| **frontend** | `nodejs-instrumentation-frontend.yaml` | gRPC | 4317 | Minimal: http,https only |

### Optimization Strategy

All Instrumentation CRs are **optimized to only enable libraries actually used**:

**Benefits**:
- 40-60% reduction in CPU/memory overhead
- 60-70% reduction in span volume
- Eliminates noise from unused library spans (Kafka, Redis, MongoDB, etc.)
- Maintains 100% coverage for actual application behavior

For detailed optimization analysis, see [OTEL_INSTRUMENTATION_OPTIMIZATION.md](../OTEL_INSTRUMENTATION_OPTIMIZATION.md).

---

## 🛠️ Troubleshooting

### Issue: No Traces Appearing in Jaeger

**Debug Steps**:
1. Check if Instrumentation CR exists:
   ```bash
   kubectl get instrumentation -n shopease-product
   ```
2. Verify init container was injected:
   ```bash
   kubectl get pod -n shopease-product -o yaml | grep opentelemetry-auto-instrumentation
   ```
3. Check collector endpoint is reachable:
   ```bash
   kubectl exec -n shopease-product deployment/product-service -- nc -zv otel-collector.observability 4317
   ```
4. Review service logs for OTel initialization:
   ```bash
   kubectl logs -n shopease-product deployment/product-service
   ```

### Issue: Too Many Unwanted Spans (Kafka, Redis, MongoDB)

**Solution**: Instrumentation CRs are already optimized. If you still see unwanted spans:
1. Verify the optimized Instrumentation CR is deployed:
   ```bash
   kubectl get instrumentation -n shopease-product -o yaml
   ```
2. Check environment variables in running pod:
   ```bash
   kubectl exec -n shopease-product deployment/product-service -- env | grep OTEL_
   ```
3. Restart the service to apply changes:
   ```bash
   kubectl rollout restart deployment/product-service -n shopease-product
   ```

### Issue: High Memory Usage After Instrumentation

**Possible Causes**:
- Too many instrumentations enabled (check `OTEL_NODE_ENABLED_INSTRUMENTATIONS` or `OTEL_INSTRUMENTATION_*_ENABLED`)
- Large trace payloads (adjust sampling rate)

**Solutions**:
1. Verify only necessary instrumentations are enabled (see [optimization report](../OTEL_INSTRUMENTATION_OPTIMIZATION.md))
2. Adjust sampling rate in Instrumentation CR:
   ```yaml
   spec:
     sampler:
       type: parentbased_traceidratio
       argument: "0.5"  # Sample 50% of traces
   ```

---

## 📚 Additional Documentation

### Internal Documentation
- [Observability Directory README](../../observability/README.md) - Quick start and deployment guide
- [Instrumentation README](../../observability/instrumentation/README.md) - Detailed per-service configuration
- [Complete Implementation Summary](../OTEL_COMPLETE_IMPLEMENTATION_SUMMARY.md) - Full technical implementation details
- [Optimization Report](../OTEL_INSTRUMENTATION_OPTIMIZATION.md) - Performance optimization analysis

### External Resources
- [OpenTelemetry Documentation](https://opentelemetry.io/)
- [OpenTelemetry Kubernetes Operator](https://github.com/open-telemetry/opentelemetry-operator)
- [Auto-Instrumentation Configuration](https://opentelemetry.io/docs/platforms/kubernetes/operator/automatic/)
- [Node.js Instrumentation](https://opentelemetry.io/docs/zero-code/js/configuration/)
- [Python Instrumentation](https://opentelemetry.io/docs/zero-code/python/configuration/)
- [Java Agent Configuration](https://opentelemetry.io/docs/zero-code/java/agent/)

---

## 🎯 Next Steps

### Recommended Enhancements

1. **Create Grafana Dashboards**
   - Import pre-built dashboards for Spring Boot, NestJS, FastAPI
   - Create custom dashboards for business metrics
   - Configure dashboard variables for service selection

2. **Configure Alert Rules**
   - High error rate (>5% of requests)
   - High latency (P95 > 1s)
   - Service availability (no successful requests in 5m)
   - Database connection pool exhaustion

3. **Set Up SLOs/SLIs**
   - Define Service Level Indicators (SLIs): request success rate, latency, availability
   - Set Service Level Objectives (SLOs): 99.9% availability, P95 latency < 500ms
   - Configure SLO burn rate alerts

4. **Implement Continuous Profiling**
   - Deploy Pyroscope for CPU and memory profiling
   - Integrate with OpenTelemetry for correlated profiles and traces

---

**Status**: ✅ **OBSERVABILITY COMPLETE**  
**Last Updated**: February 7, 2026  
**Maintained By**: ShopEase Platform Team
