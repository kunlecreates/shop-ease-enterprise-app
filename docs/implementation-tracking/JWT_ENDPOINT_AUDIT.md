# JWT Endpoint Security Audit
**Date:** January 17, 2026
**Status:** 🔴 Security Issues Found - Action Required

## Executive Summary

Based on the ShopEase PRD requirements and security best practices, this audit identified **critical security gaps** where endpoints handling sensitive user data are currently **unprotected** or **incorrectly configured**.

---

## 🔴 Critical Issues Found

### 1. User Service - Exposed User Management Endpoints

**Issue:** Profile management endpoints lack JWT authentication

| Endpoint | Method | Current Status | Required Per PRD | Risk Level |
|----------|--------|----------------|------------------|------------|
| `/api/user` | GET | ❌ Public (Protected by Spring Security but no explicit guard) | FR002: Profile Management | 🔴 HIGH |
| `/api/user/{id}` | GET | ❌ Public (Protected by Spring Security but no explicit guard) | FR002: Profile Management | 🔴 HIGH |
| `/api/user` | POST | ❌ Public (Protected by Spring Security but no explicit guard) | FR002: Should use /api/auth/register | 🔴 CRITICAL |

**PRD Requirement:**
- **FR002:** "As a customer, I want to update my profile" → Requires authentication
- **FR003:** "As an admin, I want elevated privileges" → Requires role-based access

**Impact:**
- Anyone with JWT can list ALL users (GDPR violation)
- Anyone with JWT can view any user profile by ID (privacy violation)
- Direct user creation bypasses auth registration flow

**Recommendation:**
- GET `/api/user` → Restrict to ADMIN role only
- GET `/api/user/{id}` → Require JWT and verify user owns the profile OR is ADMIN
- POST `/api/user` → Remove or restrict to ADMIN only (use /api/auth/register instead)
- Add PUT/PATCH `/api/user/{id}` → Allow authenticated users to update own profile

---

### 2. Order Service - Missing User Ownership Validation

**Issue:** Order endpoints don't validate user ownership

| Endpoint | Method | Current Status | Required Per PRD | Risk Level |
|----------|--------|----------------|------------------|------------|
| `/api/order` | GET | ✅ JWT Required (via Spring Security) | FR010: Order Tracking | 🟡 MEDIUM |
| `/api/order/{id}` | GET | ✅ JWT Required (via Spring Security) | FR010: Order Tracking | 🔴 HIGH |
| `/api/order` | POST | ✅ JWT Required (via Spring Security) | FR008: Checkout Process | 🟡 MEDIUM |

**PRD Requirement:**
- **FR010:** "As a customer, I want to track order status" → User should only see THEIR orders
- **FR011:** "As a customer, I want to view past purchases" → User should only see THEIR transactions

**Impact:**
- User with valid JWT can view ANY order by guessing order ID
- User can list ALL orders in the system (not just their own)
- No user ownership validation on order creation

**Recommendation:**
- GET `/api/order` → Filter by authenticated user's ID (unless ADMIN)
- GET `/api/order/{id}` → Verify user owns the order OR is ADMIN
- POST `/api/order` → Extract userId from JWT claims instead of request body
- Add GET `/api/order/my-orders` → Return only authenticated user's orders

---

### 3. Product Service - Correct JWT Implementation ✅

**Status:** ✅ Properly secured per PRD

| Endpoint | Method | Current Status | Required Per PRD | Status |
|----------|--------|----------------|------------------|--------|
| `/api/product` | GET | ✅ Public | FR004: Product Catalog Browsing | ✅ CORRECT |
| `/api/product` | POST | ✅ JWT Required (@UseGuards) | FR005: Product CRUD (Admin) | ✅ CORRECT |
| `/api/product/:sku/stock` | PATCH | ✅ JWT Required (@UseGuards) | FR006: Stock Management | ✅ CORRECT |

**Note:** Consider adding role check to ensure only ADMIN can create products and adjust stock.

---

### 4. Notification Service - Correct JWT Implementation ✅

**Status:** ✅ Properly secured

| Endpoint | Method | Current Status | Required Per PRD | Status |
|----------|--------|----------------|------------------|--------|
| `/api/notification/health` | GET | ✅ Public | Health check | ✅ CORRECT |
| `/api/notification/test` | POST | ✅ JWT Required (Depends) | Protected endpoint | ✅ CORRECT |
| `/health` | GET | ✅ Public | Health check | ✅ CORRECT |

---

## Missing Endpoints (Per PRD)

### User Service - Missing Profile Update Endpoint
**PRD FR002:** "As a customer, I want to update my profile"

**Missing:**
- PUT/PATCH `/api/user/profile` → Update authenticated user's own profile
- GET `/api/user/profile` → Get authenticated user's own profile

### Order Service - Missing User-Specific Endpoints
**PRD FR010 & FR011:** Order tracking and transaction history

**Missing:**
- GET `/api/order/my-orders` → List authenticated user's orders only
- GET `/api/order/my-orders/{id}` → Get specific order (with ownership check)

### Product Service - Missing Admin Role Check
**PRD FR003 & FR005:** Role-based access for admin operations

**Missing:**
- Role validation on POST `/api/product` → Only ADMIN should create
- Role validation on PATCH `/api/product/:sku/stock` → Only ADMIN should adjust stock

---

## Security Configuration Analysis

### User Service SecurityConfig
```java
.requestMatchers("/actuator/health/**", "/actuator/health", "/actuator/info").permitAll()
.requestMatchers("/api/auth/login", "/api/auth/register").permitAll()
.anyRequest().authenticated()  // ← All other endpoints require JWT
```

**Status:** ✅ Correct - All user endpoints require JWT
**Issue:** ❌ No role-based restrictions (any authenticated user can access all endpoints)

### Order Service SecurityConfig
```java
.requestMatchers("/actuator/health/**", "/actuator/health", "/actuator/info").permitAll()
.anyRequest().authenticated()  // ← All endpoints require JWT
```

**Status:** ✅ Correct - All order endpoints require JWT
**Issue:** ❌ No user ownership validation in business logic

### Product Service (NestJS)
```typescript
@Get() // Public endpoint - CORRECT
async list() { ... }

@Post()
@UseGuards(JwtAuthGuard)  // JWT required - CORRECT
async create() { ... }

@Patch(':sku/stock')
@UseGuards(JwtAuthGuard)  // JWT required - CORRECT
async adjustStock() { ... }
```

**Status:** ✅ Correct JWT protection
**Issue:** ⚠️ Missing role validation (any authenticated user can create/modify products)

### Notification Service (Python FastAPI)
```python
@router.get("/health")  # Public - CORRECT
def health(): ...

@router.post("/test")
def test_notification(current_user: dict = Depends(get_current_user)):  # JWT required - CORRECT
```

**Status:** ✅ Fully correct

---

## Required Changes

### Priority 1: CRITICAL Security Fixes

#### 1.1 User Service - Add User Ownership Validation
```java
// UserController.java

@GetMapping
@PreAuthorize("hasRole('ADMIN')")  // Only admins can list all users
public List<User> list() {
    return userService.listUsers();
}

@GetMapping("/{id}")
public ResponseEntity<User> get(@PathVariable Long id, Authentication auth) {
    Long currentUserId = extractUserIdFromAuth(auth);
    if (!currentUserId.equals(id) && !hasRole(auth, "ADMIN")) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
}

@GetMapping("/profile")  // NEW: Get own profile
public ResponseEntity<User> getProfile(Authentication auth) {
    Long userId = extractUserIdFromAuth(auth);
    return userService.findById(userId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
}

@PatchMapping("/profile")  // NEW: Update own profile
public ResponseEntity<User> updateProfile(@RequestBody UpdateProfileRequest req, Authentication auth) {
    Long userId = extractUserIdFromAuth(auth);
    User updated = userService.updateProfile(userId, req);
    return ResponseEntity.ok(updated);
}

@DeleteMapping // REMOVE or restrict to ADMIN only
```

#### 1.2 Order Service - Add User Ownership Validation
```java
// OrderController.java

@GetMapping
public List<Order> list(Authentication auth) {
    Long userId = extractUserIdFromAuth(auth);
    if (hasRole(auth, "ADMIN")) {
        return orderService.listOrders();  // Admins see all
    }
    return orderService.listOrdersByUserId(userId);  // Users see only their orders
}

@GetMapping("/{id}")
public ResponseEntity<Order> get(@PathVariable Long id, Authentication auth) {
    Long userId = extractUserIdFromAuth(auth);
    return orderService.findById(id)
            .filter(order -> order.getUserId().equals(userId) || hasRole(auth, "ADMIN"))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
}

@PostMapping
public ResponseEntity<Void> create(@Valid @RequestBody CreateOrderRequest req, 
                                     Authentication auth,
                                     UriComponentsBuilder uriBuilder) {
    Long userId = extractUserIdFromAuth(auth);  // Extract from JWT, not request body
    Order created = orderService.createOrder(req.userRef(), userId, req.status(), req.total());
    URI location = uriBuilder.path("/api/order/{id}").buildAndExpand(created.getId()).toUri();
    return ResponseEntity.created(location).build();
}
```

#### 1.3 Product Service - Add Role Validation
```typescript
// product.controller.ts

@Post()
@UseGuards(JwtAuthGuard)
async create(@Body() body: CreateProductDto, @Request() req) {
  // Add role check
  if (!req.user.roles.includes('ADMIN')) {
    throw new ForbiddenException('Only admins can create products');
  }
  return this.service.createProduct(body);
}

@Patch(':sku/stock')
@UseGuards(JwtAuthGuard)
async adjustStock(@Param('sku') sku: string, @Body() body: { quantity: number; reason: string }, @Request() req) {
  // Add role check
  if (!req.user.roles.includes('ADMIN')) {
    throw new ForbiddenException('Only admins can adjust stock');
  }
  return this.service.adjustStock(sku, body.quantity, body.reason);
}
```

---

## Testing Requirements

### Unit Tests Required
- [ ] User profile endpoints with ownership validation
- [ ] Order endpoints with user filtering
- [ ] Product endpoints with role validation
- [ ] Unauthorized access attempts (403 responses)

### Integration Tests Required
- [ ] User cannot view other user's profiles
- [ ] User cannot view other user's orders
- [ ] Non-admin cannot create products
- [ ] Non-admin cannot adjust stock
- [ ] Admin can access all endpoints

---

## Compliance Impact

### GDPR Violations (Current State)
- ❌ **Data Minimization:** Users can access more data than necessary
- ❌ **Access Control:** No ownership validation on personal data
- ❌ **Privacy by Design:** Endpoints expose all user data without filtering

### After Fixes
- ✅ Users can only access their own data
- ✅ Admins have explicit elevated privileges
- ✅ Clear audit trail of who accessed what data

---

## Next Steps

1. **Immediate:** Implement user ownership validation in User Service and Order Service
2. **High Priority:** Add role-based authorization to Product Service admin endpoints
3. **Medium Priority:** Add new profile management endpoints per PRD FR002
4. **Testing:** Write comprehensive security tests for all endpoints
5. **Documentation:** Update API documentation with required roles/permissions

---

**Status Legend:**
- 🔴 CRITICAL: Immediate security risk, must fix before production
- 🟡 HIGH: Significant security concern, fix in next release
- ⚠️ MEDIUM: Enhancement needed for complete PRD compliance
- ✅ CORRECT: Meets PRD requirements and security best practices

---

**Last Updated:** January 17, 2026
**Auditor:** GitHub Copilot (Beast Mode)
**Next Review:** After implementing critical fixes
