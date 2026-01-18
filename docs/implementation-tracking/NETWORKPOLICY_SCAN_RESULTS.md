# 🔍 NetworkPolicy Comprehensive Scan Results

**Scan Date**: January 17, 2026  
**Purpose**: Identify all potential service-to-service communication issues with current NetworkPolicy configuration

---

## Executive Summary

✅ **1 CRITICAL Issue Fixed**: Order → Notification (fixed in values-staging.yaml)  
⚠️ **0 Current Blocking Issues**: No existing service-to-service calls are currently blocked  
🔮 **2 Future Issues Identified**: Potential blockers for planned features  
📋 **4 Services Scanned**: user-service, product-service, order-service, notification-service  

---

## Current NetworkPolicy Configuration

### Summary Table

| Service | Namespace | Port | Allowed Ingress From | Status |
|---------|-----------|------|---------------------|--------|
| user-service | shopease-user | 8081 | shopease-frontend | ✅ No issues |
| product-service | shopease-product | 3000 | shopease-frontend | ✅ No issues |
| order-service | shopease-order | 8083 | shopease-frontend | ✅ No issues |
| notification-service | shopease-notification | 8084 | shopease-frontend, shopease-order | ✅ Fixed |

### Detailed Configuration

#### User Service
```yaml
# services/user-service/helm/templates/networkpolicy.yaml
allowedNamespaces:
  - shopease-frontend
```
**Port**: 8081  
**Current Status**: ✅ Correct - Only frontend needs to access user-service currently

#### Product Service
```yaml
# services/product-service/helm/templates/networkpolicy.yaml
allowedNamespaces:
  - shopease-frontend
```
**Port**: 3000  
**Current Status**: ✅ Correct - Only frontend needs to access product-service currently

#### Order Service
```yaml
# services/order-service/helm/templates/networkpolicy.yaml
allowedNamespaces:
  - shopease-frontend
```
**Port**: 8083  
**Current Status**: ✅ Correct - Only frontend needs to access order-service currently

#### Notification Service
```yaml
# services/notification-service/helm/templates/networkpolicy.yaml
allowedNamespaces:
  - shopease-frontend
  - shopease-order        # ✅ FIXED - Added for order→notification integration
```
**Port**: 8084  
**Current Status**: ✅ Fixed - Now allows order-service to send email notifications

---

## Service-to-Service Communication Analysis

### Existing Service Calls (Currently Implemented)

#### 1. Order Service → Notification Service ✅ FIXED
- **Source**: order-service (shopease-order namespace)
- **Target**: notification-service (shopease-notification namespace)
- **Port**: 8084
- **Endpoints**:
  - `POST /api/notification/order-confirmation`
  - `POST /api/notification/shipping`
- **Implementation**: `NotificationClient.java` using Spring WebClient
- **Status**: ✅ **FIXED** - NetworkPolicy updated in values-staging.yaml
- **Risk**: 🟢 LOW - Configuration change applied

**Code Evidence**:
```java
// services/order-service/src/main/java/org/kunlecreates/order/infrastructure/notification/NotificationClient.java
@Value("${notification.service.url}")
private String notificationServiceUrl; // http://notification-service:8003

webClient.post()
    .uri("/api/notification/order-confirmation")
    .header("Authorization", "Bearer " + jwtToken)
    // ... sends email
```

---

### Planned Service Calls (TODO Comments Found)

#### 2. Order Service → User Service 🔮 FUTURE ISSUE
- **Source**: order-service (shopease-order namespace)
- **Target**: user-service (shopease-user namespace)
- **Port**: 8081
- **Purpose**: Fetch real customer name/email instead of using `userRef + "@example.com"`
- **Status**: ⚠️ **WILL BE BLOCKED** when implemented
- **Priority**: 🟡 MEDIUM - Enhancement, not critical

**Code Evidence**:
```java
// NotificationClient.java:52
// In production, we'd fetch user details from user-service
String userEmail = order.getUserRef() + "@example.com"; // Temporary solution
```

**Required Fix** (when implemented):
```yaml
# helm-charts/values-staging.yaml
services:
  user:
    networkPolicy:
      allowedNamespaces:
        - shopease-frontend
        - shopease-order        # ← ADD THIS when implementing user data fetch
```

#### 3. Order Service → Product Service 🔮 POTENTIAL FUTURE ISSUE
- **Source**: order-service (shopease-order namespace)
- **Target**: product-service (shopease-product namespace)
- **Port**: 3000
- **Purpose**: Validate products, check inventory, update stock levels
- **Status**: ⚠️ **WILL BE BLOCKED** if implemented
- **Priority**: 🟡 MEDIUM - Common pattern in e-commerce

**Rationale**: 
When order-service needs to:
- Validate product availability before order creation
- Reserve/decrement inventory when order is placed
- Check product prices to prevent price manipulation

**Required Fix** (if implemented):
```yaml
# helm-charts/values-staging.yaml
services:
  product:
    networkPolicy:
      allowedNamespaces:
        - shopease-frontend
        - shopease-order        # ← ADD THIS if implementing product validation
```

---

## Frontend Egress Configuration

### Frontend NetworkPolicy (Egress)

**Current Configuration**:
```yaml
# frontend/helm/templates/networkpolicy-egress.yaml
networkPolicy:
  backendNamespaces:
    - shopease-product
    - shopease-user
    - shopease-order
    - shopease-notification
```

**Status**: ✅ Correct - Frontend can reach all backend services

---

## Security Analysis

### Current Security Posture

✅ **Principle of Least Privilege**: Each service only allows necessary namespaces  
✅ **Default Deny**: All services have default-deny-ingress policies  
✅ **Namespace Isolation**: Services are properly isolated in separate namespaces  
✅ **Minimal Attack Surface**: No unnecessary cross-service communication allowed  

### Risk Assessment

| Risk Type | Level | Mitigation Status |
|-----------|-------|-------------------|
| Order→Notification blocked | 🔴 CRITICAL | ✅ Fixed |
| Future Order→User blocked | 🟡 MEDIUM | 📋 Documented for future |
| Future Order→Product blocked | 🟡 MEDIUM | 📋 Documented for future |
| Unauthorized service access | 🟢 LOW | ✅ Default deny in place |
| Frontend blocked from backends | 🟢 LOW | ✅ Egress configured |

---

## Recommendations

### Immediate Actions (DONE ✅)
1. ✅ **Fixed**: Added shopease-order to notification-service allowedNamespaces

### Short-Term (When Implementing User Data Fetch)
2. **Update user-service NetworkPolicy** when implementing real customer data fetching:
   ```yaml
   services:
     user:
       networkPolicy:
         allowedNamespaces:
           - shopease-frontend
           - shopease-order
   ```

### Medium-Term (When Implementing Product Validation)
3. **Update product-service NetworkPolicy** if implementing product validation in orders:
   ```yaml
   services:
     product:
       networkPolicy:
         allowedNamespaces:
           - shopease-frontend
           - shopease-order
   ```

### Optional Security Enhancements

#### 1. Add Egress Policies for Backend Services
Restrict what each service can call:

**Order Service Egress** (Recommended):
```yaml
# services/order-service/helm/templates/networkpolicy-egress.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: order-allow-egress
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: order-service
  policyTypes:
    - Egress
  egress:
    # Allow DNS
    - to:
      - namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: kube-system
      ports:
        - protocol: UDP
          port: 53
    # Allow notification service
    - to:
      - namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: shopease-notification
        podSelector:
          matchLabels:
            app.kubernetes.io/name: notification-service
      ports:
        - protocol: TCP
          port: 8084
    # Allow database (MSSQL)
    - to:
      - namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: mssql-system
      ports:
        - protocol: TCP
          port: 1433
```

#### 2. Add Pod-Level Selectors for More Granular Control
Instead of allowing entire namespaces, allow specific pods:

```yaml
ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: "shopease-order"
      podSelector:
        matchLabels:
          app.kubernetes.io/name: order-service
```

#### 3. Monitor NetworkPolicy Denials
Set up alerting for blocked connections:

```bash
# View denied connections (CNI-specific)
kubectl logs -n kube-system -l k8s-app=cilium | grep "Policy denied"

# Or for Calico
kubectl logs -n kube-system -l k8s-app=calico-node | grep "Denied"
```

---

## Testing Checklist

### NetworkPolicy Verification

After any NetworkPolicy changes, run these tests:

#### 1. Test Order → Notification Communication
```bash
# Create test pod in order namespace
kubectl run curl-test -n shopease-order --image=curlimages/curl:latest --rm -it -- \
  curl -v http://notification-service.shopease-notification.svc.cluster.local:8003/health

# Expected: 200 OK
```

#### 2. Verify Frontend → All Backends
```bash
# Create test pod in frontend namespace
kubectl run curl-test -n shopease-frontend --image=curlimages/curl:latest --rm -it -- sh

# Inside pod:
curl http://user-service.shopease-user.svc.cluster.local:8081/health
curl http://product-service.shopease-product.svc.cluster.local:3000/health
curl http://order-service.shopease-order.svc.cluster.local:8083/health
curl http://notification-service.shopease-notification.svc.cluster.local:8003/health

# All should return 200 OK
```

#### 3. Verify Unauthorized Access is Blocked
```bash
# Try to access notification-service from user namespace (should fail)
kubectl run curl-test -n shopease-user --image=curlimages/curl:latest --rm -it -- \
  curl -v --max-time 5 http://notification-service.shopease-notification.svc.cluster.local:8003/health

# Expected: Connection timeout or refused
```

---

## Future Service-to-Service Communication Patterns

### Common E-Commerce Patterns to Consider

| Pattern | Services Involved | NetworkPolicy Impact | Priority |
|---------|------------------|---------------------|----------|
| Order validation | Order → Product | Need to allow | Medium |
| Customer data fetch | Order → User | Need to allow | Medium |
| Welcome emails | User → Notification | Need to allow | Low |
| Password reset emails | User → Notification | Need to allow | Low |
| Low stock alerts | Product → Notification | Need to allow | Low |
| Inventory sync | Order → Product | Need to allow | Medium |

### Decision Matrix for NetworkPolicy Updates

Before adding a new allowedNamespace, ask:

1. **Is this call necessary?** Could the data be included in the API response instead?
2. **Is this call synchronous or async?** Async calls might use message queues instead
3. **What's the security impact?** Is the calling service trusted?
4. **What data is exposed?** Are we following least privilege for data access?
5. **Can we use pod selectors?** More granular than namespace selectors

---

## Troubleshooting Guide

### Symptom: Service-to-Service Call Times Out

**Possible Causes**:
1. NetworkPolicy blocking the connection
2. Service not running
3. Wrong service URL/port
4. DNS resolution failure

**Diagnostic Steps**:

```bash
# 1. Check if target pod is running
kubectl get pods -n shopease-notification

# 2. Check service endpoints
kubectl get svc -n shopease-notification
kubectl get endpoints -n shopease-notification

# 3. Test from the calling namespace
kubectl run curl-test -n shopease-order --image=curlimages/curl:latest --rm -it -- \
  curl -v --max-time 5 http://notification-service.shopease-notification.svc.cluster.local:8003/health

# 4. Check NetworkPolicy
kubectl describe networkpolicy -n shopease-notification

# 5. Check DNS resolution
kubectl run curl-test -n shopease-order --image=curlimages/curl:latest --rm -it -- \
  nslookup notification-service.shopease-notification.svc.cluster.local
```

---

## Summary of Findings

### ✅ No Current Blocking Issues
All currently implemented service-to-service communication has been accounted for and fixed.

### 📋 Action Items for Future Development

1. **When implementing user data fetching in order-service**:
   - Update user-service NetworkPolicy to allow shopease-order
   - File: `helm-charts/values-staging.yaml`
   - Add to: `services.user.networkPolicy.allowedNamespaces`

2. **When implementing product validation in order-service**:
   - Update product-service NetworkPolicy to allow shopease-order
   - File: `helm-charts/values-staging.yaml`
   - Add to: `services.product.networkPolicy.allowedNamespaces`

3. **If implementing user-initiated emails** (welcome, password reset):
   - Update notification-service NetworkPolicy to allow shopease-user
   - File: `helm-charts/values-staging.yaml`
   - Add to: `services.notification.networkPolicy.allowedNamespaces`

### 🔒 Security Status
**EXCELLENT** - All services follow principle of least privilege with default-deny policies

---

**Scan Status**: ✅ **COMPLETE**  
**Current Deployment**: ✅ **SAFE TO DEPLOY** - No blocking issues  
**Documentation**: ✅ **UP TO DATE**

**Related Documents**:
- [NETWORKPOLICY_ISSUE.md](NETWORKPOLICY_ISSUE.md) - Detailed analysis of order→notification issue
- [NETWORKPOLICY_FIX_APPLIED.md](NETWORKPOLICY_FIX_APPLIED.md) - Deployment instructions for the fix
- [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md) - Order-notification integration details
