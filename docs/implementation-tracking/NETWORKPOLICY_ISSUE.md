# ⚠️ CRITICAL: NetworkPolicy Configuration Required for Order-Notification Integration

## Problem Summary

**YES, there WILL be inter-service communication issues** with the current NetworkPolicy configuration when order-service tries to communicate with notification-service.

### Root Cause

The notification-service NetworkPolicy **only allows ingress traffic from**:
- `shopease-frontend` namespace
- Pods with label `run: curl-test` (for testing)

It does **NOT allow traffic from `shopease-order` namespace**, which is where order-service runs.

## Current NetworkPolicy Configuration

### Notification Service (Receiving Service)
**File**: `services/notification-service/helm/templates/networkpolicy.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: notification-allow-from-frontend-and-curl
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: notification-service
  policyTypes:
    - Ingress
  ingress:
    - from:
      # ONLY allows frontend namespace by default
      - namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: "shopease-frontend"
      # ONLY allows curl-test pods
      - podSelector:
          matchLabels:
            run: curl-test
      ports:
        - protocol: TCP
          port: 8084  # Notification service port
```

### Order Service (Calling Service)
**Namespace**: `shopease-order`
**Needs to call**: notification-service on port 8084

### The Problem Flow
```
Order Service (shopease-order namespace)
    ↓ HTTP POST to notification-service:8084
    ↓
    ❌ BLOCKED by NetworkPolicy
    ↓
Notification Service (shopease-notification namespace)
```

## Impact on Integration

### What Will Fail
1. **Order Confirmation Emails** - When `OrderService.createOrder()` is called
2. **Shipping Notifications** - When order status changes to SHIPPED
3. **All email notifications** triggered by order-service

### Error Symptoms
- Order operations will **succeed** (fire-and-forget pattern)
- Emails will **NOT be sent**
- Logs will show connection timeouts:
  ```
  ERROR NotificationClient - Failed to send order confirmation email for order 123: 
  Connection timeout after 5000ms
  ```
- WebClient will timeout after 5 seconds and log the error

### Why Orders Still Work
The integration uses a **fire-and-forget pattern**, so:
- Order creation/updates complete successfully
- Email sending happens asynchronously
- Failures are logged but don't block orders

## Solution Options

### Option 1: Update Notification Service NetworkPolicy (RECOMMENDED)

Update the notification-service NetworkPolicy to allow traffic from order-service namespace.

**File to modify**: `services/notification-service/helm/templates/networkpolicy.yaml`

**Change**:
```yaml
    - from:
      {{- $global := (default (dict) .Values.global) }}
      {{- if and .Values.networkPolicy .Values.networkPolicy.allowedNamespaces }}
      {{- range $ns := .Values.networkPolicy.allowedNamespaces }}
      - namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: {{ $ns | quote }}
      {{- end }}
      {{- else }}
      - namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: {{ ($global.frontendNamespace | default "shopease-frontend") | quote }}
      {{- end }}
```

**Then update** `helm-charts/values-staging.yaml`:

```yaml
  notification:
    image: notification-service
    tag: "staging-${GITHUB_SHA_SHORT}"
    # ... existing config ...
    networkPolicy:
      allowedNamespaces:
        - shopease-frontend
        - shopease-order        # ← ADD THIS LINE
```

### Option 2: Add Service-to-Service NetworkPolicy Template

Create a more granular NetworkPolicy that allows specific service-to-service communication.

**Create new file**: `services/notification-service/helm/templates/networkpolicy-backend.yaml`

```yaml
{{- if .Values.networkPolicy.allowBackendServices }}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: notification-allow-from-backend-services
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: notification-service
  policyTypes:
    - Ingress
  ingress:
    - from:
      - namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: "shopease-order"
        podSelector:
          matchLabels:
            app.kubernetes.io/name: order-service
      ports:
        - protocol: TCP
          port: {{ .Values.service.targetPort | default 8084 }}
{{- end }}
```

**Update** `services/notification-service/helm/values.yaml`:

```yaml
networkPolicy:
  allowBackendServices: true
  allowedNamespaces:
    - shopease-frontend
    - shopease-order
```

### Option 3: Disable NetworkPolicies (NOT RECOMMENDED for Production)

For development/testing only:

```bash
# Temporarily delete NetworkPolicy
kubectl delete networkpolicy notification-allow-from-frontend-and-curl -n shopease-notification
```

## Recommended Implementation

### Step 1: Update NetworkPolicy Template

The template already supports `allowedNamespaces`, so we just need to configure it.

### Step 2: Update Staging Values

**File**: `helm-charts/values-staging.yaml`

```yaml
  notification:
    image: notification-service
    tag: "staging-${GITHUB_SHA_SHORT}"
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 300m
        memory: 256Mi
    networkPolicy:
      allowedNamespaces:
        - shopease-frontend
        - shopease-order        # ← ADD THIS
```

### Step 3: Apply Changes

```bash
# Navigate to helm charts directory
cd helm-charts

# Update the staging deployment
helm upgrade shopease-notification ./services/notification-service/helm \
  -n shopease-notification \
  -f values-staging.yaml

# Verify NetworkPolicy was updated
kubectl describe networkpolicy notification-allow-from-frontend-and-curl -n shopease-notification
```

### Step 4: Verify Communication

```bash
# Deploy a test pod in order namespace
kubectl run curl-test -n shopease-order --image=curlimages/curl:latest --rm -it -- sh

# Inside the pod, test notification service
curl -X POST http://notification-service.shopease-notification.svc.cluster.local/health

# Should return 200 OK
```

## Additional Services That May Need Updates

If you add more inter-service communication in the future, you'll need to update NetworkPolicies for:

### User Service → Notification Service
If user-service needs to send welcome emails or password resets:

```yaml
  user:
    networkPolicy:
      allowedNamespaces:
        - shopease-frontend
```

```yaml
  notification:
    networkPolicy:
      allowedNamespaces:
        - shopease-frontend
        - shopease-order
        - shopease-user        # ← Future addition
```

### Order Service → User Service
Currently order-service doesn't call user-service, but if you implement fetching customer data:

```yaml
  user:
    networkPolicy:
      allowedNamespaces:
        - shopease-frontend
        - shopease-order        # ← For customer data fetching
```

## Testing the Fix

### 1. Before Fix (Should Fail)
```bash
# Check order-service logs after creating an order
kubectl logs -n shopease-order deployment/order-service | grep "Failed to send"

# Expected: Connection timeout errors
```

### 2. After Fix (Should Succeed)
```bash
# Create an order via API
curl -X POST https://shop.kunlecreates.org/api/order \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"PENDING","total":99.99}'

# Check order-service logs
kubectl logs -n shopease-order deployment/order-service | grep "Order confirmation email sent"

# Expected: Success message with order ID
```

### 3. Verify NetworkPolicy
```bash
# Check that order namespace is allowed
kubectl get networkpolicy notification-allow-from-frontend-and-curl -n shopease-notification -o yaml

# Should show shopease-order in the allowedNamespaces
```

## Production Considerations

### Security Best Practices

1. **Principle of Least Privilege**: Only allow necessary namespaces
2. **Label Selectors**: Consider adding pod label selectors for more granular control
3. **Egress Policies**: Add egress policies for order-service to only allow notification-service
4. **Monitoring**: Set up alerts for NetworkPolicy denials

### Egress Policy for Order Service (Optional but Recommended)

**Create**: `services/order-service/helm/templates/networkpolicy-egress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: order-allow-egress-to-notification
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
    # Allow database access (MSSQL)
    - to:
      - namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: mssql-system
      ports:
        - protocol: TCP
          port: 1433
```

## Summary

### Current State
- ❌ Order-service **CANNOT** call notification-service
- ❌ Email notifications **WILL FAIL** silently
- ✅ Order operations **WILL SUCCEED** (fire-and-forget protects core functionality)

### Required Action
- ✅ Add `shopease-order` to notification-service's `allowedNamespaces`
- ✅ Update `helm-charts/values-staging.yaml`
- ✅ Redeploy notification-service with updated NetworkPolicy

### Estimated Fix Time
- **Configuration change**: 5 minutes
- **Testing**: 10 minutes
- **Total**: 15 minutes

---

**Priority**: 🔴 **HIGH** - Must be fixed before order-notification integration can work in deployed environments

**Impact**: Email notifications will not work until NetworkPolicy is updated

**Risk**: Low - Fire-and-forget pattern ensures orders still process successfully
