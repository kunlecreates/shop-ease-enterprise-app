# JWT Authentication - All Services Status

## Summary

**Total Backend Services:** 4  
**JWT Implementation Status:** ✅ Complete (4/4)

All four backend services now have JWT authentication implemented:

| Service | Tech Stack | Role | Status | Build Verified |
|---------|-----------|------|--------|----------------|
| **user-service** | Spring Boot (Java 21) | JWT Issuer + Verifier | ✅ Complete | ✅ BUILD SUCCESS |
| **order-service** | Spring Boot (Java 21) | JWT Verifier Only | ✅ Complete | ✅ BUILD SUCCESS |
| **product-service** | NestJS (TypeScript) | JWT Verifier Only | ✅ Complete | ✅ TypeScript Compiles |
| **notification-service** | FastAPI (Python) | JWT Verifier Only | ✅ Complete | ✅ Imports Successful |

---

## Service Details

### 1. User Service (JWT Issuer + Verifier)
**Port:** 8081  
**Database:** Oracle DB  
**Stack:** Spring Boot 3.3.5, Java 21

**JWT Capabilities:**
- ✅ Generate JWT tokens on login/register
- ✅ Verify JWT tokens for protected endpoints
- ✅ Password hashing with BCrypt
- ✅ Token expiry (60 minutes default)
- ✅ Role-based claims

**Endpoints:**
- `POST /api/auth/register` - Register user, returns JWT
- `POST /api/auth/login` - Login user, returns JWT
- `GET /actuator/health/**` - Public health check

**Dependencies:**
- `spring-boot-starter-oauth2-resource-server`
- `spring-security-crypto`
- `nimbus-jose-jwt` (transitive)

**Key Files:**
- `JwtService.java` - Token generation
- `JwtConfig.java` - Encoder/decoder beans
- `AuthService.java` - Login/register logic
- `AuthController.java` - REST endpoints
- `SecurityConfig.java` - JWT Bearer token config

**Helm Configuration:**
```yaml
jwt:
  secretName: "shopease-jwt"
  dev:
    JWT_SECRET: "dev-secret-override-in-production"
```

---

### 2. Order Service (JWT Verifier Only)
**Port:** 8083  
**Database:** MS SQL Server  
**Stack:** Spring Boot 3.3.5, Java 21

**JWT Capabilities:**
- ✅ Verify JWT tokens for protected endpoints
- ✅ Extract user claims from token
- ✅ Role-based authorization

**Endpoints:**
- All endpoints require JWT (except `/actuator/health/**`)

**Dependencies:**
- `spring-boot-starter-oauth2-resource-server`

**Key Files:**
- `JwtConfig.java` - JWT decoder bean
- `SecurityConfig.java` - JWT Bearer token config

**Helm Configuration:**
```yaml
jwt:
  secretName: "shopease-jwt"
  dev:
    JWT_SECRET: "dev-secret-override-in-production"
```

---

### 3. Product Service (JWT Verifier Only)
**Port:** 8082  
**Database:** PostgreSQL  
**Stack:** NestJS 10.0, TypeScript, TypeORM

**JWT Capabilities:**
- ✅ Verify JWT tokens using Passport strategy
- ✅ Extract user claims from token
- ✅ Route-level guards with @UseGuards decorator
- ✅ Role-based authorization via JWT claims

**Protected Endpoints:**
- `POST /api/product` - Create product (requires JWT)
- `PATCH /api/product/:sku/stock` - Adjust stock (requires JWT)

**Public Endpoints:**
- `GET /api/product` - List products
- `GET /api/health` - Health check

**Dependencies:**
- `@nestjs/jwt` 10.2.0
- `@nestjs/passport` 10.0.3
- `passport` 0.7.0
- `passport-jwt` 4.0.1
- `@types/passport-jwt` 4.0.1

**Key Files:**
- `src/config/jwt.config.ts` - JWT Passport strategy
- `src/config/jwt-auth.guard.ts` - JWT authentication guard
- `src/app.module.ts` - PassportModule + JwtModule registration
- `src/presentation/product.controller.ts` - @UseGuards(JwtAuthGuard)

**JWT Strategy:**
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, roles: payload.roles };
  }
}
```

**Helm Configuration:**
```yaml
jwt:
  secretName: "shopease-jwt"
  dev:
    JWT_SECRET: "dev-secret-override-in-production"
```

**Build Status:**
- ✅ npm install successful (31 packages added)
- ✅ TypeScript compilation successful (no errors)

---

### 4. Notification Service (JWT Verifier Only)
**Port:** 8084  
**Database:** None (external notification APIs)  
**Stack:** FastAPI 0.115.5, Python 3.12+

**JWT Capabilities:**
- ✅ Verify JWT tokens using python-jose
- ✅ Extract user claims from token
- ✅ Dependency injection with Depends(get_current_user)
- ✅ Role-based authorization via JWT claims

**Protected Endpoints:**
- `POST /api/notification/test` - Test notification (requires JWT)

**Public Endpoints:**
- `GET /api/notification/health` - Health check
- `GET /health` - Root health check

**Dependencies:**
- `python-jose[cryptography]` 3.3.0
- `passlib[bcrypt]` 1.7.4

**Key Files:**
- `app/config/jwt_auth.py` - JWT verification functions
- `app/main.py` - FastAPI endpoints with Depends(get_current_user)

**JWT Verification:**
```python
def verify_jwt(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    payload = verify_jwt(token)
    return {
        "userId": payload.get("sub"),
        "email": payload.get("email"),
        "roles": payload.get("roles", [])
    }
```

**Helm Configuration:**
```yaml
jwt:
  secretName: "shopease-jwt"
  dev:
    JWT_SECRET: "dev-secret-override-in-production"
```

**Build Status:**
- ✅ pip install successful (all dependencies installed)
- ✅ Python imports successful (jose, jwt_auth verified)

---

## Shared Configuration

### JWT Token Structure
All services use the same JWT token format:

```json
{
  "sub": "user-id-here",
  "email": "user@example.com",
  "roles": ["USER", "ADMIN"],
  "iss": "shopease",
  "iat": 1706543210,
  "exp": 1706546810
}
```

### JWT Algorithm
- **Algorithm:** HS256 (HMAC-SHA256)
- **Issuer:** "shopease"
- **Expiry:** 60 minutes (configurable)

### Kubernetes Secret
All services read `JWT_SECRET` from the same Kubernetes secret:

```bash
kubectl create secret generic shopease-jwt \
  --from-literal=JWT_SECRET="$(openssl rand -base64 32)" \
  --namespace=shopease
```

### Helm Injection Pattern
All service deployment templates use the same pattern:

```yaml
env:
  - name: JWT_SECRET
    valueFrom:
      secretKeyRef:
        name: {{ .Values.jwt.secretName | default "shopease-jwt" }}
        key: JWT_SECRET
        optional: false
  # ... other env vars
```

---

## Testing Status

### Unit/Integration Tests
- ✅ User-service compiles: `BUILD SUCCESS`
- ✅ Order-service compiles: `BUILD SUCCESS`
- ✅ Product-service compiles: TypeScript no errors
- ✅ Notification-service: Python imports successful
- ✅ Integration-tests: TypeScript no errors, JWT generation working

### End-to-End Testing
- ⏳ Pending: Deploy all services to Kubernetes
- ⏳ Pending: Test JWT flow across all services
- ⏳ Pending: Verify Playwright E2E tests with JWT

---

## Deployment Checklist

### Prerequisites
- [ ] Generate JWT secret: `openssl rand -base64 32`
- [ ] Create Kubernetes secret `shopease-jwt` with `JWT_SECRET`
- [ ] Add `JWT_SECRET` to GitHub Secrets
- [ ] Add `TEST_JWT_SECRET` to GitHub Secrets

### Build & Push Images
- [ ] User-service: `docker build && docker push`
- [ ] Order-service: `docker build && docker push`
- [ ] Product-service: `docker build && docker push`
- [ ] Notification-service: `docker build && docker push`

### Deploy Services
- [ ] Deploy user-service with `--set jwt.secretName=shopease-jwt`
- [ ] Deploy order-service with `--set jwt.secretName=shopease-jwt`
- [ ] Deploy product-service with `--set jwt.secretName=shopease-jwt`
- [ ] Deploy notification-service with `--set jwt.secretName=shopease-jwt`

### Verification
- [ ] Verify all pods running: `kubectl get pods -n shopease`
- [ ] Check JWT_SECRET injected in all services
- [ ] Test login: `POST /api/auth/login`
- [ ] Test product creation with JWT: `POST /api/product`
- [ ] Test notification with JWT: `POST /api/notification/test`
- [ ] Run integration tests

---

## Security Considerations

### ✅ Implemented
- JWT signed with HS256 (HMAC-SHA256)
- Secret stored in Kubernetes Secret (not hardcoded)
- Token expiry (60 minutes)
- Stateless session management
- Bearer token authentication
- Health endpoints remain public (for K8s probes)
- Role-based claims in JWT

### 🔜 Recommended Enhancements
- Add CORS configuration for frontend
- Add rate limiting to auth endpoints
- Implement refresh tokens
- Add token revocation/blacklist
- Consider RS256 (asymmetric) for multi-service deployments
- Add audit logging for auth events

---

## Framework-Specific Patterns

### Spring Boot Services (User, Order)
```java
@Configuration
public class JwtConfig {
    @Bean
    public JwtDecoder jwtDecoder(@Value("${jwt.secret}") String secret) {
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(secretKey).build();
    }
}
```

### NestJS Service (Product)
```typescript
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' },
    }),
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
```

### Python FastAPI Service (Notification)
```python
oauth2_scheme = HTTPBearer()

async def get_current_user(token: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    payload = jwt.decode(token.credentials, JWT_SECRET, algorithms=["HS256"])
    return {"userId": payload.get("sub"), "email": payload.get("email")}
```

---

## Next Steps

1. **Deploy Services:**
   - Build Docker images for all 4 services
   - Push to GHCR (GitHub Container Registry)
   - Deploy to Kubernetes with Helm

2. **Test End-to-End:**
   - Login via user-service → get JWT
   - Use JWT to create product in product-service
   - Use JWT to send notification via notification-service
   - Use JWT to create order in order-service

3. **Frontend Integration:**
   - Create login/register UI
   - Store JWT in localStorage/cookie
   - Add Authorization header to API calls
   - Handle token expiry

4. **CI/CD:**
   - Update GitHub Actions workflows
   - Run integration tests with TEST_JWT_SECRET
   - Deploy to staging/production

---

**Last Updated:** 2025-01-29  
**Status:** ✅ JWT Implementation Complete for All 4 Backend Services
