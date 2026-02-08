# UI/UX Refinements Implementation Plan

## 1. Product Images ✅ (Already Implemented)
**Status**: Image URL field exists in backend and ProductFormModal
**Current**: Admin can input image URLs
**Enhancement Needed**: Display images in:
- Product detail page (/products/[sku])
- Products listing page (already has thumbnails)

## 2. Categories & In-Store Location
**Backend Changes Needed**:
- Add `aisle` VARCHAR(50)
- Add `shelfLocation` VARCHAR(100)
- Add `section` VARCHAR(100)
- Migration V6

**Frontend Changes Needed**:
- Update Product type with new fields
- Update ProductFormModal to include location fields
- Display location in product detail page
- Fix category filter dropdown - populate with actual categories
- Show category badges prominently

## 3. Dark Mode Improvements
**Pages Needing Dark Mode**:
- ✅ Navigation (done)
- ✅ Admin products (done)
- ✅ Admin orders (done)
- ❌ Product detail page
- ❌ Products listing page
- ❌ Admin users page (+ striped tables)
- ❌ Homepage
- ❌ Cart page
- ❌ Checkout page

**Issues to Fix**:
- Black text on dark backgrounds
- Missing dark: classes on content areas
- Inconsistent contrast

## 4. Homepage Branding
**Changes**:
- "Luxury Shopping" → "Fresh Groceries"
- "world's finest brands" → "fresh produce and quality essentials"
- "Premium Products" → "Fresh Products"
- Update metadata description
- Add grocery-focused imagery descriptions

## 5. Striped Tables
**Apply to**:
- Admin users page
- All admin tables for consistency

## 6. Modern Dashboard
- Polish admin pages with modern card layouts
- Add stats/metrics where applicable
- Consistent spacing and typography
