# ✅ NetworkPolicy Fix Applied

## Summary

**Issue Identified**: Order-service → Notification-service communication was blocked by NetworkPolicy.

**Root Cause**: notification-service NetworkPolicy only allowed ingress from `shopease-frontend` namespace, but order-service runs in `shopease-order` namespace.

**Fix Applied**: Added `shopease-order` to notification-service's `allowedNamespaces` in values-staging.yaml.

---

## Changes Made

### File: `helm-charts/values-staging.yaml`

**Before:**
```yaml
  notification:
    networkPolicy:
      allowedNamespaces:
        - shopease-frontend
```

**After:**
```yaml
  notification:
    networkPolicy:
      allowedNamespaces:
        - shopease-frontend
        - shopease-order        # Allow order-service to send notification requests
```

---

## What This Fixes

✅ **Order Confirmation Emails** - Will now be sent when orders are created  
✅ **Shipping Notifications** - Will now be sent when order status changes to SHIPPED  
✅ **Service-to-Service Communication** - order-service can now reach notification-service on port 8084

---

## Deployment Instructions

### 1. Deploy Updated Configuration

```bash
# Navigate to helm charts directory
cd helm-charts

# Update notification-service with new NetworkPolicy
helm upgrade shopease-notification ../services/notification-service/helm \
  -n shopease-notification \
  -f values-staging.yaml

# Verify the NetworkPolicy was updated
kubectl get networkpolicy notification-allow-from-frontend-and-curl -n shopease-notification -o yaml
```

Expected output should show both namespaces:
```yaml
- namespaceSelector:
    matchLabels:
      kubernetes.io/metadata.name: "shopease-frontend"
- namespaceSelector:
    matchLabels:
      kubernetes.io/metadata.name: "shopease-order"
```

### 2. Test the Fix

**Option A: Create a test order via API**
```bash
# Create an order (replace with your actual JWT token)
curl -X POST https://shop.kunlecreates.org/api/order \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "status": "PENDING",
    "total": 99.99
  }'

# Check order-service logs for success message
kubectl logs -n shopease-order deployment/order-service | grep "email sent successfully"
```

**Option B: Test from inside order namespace**
```bash
# Create a test pod in order namespace
kubectl run curl-test -n shopease-order --image=curlimages/curl:latest --rm -it -- sh

# Inside the pod, test notification service health endpoint
curl -X GET http://notification-service.shopease-notification.svc.cluster.local:8003/health

# Should return 200 OK instead of connection timeout
```

### 3. Monitor Logs

**Order Service Logs (Should see success messages):**
```bash
kubectl logs -n shopease-order deployment/order-service --tail=50 -f
```

Expected:
```
INFO NotificationClient - Order confirmation email sent successfully for order: ORDER-123
```

**Notification Service Logs (Should see incoming requests):**
```bash
kubectl logs -n shopease-notification deployment/notification-service --tail=50 -f
```

Expected:
```
INFO NotificationController - Received order confirmation request for order: ORDER-123
INFO EmailService - Sending order confirmation email to customer@example.com
```

---

## Verification Checklist

After deployment, verify:

- [ ] NetworkPolicy updated in Kubernetes
  ```bash
  kubectl describe networkpolicy -n shopease-notification | grep -A 5 "Allowed ingress"
  ```

- [ ] Order-service can reach notification-service
  ```bash
  kubectl run curl-test -n shopease-order --image=curlimages/curl:latest --rm -it -- \
    curl -v http://notification-service.shopease-notification.svc.cluster.local:8003/health
  ```

- [ ] Create test order and verify email is sent
  ```bash
  # Check Gmail inbox for order confirmation
  # Check logs for success message
  ```

- [ ] Update order status to SHIPPED and verify shipping notification
  ```bash
  # Update order status via API
  # Check Gmail inbox for shipping notification
  # Check logs for success message
  ```

---

## Security Considerations

### Current Configuration
- ✅ **Principle of Least Privilege**: Only frontend and order namespaces can access notification-service
- ✅ **Default Deny**: All other traffic is blocked
- ✅ **Namespace Isolation**: Services remain isolated except for explicit allow rules

### Recommended Additional Security (Optional)

**1. Add Egress Policy for Order Service**

Restrict order-service to only call notification-service (and database):

```bash
# Apply egress policy
kubectl apply -f services/order-service/helm/templates/networkpolicy-egress.yaml
```

See `NETWORKPOLICY_ISSUE.md` for the complete egress policy template.

**2. Add Pod Label Selectors**

For even more granular control, restrict by pod labels instead of entire namespace:

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

**3. Monitor NetworkPolicy Denials**

Set up alerts for blocked traffic:

```bash
# View denied connections
kubectl logs -n kube-system -l component=kube-proxy | grep "NetworkPolicy"
```

---

## Future Considerations

### If You Add More Service-to-Service Communication

**User Service → Notification Service** (for welcome emails, password resets):
```yaml
  notification:
    networkPolicy:
      allowedNamespaces:
        - shopease-frontend
        - shopease-order
        - shopease-user        # Add this
```

**Order Service → User Service** (to fetch customer data):
```yaml
  user:
    networkPolicy:
      allowedNamespaces:
        - shopease-frontend
        - shopease-order       # Add this
```

---

## Troubleshooting

### If emails still don't send after deployment:

1. **Check NetworkPolicy is active:**
   ```bash
   kubectl get networkpolicy -n shopease-notification
   ```

2. **Verify namespace labels:**
   ```bash
   kubectl get namespace shopease-order --show-labels
   kubectl get namespace shopease-notification --show-labels
   ```

3. **Test connectivity manually:**
   ```bash
   kubectl run curl-test -n shopease-order --image=curlimages/curl:latest --rm -it -- \
     curl -v http://notification-service.shopease-notification.svc.cluster.local:8003/health
   ```

4. **Check service discovery:**
   ```bash
   kubectl get svc -n shopease-notification
   kubectl get endpoints -n shopease-notification
   ```

5. **Review logs:**
   ```bash
   # Order service logs
   kubectl logs -n shopease-order deployment/order-service | grep -i "notification"
   
   # Notification service logs
   kubectl logs -n shopease-notification deployment/notification-service | grep -i "error"
   ```

---

## Related Documentation

- **Integration Details**: See `INTEGRATION_COMPLETE.md`
- **NetworkPolicy Analysis**: See `NETWORKPOLICY_ISSUE.md`
- **Gmail Setup**: See `services/notification-service/GMAIL_SETUP.md`

---

**Status**: ✅ **READY FOR DEPLOYMENT**

**Priority**: 🔴 **HIGH** - Deploy immediately to enable email notifications

**Risk**: 🟢 **LOW** - Change is additive only, doesn't affect existing frontend communication
