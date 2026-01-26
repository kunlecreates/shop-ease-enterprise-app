# JWT Implementation TODO

## ✅ Completed Tasks

### User Service (Spring Boot - JWT Issuer + Verifier)
- [x] Add JWT dependencies (spring-boot-starter-oauth2-resource-server, spring-security-crypto)
- [x] Create JwtService for token generation
- [x] Create JwtConfig for encoder/decoder beans
- [x] Create AuthService for login/register logic
- [x] Create AuthController with /api/auth/login and /api/auth/register endpoints
- [x] Create DTOs: LoginRequest, AuthResponse
- [x] Update SecurityConfig to use JWT Bearer tokens
- [x] Update User entity to include roles relationship
- [x] Add jwt.secret configuration to application.yml
- [x] Add jwt configuration to Helm values.yaml
- [x] Update Helm deployment template to inject JWT_SECRET
- [x] Verify compilation (BUILD SUCCESS)

### Order Service (Spring Boot - JWT Verifier Only)
- [x] Add JWT dependencies (spring-boot-starter-oauth2-resource-server)
- [x] Create JwtConfig with decoder bean
- [x] Update SecurityConfig to use JWT Bearer tokens
- [x] Add jwt.secret configuration to application.yml
- [x] Add jwt configuration to Helm values.yaml
- [x] Update Helm deployment template to inject JWT_SECRET
- [x] Verify compilation (BUILD SUCCESS)

### Product Service (NestJS - JWT Verifier Only)
- [x] Add JWT dependencies (@nestjs/jwt, @nestjs/passport, passport, passport-jwt)
- [x] Create jwt.config.ts with Passport JWT strategy
- [x] Create jwt-auth.guard.ts with JwtAuthGuard
- [x] Update app.module.ts with PassportModule and JwtModule
- [x] Update product.controller.ts with @UseGuards(JwtAuthGuard) on protected routes
- [x] Add jwt configuration to Helm values.yaml
- [x] Update Helm deployment template to inject JWT_SECRET
- [x] Run npm install to add JWT dependencies (31 packages added)
- [x] Verify TypeScript compilation (no errors)

### Notification Service (Python FastAPI - JWT Verifier Only)
- [x] Add JWT dependencies (python-jose[cryptography], passlib[bcrypt])
- [x] Create jwt_auth.py with verify_jwt() and get_current_user()
- [x] Update main.py with Depends(get_current_user) on protected endpoints
- [x] Add jwt configuration to Helm values.yaml
- [x] Update Helm deployment template to inject JWT_SECRET

### Integration Tests & Frontend
- [x] Add JWT libraries to integration-tests (jsonwebtoken, @types/jsonwebtoken)
- [x] Add JWT library to frontend (jose)
- [x] Update integration-tests adminLogin() to generate JWT locally
- [x] Update integration-tests workflow to check TEST_JWT_SECRET
- [x] Verify integration-tests TypeScript compiles (no errors)

## 📋 Immediate Next Steps (Before Deployment)

### 1. Configure Secrets
- [ ] Generate JWT secret: `openssl rand -base64 32`
- [ ] Add `JWT_SECRET` to GitHub Secrets (Settings → Secrets → Actions)
- [ ] Add `TEST_JWT_SECRET` to GitHub Secrets (same or different value)

### 2. Create Kubernetes Secret
```bash
# Generate secret
export JWT_SECRET=$(openssl rand -base64 32)

# Create in cluster
kubectl create secret generic shopease-jwt \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --namespace=shopease
```

### 3. Update Helm Values for Staging/Production
Edit all service Helm values to reference the Kubernetes secret:
- [ ] `services/user-service/helm/values.yaml` → set `jwt.secretName: "shopease-jwt"`
- [ ] `services/order-service/helm/values.yaml` → set `jwt.secretName: "shopease-jwt"`
- [ ] `services/product-service/helm/values.yaml` → set `jwt.secretName: "shopease-jwt"`
- [ ] `services/notification-service/helm/values.yaml` → set `jwt.secretName: "shopease-jwt"`

### 4. Build and Push Docker Images
```bash
# User Service
cd services/user-service
docker build -t ghcr.io/kunlecreates/user-service:latest .
docker push ghcr.io/kunlecreates/user-service:latest

# Order Service
cd services/order-service
docker build -t ghcr.io/kunlecreates/order-service:latest .
docker push ghcr.io/kunlecreates/order-service:latest

# Product Service
cd services/product-service
docker build -t ghcr.io/kunlecreates/product-service:latest .
docker push ghcr.io/kunlecreates/product-service:latest

# Notification Service
cd services/notification-service
docker build -t ghcr.io/kunlecreates/notification-service:latest .
docker push ghcr.io/kunlecreates/notification-service:latest
```

### 5. Deploy to Kubernetes
```bash
# User Service
helm upgrade --install user-service services/user-service/helm \
  --set image.tag=latest \
  --set jwt.secretName=shopease-jwt \
  --set db.secretName=shopease-user-db \
  --namespace=shopease

# Order Service
helm upgrade --install order-service services/order-service/helm \
  --set image.tag=latest \
  --set jwt.secretName=shopease-jwt \
  --set db.secretName=shopease-order-db \
  --namespace=shopease

# Product Service
helm upgrade --install product-service services/product-service/helm \
  --set image.tag=latest \
  --set jwt.secretName=shopease-jwt \
  --set db.secretName=shopease-product-db \
  --namespace=shopease

# Notification Service
helm upgrade --install notification-service services/notification-service/helm \
  --set image.tag=latest \
  --set jwt.secretName=shopease-jwt \
  --namespace=shopease
```

### 6. Verify Deployment
- [ ] Check all pods are running: `kubectl get pods -n shopease`
- [ ] Check JWT_SECRET is injected in user-service: `kubectl exec -it user-service-<pod-id> -n shopease -- env | grep JWT_SECRET`
- [ ] Check JWT_SECRET is injected in order-service: `kubectl exec -it order-service-<pod-id> -n shopease -- env | grep JWT_SECRET`
- [ ] Check JWT_SECRET is injected in product-service: `kubectl exec -it product-service-<pod-id> -n shopease -- env | grep JWT_SECRET`
- [ ] Check JWT_SECRET is injected in notification-service: `kubectl exec -it notification-service-<pod-id> -n shopease -- env | grep JWT_SECRET`
- [ ] Test login endpoint: `curl -X POST http://user-service/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@shopease.com","password":"admin123"}'`
- [ ] Test product creation with JWT: `curl -X POST http://product-service/api/product -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"sku":"TEST","name":"Test Product"}'`
- [ ] Test notification with JWT: `curl -X POST http://notification-service/api/notification/test -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"message":"Test"}'`

### 7. Run Integration Tests
- [ ] Trigger integration-tests workflow from GitHub Actions
- [ ] Verify tests pass with locally generated JWTs

## 🚀 Short-Term Enhancements (After Initial Deployment)

### Frontend Implementation
- [ ] Create `frontend/app/api/auth/login/route.ts` to call user-service
- [ ] Create `frontend/app/api/auth/register/route.ts` to call user-service
- [ ] Create `frontend/lib/auth.ts` for JWT utilities
- [ ] Update API proxy to add Authorization header
- [ ] Build login UI component
- [ ] Build registration UI component

### Security Enhancements
- [ ] Add CORS configuration to backend services (allow frontend origin)
- [ ] Add rate limiting to /api/auth/* endpoints
- [ ] Implement account lockout after failed login attempts
- [ ] Add audit logging for authentication events

### CI/CD Improvements
- [ ] Update CD workflow to auto-create shopease-jwt secret before deployment
- [ ] Add health check smoke tests after deployment
- [ ] Add notification for failed deployments

## 🔮 Future Enhancements (Backlog)

### Authentication Features
- [ ] Implement refresh token mechanism
- [ ] Add token blacklist for logout
- [ ] Implement email verification for registration
- [ ] Implement password reset flow
- [ ] Add multi-factor authentication (MFA)
- [ ] Add social login (Google, GitHub)

### Authorization Features
- [ ] Implement role-based access control (RBAC) on endpoints
- [ ] Add permission-based authorization
- [ ] Create admin dashboard for user management

### Monitoring & Observability
- [ ] Add Prometheus metrics for auth events (logins, failures)
- [ ] Add distributed tracing for auth flow
- [ ] Set up alerts for suspicious auth activity

### Migration Path
- [ ] Evaluate Keycloak migration (if needed)
- [ ] Plan schema updates for Keycloak integration
- [ ] Test hybrid mode (custom JWT + Keycloak)

## 📝 Notes

- JWT_SECRET must be at least 256 bits (32 bytes) for production
- TEST_JWT_SECRET can be different from production JWT_SECRET for isolation
- Frontend implementation is optional for initial deployment (can use curl/Postman)
- Cloudflare Access (CF_ACCESS_*) is now optional for integration tests
- All builds verified: user-service ✅, order-service ✅, integration-tests ✅

## 📚 Reference Documents

- [JWT_IMPLEMENTATION_SUMMARY.md](./JWT_IMPLEMENTATION_SUMMARY.md) - Complete implementation details
- [.github/copilot-instructions.md](./.github/copilot-instructions.md) - Project architecture
- [services/user-service/README.md](./services/user-service/README.md) - User service docs

---

**Last Updated:** January 17, 2026  
**Status:** Backend implementation complete, ready for secrets configuration and deployment
