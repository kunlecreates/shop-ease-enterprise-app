#!/bin/bash
set -e

echo "🚀 Deploying OpenTelemetry Instrumentation CRs..."

# Check if CRDs are installed
if ! kubectl get crd instrumentations.opentelemetry.io &>/dev/null; then
  echo "❌ Error: OpenTelemetry Operator CRDs not found"
  echo "Please deploy the OpenTelemetry Operator first:"
  echo "  ~/remote/observability/deploy.sh"
  exit 1
fi

# Check if namespaces exist
echo "Checking namespaces..."
for ns in shopease-product shopease-notification shopease-user shopease-order shopease-frontend; do
  if ! kubectl get namespace "$ns" &>/dev/null; then
    echo "❌ Error: Namespace $ns does not exist"
    exit 1
  fi
done

echo "✅ Prerequisites check passed"
echo ""

# Apply Node.js Instrumentation (product-service)
echo "📦 Applying Node.js Instrumentation CR (shopease-product)..."
kubectl apply -f nodejs-instrumentation.yaml

# Apply Python Instrumentation (notification-service)
echo "📦 Applying Python Instrumentation CR (shopease-notification)..."
kubectl apply -f python-instrumentation.yaml

# Apply Java Instrumentation (user-service)
echo "📦 Applying Java Instrumentation CR (shopease-user)..."
kubectl apply -f java-instrumentation.yaml

# Apply Java Instrumentation (order-service)
echo "📦 Applying Java Instrumentation CR (shopease-order)..."
kubectl apply -f java-instrumentation-order.yaml

# Apply Node.js Instrumentation (frontend)
echo "📦 Applying Node.js Instrumentation CR (shopease-frontend)..."
kubectl apply -f nodejs-instrumentation-frontend.yaml

echo ""
echo "✅ All Instrumentation CRs deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Redeploy services (or rollout restart):"
echo "   kubectl rollout restart deployment product-service -n shopease-product"
echo "   kubectl rollout restart deployment notification-service -n shopease-notification"
echo "   kubectl rollout restart deployment user-service -n shopease-user"
echo "   kubectl rollout restart deployment order-service -n shopease-order"
echo "   kubectl rollout restart deployment frontend -n shopease-frontend"
echo ""
echo "2. Verify init containers are injected:"
echo "   kubectl get pod -n shopease-product -o yaml | grep -A 5 initContainers"
echo "   kubectl get pod -n shopease-notification -o yaml | grep -A 5 initContainers"
echo "   kubectl get pod -n shopease-user -o yaml | grep -A 5 initContainers"
echo "   kubectl get pod -n shopease-order -o yaml | grep -A 5 initContainers"
echo "   kubectl get pod -n shopease-frontend -o yaml | grep -A 5 initContainers"
