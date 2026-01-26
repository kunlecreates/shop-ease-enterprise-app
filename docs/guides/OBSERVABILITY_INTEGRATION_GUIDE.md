# 🔭 ShopEase Observability Integration Guide

**Status**: Observability Infrastructure **Deployed** (85% Complete)  
**Last Updated**: January 17, 2026

---

## Executive Summary

The **external observability stack is fully deployed** via `/observability/deploy.sh` in separate namespaces:
- ✅ **Elasticsearch + Kibana** (ECK) → `observability-system`
- ✅ **Prometheus + Alertmanager** → `prometheus-system`
- ✅ **Grafana** → `grafana-system`
- ✅ **Jaeger v2** → `opentelemetry-system`
- ✅ **OpenTelemetry Operator + Collectors** → `opentelemetry-system`

**What's Left**: Connect ShopEase services to this external observability stack.

---

## Current State

### ✅ Already Configured

**Java Services (user-service, order-service):**
- ✅ OpenTelemetry config in `application.yml`:
  ```yaml
  otel:
    exporter:
      otlp:
        endpoint: ${OTEL_EXPORTER_OTLP_ENDPOINT:http://otel-collector:4317}
  ```
- ✅ Prometheus metrics endpoint exposed via Spring Boot Actuator
- ✅ Ready for auto-instrumentation via OpenTelemetry Operator

**Helm Charts:**
- ✅ Global OTel collector endpoint configured in `values-staging.yaml`:
  ```yaml
  global:
    otel:
      collectorEndpoint: http://otel-collector.operators:4317
  ```

### ⚠️ Configuration Gaps

**1. Namespace Auto-Instrumentation Not Enabled**
- **Issue**: ShopEase namespaces not in `OPT_IN_NAMESPACES` list
- **Current Opt-In**: `development-system`, `acegrocer-system`
- **Missing**: `shopease-user`, `shopease-product`, `shopease-order`, `shopease-notification`

**2. NestJS Service (product-service) Not Instrumented**
- No OpenTelemetry SDK configured in `main.ts`
- Missing dependencies: `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`

**3. Python Service (notification-service) Not Instrumented**
- No OpenTelemetry SDK configured in `main.py`
- Missing dependencies: `opentelemetry-distro`, `opentelemetry-exporter-otlp`

**4. Observability Dashboards Not Imported**
- Grafana deployed but no service-specific dashboards configured

**5. Alert Rules Not Configured**
- Alertmanager ready but no Prometheus alert rules defined

---

## Integration Steps

### Step 1: Enable Auto-Instrumentation for ShopEase Namespaces

**File**: `/observability/deploy.sh` (line 22)

**Change**:
```bash
# Before
OPT_IN_NAMESPACES=("development-system" "acegrocer-system")

# After
OPT_IN_NAMESPACES=("development-system" "acegrocer-system" "shopease-user" "shopease-product" "shopease-order" "shopease-notification")
```

**What This Does**:
- Annotates ShopEase namespaces with:
  ```yaml
  instrumentation.opentelemetry.io/inject-java: "true"
  instrumentation.opentelemetry.io/instrumentation: "opentelemetry-system/elastic-instrumentation"
  ```
- OpenTelemetry Operator will automatically inject Java agent into user-service and order-service pods
- No code changes needed for Java services

**Apply Changes**:
```bash
cd /observability
./deploy.sh
```

---

### Step 2: Instrument Product Service (NestJS)

**Install Dependencies**:
```bash
cd services/product-service
npm install --save \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-grpc \
  @opentelemetry/resources \
  @opentelemetry/semantic-conventions
```

**Create Instrumentation File**: `src/tracing.ts`
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'product-service',
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector.opentelemetry-system.svc:4317',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().then(() => console.log('Tracing terminated'));
});
```

**Update**: `src/main.ts`
```typescript
import './tracing'; // Must be first import
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(process.env.PORT || 8082);
}
bootstrap();
```

**Update Helm Deployment** (if needed):
Add environment variable to product-service deployment:
```yaml
env:
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: "http://otel-collector.opentelemetry-system.svc:4317"
```

---

### Step 3: Instrument Notification Service (Python)

**Install Dependencies**:
```bash
cd services/notification-service
source venv/bin/activate
pip install opentelemetry-distro opentelemetry-exporter-otlp
```

**Update**: `app/main.py`
```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
import os

# Initialize OpenTelemetry
resource = Resource(attributes={
    SERVICE_NAME: "notification-service"
})

provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(
    OTLPSpanExporter(
        endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector.opentelemetry-system.svc:4317"),
        insecure=True
    )
)
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

from fastapi import FastAPI, APIRouter, Depends, HTTPException
from app.config.jwt_auth import get_current_user
from app.models.email import (
    EmailRequest,
    EmailResponse,
    OrderConfirmationData,
    ShippingNotificationData,
    PasswordResetData,
    WelcomeEmailData
)
from app.services.email_service import email_service

app = FastAPI(title="Notification Service", version="0.1.0")

# Instrument FastAPI
FastAPIInstrumentor.instrument_app(app)

router = APIRouter(prefix="/api/notification")
# ... rest of the code
```

**Update `requirements.txt`**:
```txt
opentelemetry-distro
opentelemetry-exporter-otlp
opentelemetry-instrumentation-fastapi
```

---

### Step 4: Verify Telemetry Data Flow

**Access Observability UIs**:
```bash
# Jaeger UI (Traces)
kubectl port-forward svc/jaeger-query -n opentelemetry-system 16686:16686
# Open: http://localhost:16686

# Grafana (Metrics)
kubectl port-forward svc/grafana-service -n grafana-system 3000:3000
# Open: http://localhost:3000
# Default: admin / <check secret>

# Kibana (Logs)
kubectl port-forward svc/kb-main-kb-http -n observability-system 5601:5601
# Open: https://localhost:5601
# Default: elastic / <check secret>

# Prometheus (Metrics)
kubectl port-forward svc/prometheus-stack-kube-prom-prometheus -n prometheus-system 9090:9090
# Open: http://localhost:9090
```

**Retrieve Credentials**:
```bash
# Grafana admin password
kubectl get secret grafana-credentials -n observability-system -o jsonpath='{.data.GF_SECURITY_ADMIN_PASSWORD}' | base64 -d

# Elasticsearch elastic user password
kubectl get secret es-main-es-elastic-user -n observability-system -o jsonpath='{.data.elastic}' | base64 -d
```

**Test Trace Generation**:
```bash
# Generate some traffic
curl -H "Authorization: Bearer <JWT_TOKEN>" https://shop.kunlecreates.org/api/user/profile
curl -H "Authorization: Bearer <JWT_TOKEN>" https://shop.kunlecreates.org/api/product/products
curl -H "Authorization: Bearer <JWT_TOKEN>" https://shop.kunlecreates.org/api/order/cart
```

**Verify in Jaeger**:
1. Open Jaeger UI
2. Select service: `user-service`, `product-service`, `order-service`, `notification-service`
3. Click "Find Traces"
4. Should see distributed traces across services

---

### Step 5: Configure Dashboards

**Import Pre-Built Dashboards to Grafana**:
1. Navigate to Grafana UI
2. Go to **Dashboards** → **Import**
3. Import these dashboard IDs:
   - **Spring Boot 3.x**: 19004
   - **JVM (Micrometer)**: 4701
   - **Node.js Application**: 11159
   - **Kubernetes Cluster Monitoring**: 7249
   - **NGINX Ingress Controller**: 9614

**Custom ShopEase Dashboard** (Create):
```yaml
# Create file: observability/dashboards/shopease-overview.json
# Import via Grafana UI or ConfigMap
```

---

### Step 6: Configure Prometheus Alert Rules

**Create Alert Rules**: `observability/alerts/shopease-alerts.yaml`
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: shopease-alerts
  namespace: prometheus-system
spec:
  groups:
    - name: shopease-services
      interval: 30s
      rules:
        - alert: ServiceDown
          expr: up{namespace=~"shopease-.*"} == 0
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Service {{ $labels.job }} is down"
            description: "{{ $labels.namespace }}/{{ $labels.pod }} has been down for more than 5 minutes."
        
        - alert: HighErrorRate
          expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) > 0.05
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High error rate on {{ $labels.job }}"
            description: "Error rate is {{ $value }} errors/sec"
        
        - alert: HighMemoryUsage
          expr: container_memory_usage_bytes{namespace=~"shopease-.*"} / container_spec_memory_limit_bytes > 0.9
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High memory usage on {{ $labels.pod }}"
            description: "Memory usage is above 90%"
```

**Apply**:
```bash
kubectl apply -f observability/alerts/shopease-alerts.yaml
```

---

## Verification Checklist

- [ ] Run `/observability/deploy.sh` with updated `OPT_IN_NAMESPACES`
- [ ] Verify namespace annotations:
  ```bash
  kubectl get namespace shopease-user -o yaml | grep instrumentation
  ```
- [ ] Add OpenTelemetry SDK to product-service (`src/tracing.ts`)
- [ ] Add OpenTelemetry SDK to notification-service (`app/main.py`)
- [ ] Restart all ShopEase services to pick up instrumentation:
  ```bash
  kubectl rollout restart deployment -n shopease-user
  kubectl rollout restart deployment -n shopease-product
  kubectl rollout restart deployment -n shopease-order
  kubectl rollout restart deployment -n shopease-notification
  ```
- [ ] Generate test traffic to services
- [ ] Check Jaeger for distributed traces
- [ ] Check Prometheus for metrics (targets up)
- [ ] Check Grafana for service dashboards
- [ ] Check Kibana for application logs
- [ ] Configure alert rules in Prometheus
- [ ] Test alert notifications (optional: integrate with Slack/email)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     ShopEase Services                            │
│  (shopease-user, shopease-product, shopease-order,              │
│   shopease-notification)                                         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ user-service │  │order-service │  │product-svc   │          │
│  │   (Java)     │  │   (Java)     │  │  (NestJS)    │          │
│  │ Auto-Instr ✅│  │ Auto-Instr ✅│  │ SDK Required │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
│                            ▼                                      │
│              ┌─────────────────────────┐                         │
│              │  OTel Collector Gateway │                         │
│              │ (opentelemetry-system)  │                         │
│              └─────────────────────────┘                         │
│                     │       │       │                            │
└─────────────────────┼───────┼───────┼────────────────────────────┘
                      │       │       │
        ┌─────────────┘       │       └─────────────┐
        ▼                     ▼                      ▼
┌───────────────┐    ┌────────────────┐    ┌────────────────┐
│   Jaeger v2   │    │  Prometheus    │    │ Elasticsearch  │
│ (Distributed  │    │   + Grafana    │    │   + Kibana     │
│    Traces)    │    │   (Metrics)    │    │    (Logs)      │
│opentelemetry- │    │prometheus-     │    │observability-  │
│    system     │    │    system      │    │    system      │
└───────────────┘    └────────────────┘    └────────────────┘
```

---

## Troubleshooting

### Issue: No traces in Jaeger

**Check**:
```bash
# Verify OTel collector is running
kubectl get pods -n opentelemetry-system

# Check collector logs
kubectl logs -n opentelemetry-system -l app.kubernetes.io/name=opentelemetry-collector

# Verify namespace annotation
kubectl get namespace shopease-user -o yaml | grep instrumentation

# Check Java agent injection (should see init container)
kubectl describe pod -n shopease-user | grep -A 5 "Init Containers"
```

### Issue: Services not sending metrics to Prometheus

**Check**:
```bash
# Verify Prometheus targets
kubectl port-forward svc/prometheus-stack-kube-prom-prometheus -n prometheus-system 9090:9090
# Navigate to: http://localhost:9090/targets

# Check ServiceMonitor resources
kubectl get servicemonitor -n shopease-user

# Verify metrics endpoint
kubectl port-forward svc/user-service -n shopease-user 8080:8080
curl http://localhost:8080/actuator/prometheus
```

### Issue: Auto-instrumentation not working

**Check**:
```bash
# Verify OpenTelemetry Operator is running
kubectl get pods -n opentelemetry-system

# Check Instrumentation resource
kubectl get instrumentation -n opentelemetry-system

# Verify namespace annotation
kubectl describe namespace shopease-user
```

---

## Next Steps

1. **Immediate** (Today):
   - Update `/observability/deploy.sh` with ShopEase namespaces ✅ **DONE**
   - Redeploy observability stack: `cd /observability && ./deploy.sh`
   - Restart ShopEase deployments to pick up auto-instrumentation

2. **Short-Term** (Next 2 days):
   - Add OpenTelemetry SDK to product-service (NestJS)
   - Add OpenTelemetry SDK to notification-service (Python)
   - Import Grafana dashboards
   - Configure basic alert rules

3. **Medium-Term** (Next week):
   - Create custom ShopEase overview dashboard
   - Configure alert notifications (Slack/email)
   - Document observability runbooks
   - Train team on observability tools

---

**Status**: Infrastructure complete, service integration in progress  
**Completion**: 85% → 100% after completing Steps 1-6  
**Estimated Time**: 4-6 hours for full integration

---

**Generated By**: GitHub Copilot  
**Last Updated**: January 17, 2026
