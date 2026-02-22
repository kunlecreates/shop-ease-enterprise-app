/**
 * JWT utility functions for extracting claims from tokens
 */

interface JWTPayload {
  sub?: string;
  email?: string;
  fullName?: string;
  roles?: string[];
  exp?: number;
  iat?: number;
}

/**
 * Decode a JWT token and return the payload
 * Does not validate the signature - only parses the claims for display purposes
 */
export function decodeJwt(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format');
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Extract the fullName claim from a JWT token
 * Returns the fullName or null if not found
 */
export function getFullNameFromToken(token: string | null): string | null {
  if (!token) {
    return null;
  }

  const payload = decodeJwt(token);
  return payload?.fullName || null;
}

/**
 * Extract email from JWT token
 */
export function getEmailFromToken(token: string | null): string | null {
  if (!token) {
    return null;
  }

  const payload = decodeJwt(token);
  return payload?.email || null;
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) {
    return true;
  }

  const payload = decodeJwt(token);
  if (!payload?.exp) {
    return false;
  }

  return Date.now() >= payload.exp * 1000;
}
