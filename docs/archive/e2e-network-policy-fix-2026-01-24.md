# E2E Test Failures - Network Policy Port Mismatch Fix

**Date:** 2026-01-24
**Author:** GitHub Copilot (Beast Mode)
**Issue:** E2E tests failing with 502 Bad Gateway errors
**Status:** FIXED

## Problem Summary

E2E Playwright tests failing with widespread 502 errors when accessing backend microservices through frontend proxy.
- 32/35 tests FAILED with 502 errors
- 1 test PASSED (JWT token expiration)
- 2 tests SKIPPED

## Root Cause

Network policies only allowed container ports (3000, 8081, 8083, 8084) but NOT service port 80.
Frontend connects via service port 80, which was blocked.

## Solution

Updated all 4 backend service network policies to allow BOTH ports:
- Service port 80 (what frontend connects to)
- Target port (what container listens on)

## Files Changed
1. services/product-service/helm/templates/networkpolicy.yaml
2. services/user-service/helm/templates/networkpolicy.yaml
3. services/order-service/helm/templates/networkpolicy.yaml
4. services/notification-service/helm/templates/networkpolicy.yaml
