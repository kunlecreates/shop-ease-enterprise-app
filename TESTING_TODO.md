# Testing & Deployment Todo List

## ✅ Implementation Complete - Now Test!

All three features have been implemented and are ready for testing:

### Implementation Complete ✅
```markdown
- [x] Backend: Added imageUrl field to Product entity
- [x] Backend: Created Flyway migration V5
- [x] Frontend: Created ThemeProvider wrapper
- [x] Frontend: Created ThemeToggle component  
- [x] Frontend: Created ProductFormModal component
- [x] Frontend: Enhanced products page with images
- [x] Frontend: Enhanced orders dashboard
- [x] Frontend: Integrated dark mode throughout Navigation
- [x] Frontend: Updated TypeScript types (Order, Product)
- [x] Code: All TypeScript errors resolved
- [x] Docs: Updated PROJECT_COMPLETION_STATUS.md to 97%
- [x] Docs: Updated PRD_COMPLETION_ASSESSMENT.md
- [x] Docs: Created IMPLEMENTATION_COMPLETE_SUMMARY.md
```

---

## 🧪 Manual Testing Checklist

### Backend Testing
```markdown
- [ ] Deploy product-service to staging
- [ ] Verify Flyway migration V5 executes successfully
- [ ] Check database: `SELECT id, name, image_url FROM product_svc.products LIMIT 10;`
- [ ] Test API: POST /api/products with imageUrl field
- [ ] Test API: PUT /api/products/:id to update imageUrl
- [ ] Test API: GET /api/products/:id includes imageUrl in response
```

### Frontend - Product Images
```markdown
- [ ] Navigate to /admin/products
- [ ] Click "Add Product" button
- [ ] Verify ProductFormModal opens
- [ ] Fill in product details + image URL (e.g., https://via.placeholder.com/200)
- [ ] Verify image preview shows below URL input
- [ ] Submit form and verify product is created
- [ ] Verify product table shows 48x48 thumbnail
- [ ] Test edit: Click edit icon, modal opens with existing data
- [ ] Change image URL and verify preview updates
- [ ] Test delete: Click trash icon, product is removed
- [ ] Test with broken image URL - verify fallback placeholder
```

### Frontend - Dark Mode
```markdown
- [ ] Verify Sun/Moon icon appears in navigation bar (top right)
- [ ] Click toggle - verify theme switches instantly
- [ ] Verify toggle persists after page refresh
- [ ] Test all pages in dark mode:
  - [ ] Homepage (/)
  - [ ] Products page (/products)
  - [ ] Product detail page (/products/:id)
  - [ ] Cart page (/cart)
  - [ ] Checkout page (/checkout)
  - [ ] Login page (/login)
  - [ ] Register page (/register)
  - [ ] Admin products (/admin/products)
  - [ ] Admin orders (/admin/orders)
  - [ ] Admin dashboard (/admin)
- [ ] Verify no visual glitches or missing dark classes
- [ ] Test system theme detection (set OS to dark mode)
- [ ] Test on mobile devices (responsive dark mode)
```

### Frontend - Admin Products UI
```markdown
- [ ] Navigate to /admin/products
- [ ] Verify header shows "Product Management" with subtitle
- [ ] Verify table shows all products with:
  - [ ] Image thumbnail (48x48)
  - [ ] SKU (monospace font)
  - [ ] Name
  - [ ] Category
  - [ ] Price (formatted as currency)
  - [ ] Stock (color-coded badge: green >20, yellow 5-20, red <5)
  - [ ] Edit icon button
  - [ ] Delete icon button
- [ ] Verify striped rows (alternating gray/white)
- [ ] Hover over row - verify hover state works
- [ ] Test loading state (refresh with network throttling)
- [ ] Test empty state (delete all products)
- [ ] Test with 100+ products (scroll performance)
```

### Frontend - Admin Orders UI
```markdown
- [ ] Navigate to /admin/orders
- [ ] Verify 6 stats cards show:
  - [ ] All Orders
  - [ ] PENDING (yellow)
  - [ ] PAID (indigo)
  - [ ] SHIPPED (blue)
  - [ ] DELIVERED (green)
  - [ ] CANCELLED (red)
  - [ ] REFUNDED (purple) - NEW status
- [ ] Click each stat card - verify filter applies (ring highlight)
- [ ] Test search input:
  - [ ] Type order ID - verify filters instantly
  - [ ] Type customer name - verify filters instantly
  - [ ] Clear search - verify shows all orders
- [ ] Test filter dropdown:
  - [ ] Select PENDING - verify only pending orders show
  - [ ] Select DELIVERED - verify only delivered orders show
  - [ ] Select "All" - verify shows all orders
- [ ] Verify table shows:
  - [ ] Order ID (monospace font)
  - [ ] Customer name
  - [ ] Date (formatted with time)
  - [ ] Total (formatted as currency)
  - [ ] Status badge (color-coded)
  - [ ] Status update dropdown
- [ ] Test status update:
  - [ ] Select new status from dropdown
  - [ ] Verify order updates
  - [ ] Verify dropdown disabled for DELIVERED/CANCELLED/REFUNDED
- [ ] Test responsive design on mobile
```

---

## 🤖 Automated Testing

### E2E Tests (Playwright)
```markdown
- [ ] Run existing E2E tests: `npm run test:e2e`
- [ ] Verify all tests pass with new UI
- [ ] Add new test: admin-product-image-upload.spec.ts
- [ ] Add new test: dark-mode-toggle.spec.ts
- [ ] Add new test: admin-order-management.spec.ts
- [ ] Run tests in CI/CD pipeline
```

### Integration Tests
```markdown
- [ ] Run product-service tests: `cd services/product-service && npm test`
- [ ] Verify TypeORM properly maps imageUrl field
- [ ] Run order-service tests: `cd services/order-service && mvn test`
- [ ] Run user-service tests: `cd services/user-service && mvn test`
```

### Build Verification
```markdown
- [ ] Build frontend: `cd frontend && npm run build`
- [ ] Verify no TypeScript errors
- [ ] Verify no missing imports
- [ ] Check bundle size (ensure not bloated)
- [ ] Test production build locally: `npm run start`
```

---

## 🚀 Deployment Checklist

### Staging Deployment
```markdown
- [ ] Deploy product-service (includes V5 migration)
- [ ] Deploy frontend (includes new pages/components)
- [ ] Verify Flyway migration V5 executed
- [ ] Smoke test: Create product with image
- [ ] Smoke test: Toggle dark mode
- [ ] Smoke test: Use admin order dashboard
- [ ] Check logs for errors
- [ ] Monitor performance metrics
```

### Production Deployment
```markdown
- [ ] Staging QA complete and approved
- [ ] Create production release branch
- [ ] Deploy to production during maintenance window
- [ ] Run database backup before migration
- [ ] Deploy product-service first (migration runs)
- [ ] Verify migration success
- [ ] Deploy frontend
- [ ] Smoke tests in production
- [ ] Monitor error rates for 1 hour
- [ ] Announce new features to users
```

---

## 📊 Success Metrics

### Performance Targets
```markdown
- [ ] Dark mode toggle: <100ms
- [ ] Product table load (100 items): <1s
- [ ] Order dashboard load (100 items): <1s
- [ ] ProductFormModal open: <200ms
- [ ] Image thumbnail load: <500ms per image
```

### Quality Targets
```markdown
- [ ] Zero TypeScript errors ✅ (already met)
- [ ] Zero console errors in browser
- [ ] Zero 404s for assets
- [ ] All E2E tests passing
- [ ] Lighthouse score >90 (performance)
- [ ] Lighthouse score 100 (accessibility)
```

---

## 🐛 Known Issues / Edge Cases to Test

### Product Images
```markdown
- [ ] Test with very long image URLs (>400 chars)
- [ ] Test with broken/invalid URLs
- [ ] Test with non-image URLs (should fail gracefully)
- [ ] Test with HTTPS vs HTTP URLs
- [ ] Test image preview with slow network
```

### Dark Mode
```markdown
- [ ] Test hydration mismatch (shouldn't happen - we have mounted check)
- [ ] Test with JavaScript disabled (should default to system)
- [ ] Test persistence across sessions
- [ ] Test with system theme change while app is open
```

### Admin UI
```markdown
- [ ] Test with 1000+ products (pagination needed?)
- [ ] Test with 1000+ orders (pagination needed?)
- [ ] Test search performance with large datasets
- [ ] Test filter dropdown with all statuses selected
- [ ] Test concurrent edits (optimistic updates)
```

---

## 📝 Post-Deployment Tasks

### Documentation
```markdown
- [ ] Update admin user guide with new features
- [ ] Create video walkthrough of new admin UI
- [ ] Update API documentation (imageUrl field)
- [ ] Document dark mode for users
- [ ] Add to changelog/release notes
```

### Monitoring
```markdown
- [ ] Set up alerts for image load failures
- [ ] Monitor dark mode adoption rate (analytics)
- [ ] Track admin feature usage (heatmaps)
- [ ] Monitor performance metrics (Grafana)
- [ ] Check error logs for image URL validation
```

### User Feedback
```markdown
- [ ] Send announcement email to admins
- [ ] Collect feedback on new admin UI
- [ ] Survey: Dark mode preference
- [ ] Monitor support tickets for issues
- [ ] Iterate based on feedback
```

---

## 🎯 Completion Criteria

All checkboxes above must be ✅ before considering features "done in production":

- **Backend**: Migration V5 executed successfully
- **Frontend**: No TypeScript/build errors
- **Testing**: All E2E tests passing
- **QA**: Manual testing checklist 100% complete
- **Deployment**: Staging and production deployed
- **Monitoring**: No errors in logs for 24 hours
- **Feedback**: Positive user feedback or issues resolved

---

**Current Status**: ✅ Implementation Complete, Testing In Progress

**Next Step**: Deploy to staging and start manual testing checklist

---

*Generated after successful implementation of Product Images + Dark Mode + Admin UI enhancements*
