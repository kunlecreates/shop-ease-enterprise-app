# 🏗️ NetworkPolicy Architecture Diagram

## Current Service Communication Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         shopease-frontend Namespace                      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         Frontend App                              │  │
│  │                    (React + Next.js)                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                 │                                        │
│                                 │ Egress: Allowed to all backends       │
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  shopease-user   │    │ shopease-product │    │  shopease-order  │
│    Namespace     │    │    Namespace     │    │    Namespace     │
│                  │    │                  │    │                  │
│ ┌──────────────┐ │    │ ┌──────────────┐ │    │ ┌──────────────┐ │
│ │ User Service │ │    │ │   Product    │ │    │ │    Order     │ │
│ │  (Java)      │ │    │ │   Service    │ │    │ │   Service    │ │
│ │  Port: 8081  │ │    │ │ (NestJS)     │ │    │ │   (Java)     │ │
│ └──────────────┘ │    │ │  Port: 3000  │ │    │ │  Port: 8083  │ │
│                  │    │ └──────────────┘ │    │ └──────┬───────┘ │
│ NetworkPolicy:   │    │                  │    │        │         │
│ ✅ frontend      │    │ NetworkPolicy:   │    │        │ WebClient HTTP
│                  │    │ ✅ frontend      │    │        │         │
└──────────────────┘    └──────────────────┘    │ NetworkPolicy:   │
                                                 │ ✅ frontend      │
                                                 └────────┼─────────┘
                                                          │
                                                          │ POST /api/notification/*
                                                          │ JWT forwarded
                                                          │
                                                          ▼
                                         ┌──────────────────────────────┐
                                         │ shopease-notification        │
                                         │      Namespace               │
                                         │                              │
                                         │ ┌──────────────────────────┐ │
                                         │ │  Notification Service    │ │
                                         │ │      (Python)            │ │
                                         │ │     Port: 8084           │ │
                                         │ └──────────┬───────────────┘ │
                                         │            │                 │
                                         │ NetworkPolicy:               │
                                         │ ✅ frontend                  │
                                         │ ✅ shopease-order ← FIXED    │
                                         └────────────┼─────────────────┘
                                                      │
                                                      │ SMTP
                                                      ▼
                                              Gmail SMTP Server
                                           (smtp.gmail.com:587)
```

## NetworkPolicy Flow Visualization

### ✅ Allowed Flows (Current Configuration)

```
Frontend → User Service       ✅ ALLOWED (frontend in allowedNamespaces)
Frontend → Product Service    ✅ ALLOWED (frontend in allowedNamespaces)
Frontend → Order Service      ✅ ALLOWED (frontend in allowedNamespaces)
Frontend → Notification       ✅ ALLOWED (frontend in allowedNamespaces)
Order → Notification          ✅ ALLOWED (shopease-order in allowedNamespaces) ← FIXED
```

### ⚠️ Future Flows (Will Require NetworkPolicy Updates)

```
Order → User                  ❌ BLOCKED (shopease-order not in user's allowedNamespaces)
                              📋 TODO: Add when implementing customer data fetch

Order → Product               ❌ BLOCKED (shopease-order not in product's allowedNamespaces)
                              📋 TODO: Add when implementing product validation

User → Notification           ❌ BLOCKED (shopease-user not in notification's allowedNamespaces)
                              📋 TODO: Add when implementing welcome/reset emails
```

## Security Zones

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET (Public)                            │
│                                                                      │
│                    Ingress Controller (NGINX)                        │
│                    (TLS Termination)                                 │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               │ HTTPS → shopease-frontend
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│                     DMZ Zone (Frontend Namespace)                     │
│                                                                      │
│                         Frontend Service                             │
│                    (Public-facing Web UI)                            │
│                                                                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               │ Internal HTTP (cluster DNS)
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│                  Application Zone (Backend Namespaces)                │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │     User     │  │   Product    │  │    Order     │             │
│  │   Service    │  │   Service    │  │   Service    │             │
│  └──────────────┘  └──────────────┘  └──────┬───────┘             │
│                                              │                      │
│                                              │ Service-to-Service   │
│                                              │                      │
│                                     ┌────────▼──────────┐           │
│                                     │   Notification    │           │
│                                     │     Service       │           │
│                                     └───────────────────┘           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               │ SMTP/TLS → External Email
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│                    External Services Zone                             │
│                                                                      │
│                        Gmail SMTP Server                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## NetworkPolicy Decision Tree

When implementing a new service-to-service call, follow this decision tree:

```
New Service Call Needed?
         │
         ▼
    ┌────────────────────┐
    │ Is it necessary?   │───NO──▶ Include data in API response
    └─────────┬──────────┘
              │ YES
              ▼
    ┌──────────────────────────┐
    │ Can it be async/event?   │───YES──▶ Use message queue (Kafka, RabbitMQ)
    └─────────┬────────────────┘
              │ NO (must be synchronous)
              ▼
    ┌────────────────────────────┐
    │ Update NetworkPolicy       │
    │                            │
    │ 1. Identify source NS      │
    │ 2. Identify target NS      │
    │ 3. Add to allowedNamespaces│
    │ 4. Test connectivity       │
    │ 5. Monitor for denials     │
    └────────────────────────────┘
```

## Common NetworkPolicy Patterns

### Pattern 1: Frontend-Only Access (Current Default)
```yaml
# All backend services default to this
networkPolicy:
  allowedNamespaces:
    - shopease-frontend
```
**Use Case**: Services that only need to respond to user requests via frontend

### Pattern 2: Service-to-Service Access
```yaml
# notification-service after fix
networkPolicy:
  allowedNamespaces:
    - shopease-frontend    # Still allow frontend
    - shopease-order       # Allow service-to-service
```
**Use Case**: Services that receive requests from other backend services

### Pattern 3: Multiple Backend Consumers
```yaml
# Future: notification-service with multiple callers
networkPolicy:
  allowedNamespaces:
    - shopease-frontend
    - shopease-order       # Order confirmations
    - shopease-user        # Welcome/reset emails
    - shopease-product     # Low stock alerts
```
**Use Case**: Shared services consumed by multiple backends

### Pattern 4: Pod-Level Granularity (Advanced)
```yaml
ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: "shopease-order"
      podSelector:
        matchLabels:
          app.kubernetes.io/name: order-service
          version: v1.0.0
```
**Use Case**: When you need to restrict access to specific pod versions or deployments

## Testing Matrix

| From Namespace | To Service | Expected Result | Test Command |
|----------------|------------|-----------------|--------------|
| shopease-frontend | user-service | ✅ ALLOW | `curl http://user-service.shopease-user:8081/health` |
| shopease-frontend | product-service | ✅ ALLOW | `curl http://product-service.shopease-product:3000/health` |
| shopease-frontend | order-service | ✅ ALLOW | `curl http://order-service.shopease-order:8083/health` |
| shopease-frontend | notification-service | ✅ ALLOW | `curl http://notification-service.shopease-notification:8003/health` |
| shopease-order | notification-service | ✅ ALLOW | `curl http://notification-service.shopease-notification:8003/health` |
| shopease-order | user-service | ❌ DENY | `curl --max-time 5 http://user-service.shopease-user:8081/health` |
| shopease-order | product-service | ❌ DENY | `curl --max-time 5 http://product-service.shopease-product:3000/health` |
| shopease-user | notification-service | ❌ DENY | `curl --max-time 5 http://notification-service.shopease-notification:8003/health` |
| shopease-product | notification-service | ❌ DENY | `curl --max-time 5 http://notification-service.shopease-notification:8003/health` |

**Legend:**
- ✅ ALLOW: Connection should succeed (200 OK)
- ❌ DENY: Connection should timeout or be refused

## Maintenance Checklist

When adding a new service or modifying communication patterns:

- [ ] Document the service-to-service communication requirement
- [ ] Update NetworkPolicy allowedNamespaces in values-staging.yaml
- [ ] Test connectivity from calling namespace
- [ ] Verify unauthorized namespaces are still blocked
- [ ] Update this architecture documentation
- [ ] Add to NETWORKPOLICY_SCAN_RESULTS.md

---

**Architecture Status**: ✅ **SECURE AND DOCUMENTED**  
**Last Updated**: January 17, 2026  
**Maintainer**: DevOps Team
