#!/usr/bin/env bash
set -euo pipefail

# Setup External Secrets Operator (ESO) with HashiCorp Vault provider
# and create ExternalSecret resources for ShopEase services.
#
# Requirements:
# - kubectl logged into your cluster
# - helm installed
# - This script can install Vault (dev or standalone) if not present
# - It will enable Vault Kubernetes auth, create policy & role for ESO,
#   and mount KV v2 with example paths.
#
# NOTE: This script is idempotent for Helm install and kubectl apply operations.

#############################################
# Configurable parameters (override via env)
#############################################

: "${ESO_NAMESPACE:=external-secrets}"
: "${VAULT_NAMESPACE:=default}"
: "${VAULT_ADDR:=http://vault.${VAULT_NAMESPACE}.svc:8200}"
: "${VAULT_KV_PATH:=internal}"          # KV v2 mount path
: "${VAULT_KV_VERSION:=v2}"             # KV version (v2 recommended)
: "${VAULT_K8S_MOUNT:=kubernetes}"       # Vault auth mount path
: "${VAULT_ROLE:=external-secrets}"      # Vault role bound to ESO SA

# Vault install mode: dev (auto-init/unseal, NOT for prod) or standalone
: "${VAULT_INSTALL_MODE:=dev}"           # dev|standalone

# Whether to seed example KV entries (no real secrets)
: "${SEED_EXAMPLE_SECRETS:=true}"

# Target namespaces for each service (adjust as needed)
: "${NS_PRODUCT:=product}"
: "${NS_USER:=user}"
: "${NS_ORDER:=order}"
: "${NS_NOTIFICATION:=notification}"

# Secret names as expected by Helm charts/services
: "${SECRET_PRODUCT_DB:=product-service-db}"
: "${SECRET_USER_DB:=user-service-db}"
: "${SECRET_ORDER_DB:=order-service-db}"
: "${SECRET_NOTIFICATION_CREDENTIALS:=shopease-notification-credentials}"

#############################################
# Helpers
#############################################

echo_info() { echo "[INFO] $*"; }
echo_warn() { echo "[WARN] $*"; }
echo_err()  { echo "[ERR]  $*" >&2; }

kubectl_ensure_ns() {
  local ns="$1"
  if ! kubectl get ns "$ns" >/dev/null 2>&1; then
    echo_info "Creating namespace: $ns"
    kubectl create namespace "$ns"
  else
    echo_info "Namespace exists: $ns"
  fi
}

#############################################
# 1) Install Vault (if missing) and configure Kubernetes auth
#############################################

echo_info "Ensuring namespace '$VAULT_NAMESPACE' exists"
kubectl_ensure_ns "$VAULT_NAMESPACE"

if ! kubectl -n "$VAULT_NAMESPACE" get svc vault >/dev/null 2>&1; then
  echo_info "Vault not found; installing via Helm (mode: $VAULT_INSTALL_MODE)"
  helm repo add hashicorp https://helm.releases.hashicorp.com >/dev/null 2>&1 || true
  helm repo update >/dev/null 2>&1
  if [[ "$VAULT_INSTALL_MODE" == "dev" ]]; then
    # Dev mode: single pod, auto-initialized/unsealed (NOT for production)
    helm upgrade --install vault hashicorp/vault \
      -n "$VAULT_NAMESPACE" \
      --create-namespace \
      --set "server.dev.enabled=true" \
      --set "injector.enabled=true"
  else
    # Standalone with Raft storage (init/unseal is manual outside this script)
    helm upgrade --install vault hashicorp/vault \
      -n "$VAULT_NAMESPACE" \
      --create-namespace \
      --set "server.ha.enabled=false" \
      --set "server.dataStorage.enabled=true" \
      --set "injector.enabled=true"
    echo_warn "Vault standalone installed. You must init & unseal Vault before proceeding."
  fi
else
  echo_info "Vault service exists in namespace '$VAULT_NAMESPACE'"
fi

echo_info "Waiting for Vault pods to be ready"
kubectl -n "$VAULT_NAMESPACE" rollout status statefulset/vault || true
kubectl -n "$VAULT_NAMESPACE" get pods -l app.kubernetes.io/name=vault

# Configure Kubernetes auth only if Vault is reachable (dev mode assumed ready)
echo_info "Configuring Vault Kubernetes auth (requires dev mode ready or unsealed Vault)"
if kubectl -n "$VAULT_NAMESPACE" exec -it vault-0 -- sh -c "vault status >/dev/null 2>&1"; then
  kubectl -n "$VAULT_NAMESPACE" exec -it vault-0 -- sh -c "vault auth enable kubernetes || true"
  kubectl -n "$VAULT_NAMESPACE" exec -it vault-0 -- sh -c "vault write auth/kubernetes/config kubernetes_host=\"https://\$KUBERNETES_SERVICE_HOST:\$KUBERNETES_SERVICE_PORT\" disable_iss_validation=true"

  # ESO read policy limited to KV v2 under mount
  kubectl -n "$VAULT_NAMESPACE" exec -it vault-0 -- sh -c "cat > /tmp/eso-read.hcl <<'EOF'
path \"${VAULT_KV_PATH}/data/*\" { capabilities = [\"read\"] }
EOF"
  kubectl -n "$VAULT_NAMESPACE" exec -it vault-0 -- sh -c "vault policy write eso-read /tmp/eso-read.hcl"

  # Role bound to ESO service account in ESO namespace
  kubectl -n "$VAULT_NAMESPACE" exec -it vault-0 -- sh -c "vault write auth/kubernetes/role/${VAULT_ROLE} bound_service_account_names=external-secrets bound_service_account_namespaces=${ESO_NAMESPACE} policies=eso-read ttl=1h audience=vault"

  # Enable KV v2 at desired mount
  kubectl -n "$VAULT_NAMESPACE" exec -it vault-0 -- sh -c "vault secrets enable -path=${VAULT_KV_PATH} kv-v2 || true"

  if [[ "$SEED_EXAMPLE_SECRETS" == "true" ]]; then
    echo_info "Seeding example KV entries (placeholders; replace in production)"
    # Use canonical <SERVICE>_DB_* keys so ESO will sync them directly into Kubernetes Secrets
    kubectl -n "$VAULT_NAMESPACE" exec -it vault-0 -- sh -c "vault kv put ${VAULT_KV_PATH}/product-service-db PRODUCT_DB_HOST=postgres.${NS_PRODUCT}.svc PRODUCT_DB_PORT=5432 PRODUCT_DB_NAME=products PRODUCT_DB_USER=appuser PRODUCT_DB_PASSWORD=change-me"
    kubectl -n "$VAULT_NAMESPACE" exec -it vault-0 -- sh -c "vault kv put ${VAULT_KV_PATH}/user-service-db USER_DB_HOST=oracle.${NS_USER}.svc USER_DB_PORT=1521 USER_DB_NAME=oracledb USER_DB_USER=appuser USER_DB_PASSWORD=change-me"
    kubectl -n "$VAULT_NAMESPACE" exec -it vault-0 -- sh -c "vault kv put ${VAULT_KV_PATH}/order-service-db ORDER_DB_HOST=mssql.${NS_ORDER}.svc ORDER_DB_PORT=1433 ORDER_DB_NAME=orders ORDER_DB_USER=appuser ORDER_DB_PASSWORD=change-me"
    kubectl -n "$VAULT_NAMESPACE" exec -it vault-0 -- sh -c "vault kv put ${VAULT_KV_PATH}/notification-credentials NOTIFICATION_MAIL_HOST=smtp.example.com NOTIFICATION_MAIL_PORT=587 NOTIFICATION_MAIL_USER=mailer NOTIFICATION_MAIL_PASSWORD=change-me NOTIFICATION_MAIL_FROM=no-reply@example.com"
  fi
else
  echo_warn "Vault not reachable or not unsealed; skip Vault auth/policy/seed configuration."
fi

#############################################
# 2) Install ESO into dedicated namespace
#############################################

echo_info "Ensuring namespace '$ESO_NAMESPACE' exists"
kubectl_ensure_ns "$ESO_NAMESPACE"

echo_info "Installing External Secrets Operator via Helm"
helm repo add external-secrets https://charts.external-secrets.io >/dev/null 2>&1 || true
helm repo update >/dev/null 2>&1
helm upgrade --install external-secrets external-secrets/external-secrets \
  -n "$ESO_NAMESPACE" \
  --create-namespace

echo_info "Waiting for ESO controller to be ready"
kubectl -n "$ESO_NAMESPACE" rollout status deploy/external-secrets || true

#############################################
# 3) Create SecretStore pointing to Vault (Kubernetes auth)
#############################################

echo_info "Applying SecretStore 'vault-backend' in namespace '$ESO_NAMESPACE'"
cat <<EOF | kubectl apply -n "$ESO_NAMESPACE" -f -
apiVersion: external-secrets.io/v1
kind: SecretStore
metadata:
  name: vault-backend
spec:
  provider:
    vault:
      server: "$VAULT_ADDR"
      path: "$VAULT_KV_PATH"
      version: "$VAULT_KV_VERSION"
      auth:
        kubernetes:
          mountPath: "$VAULT_K8S_MOUNT"
          role: "$VAULT_ROLE"
          serviceAccountRef:
            name: external-secrets
EOF

#############################################
# 4) Create ExternalSecret resources per service
#############################################

echo_info "Ensuring target namespaces exist for services"
kubectl_ensure_ns "$NS_PRODUCT"
kubectl_ensure_ns "$NS_USER"
kubectl_ensure_ns "$NS_ORDER"
kubectl_ensure_ns "$NS_NOTIFICATION"

echo_info "Applying ExternalSecret for product-service DB"
cat <<EOF | kubectl apply -n "$NS_PRODUCT" -f -
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: ${SECRET_PRODUCT_DB}
spec:
  refreshInterval: "1m"
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
    namespace: ${ESO_NAMESPACE}
  target:
    name: ${SECRET_PRODUCT_DB}
    creationPolicy: Owner
  dataFrom:
    - extract:
        key: product-service-db
EOF

echo_info "Applying ExternalSecret for user-service DB (Oracle)"
cat <<EOF | kubectl apply -n "$NS_USER" -f -
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: ${SECRET_USER_DB}
spec:
  refreshInterval: "1m"
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
    namespace: ${ESO_NAMESPACE}
  target:
    name: ${SECRET_USER_DB}
    creationPolicy: Owner
  dataFrom:
    - extract:
        key: user-service-db
EOF

echo_info "Applying ExternalSecret for order-service DB (MSSQL)"
cat <<EOF | kubectl apply -n "$NS_ORDER" -f -
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: ${SECRET_ORDER_DB}
spec:
  refreshInterval: "1m"
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
    namespace: ${ESO_NAMESPACE}
  target:
    name: ${SECRET_ORDER_DB}
    creationPolicy: Owner
  dataFrom:
    - extract:
        key: order-service-db
EOF

echo_info "Applying ExternalSecret for notification-service credentials"
cat <<EOF | kubectl apply -n "$NS_NOTIFICATION" -f -
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: ${SECRET_NOTIFICATION_CREDENTIALS}
spec:
  refreshInterval: "1m"
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
    namespace: ${ESO_NAMESPACE}
  target:
    name: ${SECRET_NOTIFICATION_CREDENTIALS}
    creationPolicy: Owner
  dataFrom:
    - extract:
        key: notification-credentials
EOF

#############################################
# 5) Summary & next steps
#############################################

echo_info "ESO + Vault setup applied. Verify synced secrets:"
echo "- kubectl -n $NS_PRODUCT get secret $SECRET_PRODUCT_DB -o yaml"
echo "- kubectl -n $NS_USER get secret $SECRET_USER_DB -o yaml"
echo "- kubectl -n $NS_ORDER get secret $SECRET_ORDER_DB -o yaml"
echo "- kubectl -n $NS_NOTIFICATION get secret $SECRET_NOTIFICATION_CREDENTIALS -o yaml"

echo_info "Ensure your Helm values reference these secret names (envFrom)."
echo_info "Disable CI-created Kubernetes Secrets once ESO is active."
echo_info "Docs: External Secrets Vault provider https://external-secrets.io/latest/provider/hashicorp-vault/"
echo_info "Docs: Vault Kubernetes auth https://developer.hashicorp.com/vault/docs/auth/kubernetes"
echo_info "Docs: Vault on Kubernetes https://developer.hashicorp.com/vault/docs/platform/k8s"
