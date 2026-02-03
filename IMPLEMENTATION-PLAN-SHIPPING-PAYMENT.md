# Implementation Plan: Shipping Address & Payment Method Persistence

## Overview
Add shipping address and payment method metadata to orders table and implement full-stack support.

---

## Phase 1: Database Migration ✅ (Schema Updated)

### Files Changed:
- ✅ `/home/gareth/remote/DB-K8S-Deploy/db-schemas/mssql/order-service/schema.sql`

### Next Step: Create Flyway Migration
**Location:** `db/order-service/V3__add_shipping_payment_to_orders.sql`

```sql
-- Add shipping address fields to orders table
ALTER TABLE order_svc.orders ADD shipping_recipient NVARCHAR(128) NULL;
ALTER TABLE order_svc.orders ADD shipping_street1 NVARCHAR(256) NULL;
ALTER TABLE order_svc.orders ADD shipping_street2 NVARCHAR(256) NULL;
ALTER TABLE order_svc.orders ADD shipping_city NVARCHAR(100) NULL;
ALTER TABLE order_svc.orders ADD shipping_state NVARCHAR(100) NULL;
ALTER TABLE order_svc.orders ADD shipping_postal_code NVARCHAR(20) NULL;
ALTER TABLE order_svc.orders ADD shipping_country NCHAR(2) NULL;
ALTER TABLE order_svc.orders ADD shipping_phone NVARCHAR(32) NULL;

-- Add payment method metadata fields
ALTER TABLE order_svc.orders ADD payment_method_type NVARCHAR(32) NULL;
ALTER TABLE order_svc.orders ADD payment_last4 NVARCHAR(4) NULL;
ALTER TABLE order_svc.orders ADD payment_brand NVARCHAR(32) NULL;
```

---

## Phase 2: Backend - Order Service

### 2.1 Update Order Entity
**File:** `services/order-service/src/main/java/org/kunlecreates/order/domain/Order.java`

Add fields:
```java
@Entity
@Table(name = "orders", schema = "order_svc")
public class Order {
    // ... existing fields ...
    
    // Shipping address
    @Column(name = "shipping_recipient")
    private String shippingRecipient;
    
    @Column(name = "shipping_street1")
    private String shippingStreet1;
    
    @Column(name = "shipping_street2")
    private String shippingStreet2;
    
    @Column(name = "shipping_city")
    private String shippingCity;
    
    @Column(name = "shipping_state")
    private String shippingState;
    
    @Column(name = "shipping_postal_code")
    private String shippingPostalCode;
    
    @Column(name = "shipping_country", length = 2)
    private String shippingCountry;
    
    @Column(name = "shipping_phone")
    private String shippingPhone;
    
    // Payment method metadata
    @Column(name = "payment_method_type")
    private String paymentMethodType;
    
    @Column(name = "payment_last4", length = 4)
    private String paymentLast4;
    
    @Column(name = "payment_brand")
    private String paymentBrand;
    
    // Add getters/setters or use @Data from Lombok
}
```

### 2.2 Create Nested DTOs
**File:** `services/order-service/src/main/java/org/kunlecreates/order/interfaces/dto/ShippingAddress.java`

```java
package org.kunlecreates.order.interfaces.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ShippingAddress(
    @NotBlank String recipient,
    @NotBlank String street1,
    String street2,
    @NotBlank String city,
    String state,
    @NotBlank String postalCode,
    @Pattern(regexp = "[A-Z]{2}") String country,
    String phone
) {}
```

**File:** `services/order-service/src/main/java/org/kunlecreates/order/interfaces/dto/PaymentMethod.java`

```java
package org.kunlecreates.order.interfaces.dto;

public record PaymentMethod(
    String type,       // "CREDIT_CARD", "DEBIT_CARD", "PAYPAL"
    String last4,      // Last 4 digits only
    String brand       // "VISA", "MASTERCARD", "AMEX"
) {}
```

### 2.3 Update CreateOrderRequest
**File:** `services/order-service/src/main/java/org/kunlecreates/order/interfaces/dto/CreateOrderRequest.java`

```java
public record CreateOrderRequest(
    String userRef,
    Long userId,
    @NotNull String status,
    @Min(0) double total,
    List<CreateOrderItem> items,
    ShippingAddress shippingAddress,    // NEW
    PaymentMethod paymentMethod          // NEW
) {}
```

### 2.4 Update OrderResponse
**File:** `services/order-service/src/main/java/org/kunlecreates/order/interfaces/dto/OrderResponse.java`

```java
public record OrderResponse(
    Long id,
    String userRef,
    String status,
    Long totalCents,
    String currency,
    ShippingAddress shippingAddress,    // NEW
    PaymentMethod paymentMethod,        // NEW
    Instant placedAt,
    Instant createdAt,
    Instant updatedAt
) {}
```

### 2.5 Update OrderService.createOrder()
**File:** `services/order-service/src/main/java/org/kunlecreates/order/application/OrderService.java`

```java
public Order createOrder(String userRef, Long userId, String status, double total, String jwtToken,
                         ShippingAddress shipping, PaymentMethod payment) {
    Order order = new Order();
    order.setUserRef(userRef);
    order.setStatus(status);
    order.setTotalCents(convertToCents(total));
    
    // Set shipping address
    if (shipping != null) {
        order.setShippingRecipient(shipping.recipient());
        order.setShippingStreet1(shipping.street1());
        order.setShippingStreet2(shipping.street2());
        order.setShippingCity(shipping.city());
        order.setShippingState(shipping.state());
        order.setShippingPostalCode(shipping.postalCode());
        order.setShippingCountry(shipping.country());
        order.setShippingPhone(shipping.phone());
    }
    
    // Set payment method metadata
    if (payment != null) {
        order.setPaymentMethodType(payment.type());
        order.setPaymentLast4(payment.last4());
        order.setPaymentBrand(payment.brand());
    }
    
    // ... rest of implementation
    return orderRepository.save(order);
}
```

### 2.6 Update OrderController.create()
**File:** `services/order-service/src/main/java/org/kunlecreates/order/interfaces/OrderController.java`

```java
@PostMapping
public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest req, 
                                    Authentication authentication,
                                    HttpServletRequest request,
                                    UriComponentsBuilder uriBuilder) {
    String authenticatedUserId = extractUserIdFromAuth(authentication);
    String jwtToken = extractJwtToken(request);
    
    // Pass shipping and payment to service
    Order created = orderService.createOrder(
        authenticatedUserId, 
        null, 
        req.status(), 
        req.total(), 
        jwtToken,
        req.shippingAddress(),    // NEW
        req.paymentMethod()        // NEW
    );
    
    URI location = uriBuilder.path("/api/order/{id}").buildAndExpand(created.getId()).toUri();
    
    OrderResponse response = new OrderResponse(
        created.getId(),
        created.getUserRef(),
        created.getStatus(),
        created.getTotalCents(),
        created.getCurrency(),
        new ShippingAddress(
            created.getShippingRecipient(),
            created.getShippingStreet1(),
            created.getShippingStreet2(),
            created.getShippingCity(),
            created.getShippingState(),
            created.getShippingPostalCode(),
            created.getShippingCountry(),
            created.getShippingPhone()
        ),
        new PaymentMethod(
            created.getPaymentMethodType(),
            created.getPaymentLast4(),
            created.getPaymentBrand()
        ),
        created.getPlacedAt(),
        created.getCreatedAt(),
        created.getUpdatedAt()
    );
    
    return ResponseEntity.created(location).body(response);
}
```

---

## Phase 3: Frontend - Checkout Flow

### 3.1 Update Checkout Types
**File:** `frontend/types/index.ts`

Add:
```typescript
export interface ShippingAddress {
  recipient: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface PaymentMethod {
  type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';
  last4?: string;
  brand?: string;
}
```

### 3.2 Update Checkout Page State
**File:** `frontend/app/checkout/page.tsx`

```typescript
const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
  recipient: '',
  street1: '',
  city: '',
  postalCode: '',
  country: 'US'
});

const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
  type: 'CREDIT_CARD'
});
```

### 3.3 Update handleSubmitOrder()
**File:** `frontend/app/checkout/page.tsx`

```typescript
const handleSubmitOrder = async () => {
  setIsProcessing(true);
  setError('');

  try {
    const orderData = {
      status: 'PENDING',
      total: getTotal(),
      items: items.map(item => ({
        productRef: String(item.productId),
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      shippingAddress,      // NEW
      paymentMethod: {      // NEW
        type: paymentMethod.type,
        last4: paymentMethod.last4,
        brand: paymentMethod.brand
      }
    };

    await ApiClient.post('/order', orderData);
    clearCart();
    router.push('/orders?success=true');
  } catch (err: any) {
    console.error('Order submission failed:', err);
    setError(err.message || 'Failed to process order. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};
```

### 3.4 Add Shipping Address Form
**File:** `frontend/app/checkout/page.tsx`

Add after step 1 (cart review):
```typescript
{step === 2 && (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">Shipping Address</h2>
    <Input
      label="Recipient Name"
      value={shippingAddress.recipient}
      onChange={(e) => setShippingAddress({...shippingAddress, recipient: e.target.value})}
      required
    />
    <Input
      label="Street Address"
      value={shippingAddress.street1}
      onChange={(e) => setShippingAddress({...shippingAddress, street1: e.target.value})}
      required
    />
    <Input
      label="Apartment, suite, etc. (optional)"
      value={shippingAddress.street2 || ''}
      onChange={(e) => setShippingAddress({...shippingAddress, street2: e.target.value})}
    />
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="City"
        value={shippingAddress.city}
        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
        required
      />
      <Input
        label="State/Province"
        value={shippingAddress.state || ''}
        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Postal Code"
        value={shippingAddress.postalCode}
        onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
        required
      />
      <Input
        label="Country"
        value={shippingAddress.country}
        onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
        required
      />
    </div>
    <Button onClick={() => setStep(3)}>Continue to Payment</Button>
  </div>
)}
```

---

## Phase 4: Testing Updates

### 4.1 Fix API Test Cleanup Patterns
**File:** `api-tests/framework/cleanup.ts`

Current patterns are WRONG. Actual test data uses these prefixes:
```typescript
// ACTUAL patterns from test files:
testuser, profile, deleteme, logintest, metest, roletest, regular,
ordertest, canceltest, admintest, disable, checkout, tracking,
fullflow, duplicate, reset

// ACTUAL SKU patterns:
int-${timestamp}, BULK-001-${timestamp}, BULK-002-${timestamp}
```

Update to:
```typescript
export const TEST_DATA_MARKERS = {
  EMAIL_PATTERN: /^(testuser|profile|deleteme|logintest|metest|roletest|regular|ordertest|canceltest|admintest|disable|checkout|tracking|fullflow|duplicate|reset)\d+@example\.com$/i,
  SKU_PATTERN: /^(int-|BULK-)/i,
  USERNAME_PATTERN: /^(testuser|profile|deleteme|logintest|metest|roletest|regular|ordertest|canceltest|admintest|disable|checkout|tracking|fullflow|duplicate|reset)\d+$/i
};
```

### 4.2 Update E2E Cleanup
**File:** `e2e/helpers/cleanup.ts`

Same fix - use actual patterns from test files.

### 4.3 Update Integration Tests
**File:** `services/order-service/src/test/java/org/kunlecreates/order/interfaces/OrderControllerIT.java`

Add test for order with shipping/payment:
```java
@Test
void createOrder_withShippingAndPayment_shouldPersist() {
    ShippingAddress shipping = new ShippingAddress(
        "John Doe", "123 Main St", null, "New York", "NY", "10001", "US", null
    );
    PaymentMethod payment = new PaymentMethod("CREDIT_CARD", "4242", "VISA");
    
    CreateOrderRequest request = new CreateOrderRequest(
        null, null, "PENDING", 49.99, List.of(), shipping, payment
    );
    
    // ... test assertions ...
}
```

---

## Phase 5: Deployment Checklist

- [ ] Run Flyway migration on dev/staging databases
- [ ] Deploy order-service with updated entity/DTOs
- [ ] Deploy frontend with updated checkout flow
- [ ] Run integration tests
- [ ] Run API tests (verify cleanup works)
- [ ] Run E2E tests
- [ ] Manually test checkout with real shipping address
- [ ] Verify order history shows shipping/payment details

---

## Files Requiring Changes (Complete List)

### Database
1. ✅ `DB-K8S-Deploy/db-schemas/mssql/order-service/schema.sql`
2. ⏳ `db/order-service/V3__add_shipping_payment_to_orders.sql` (NEW)

### Backend (Order Service)
3. ⏳ `services/order-service/src/main/java/org/kunlecreates/order/domain/Order.java`
4. ⏳ `services/order-service/src/main/java/org/kunlecreates/order/interfaces/dto/ShippingAddress.java` (NEW)
5. ⏳ `services/order-service/src/main/java/org/kunlecreates/order/interfaces/dto/PaymentMethod.java` (NEW)
6. ⏳ `services/order-service/src/main/java/org/kunlecreates/order/interfaces/dto/CreateOrderRequest.java`
7. ⏳ `services/order-service/src/main/java/org/kunlecreates/order/interfaces/dto/OrderResponse.java`
8. ⏳ `services/order-service/src/main/java/org/kunlecreates/order/application/OrderService.java`
9. ⏳ `services/order-service/src/main/java/org/kunlecreates/order/interfaces/OrderController.java`

### Frontend
10. ⏳ `frontend/types/index.ts`
11. ⏳ `frontend/app/checkout/page.tsx`

### Testing
12. ⏳ `api-tests/framework/cleanup.ts`
13. ⏳ `e2e/helpers/cleanup.ts`
14. ⏳ `services/order-service/src/test/java/org/kunlecreates/order/interfaces/OrderControllerIT.java`

**Total: 14 files (1 done, 13 pending)**

