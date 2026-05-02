/**
 * Authentication debugging utilities
 * Helps troubleshoot JWT token issues and role-based authorization
 */

import { getAccessToken, getAdminProfile } from "@/stores/session";
import { decodeJwt } from "@/lib/jwt";

/**
 * Decode a JWT token (without verification - for debugging only)
 * @deprecated Use decodeJwt from @/lib/jwt directly.
 */
export function decodeJWT(token: string): unknown {
  return decodeJwt(token);
}

/**
 * Get current user roles from JWT access token
 */
export function getCurrentUserRoles(): string[] {
  const token = getAccessToken();
  if (!token) {
    return [];
  }

  // Only try to decode if it's a JWT
  if (!token.startsWith('eyJ')) {
    console.warn('Token is not JWT format - cannot extract roles client-side');
    return [];
  }

  const payload = decodeJWT(token);
  if (!payload || typeof payload !== 'object' || payload === null) {
    return [];
  }

  const jwtPayload = payload as Record<string, unknown>;
  
  // Handle both 'role' (singular) and 'roles' (plural) fields
  if (jwtPayload.roles && Array.isArray(jwtPayload.roles)) {
    return jwtPayload.roles as string[];
  }
  if (jwtPayload.role && typeof jwtPayload.role === 'string') {
    return [jwtPayload.role];
  }

  return [];
}

/**
 * Check if current user has admin role
 */
export function hasSystemAdminRole(): boolean {
  const adminProfile = getAdminProfile();
  const roleName = adminProfile?.role?.name?.toUpperCase();
  if (
    roleName === 'SYSTEM_ADMIN' ||
    roleName === 'SUPER_ADMIN' ||
    adminProfile?.role?.permissions?.includes('*') ||
    adminProfile?.scopeType === 'GLOBAL' ||
    adminProfile?.role?.scopeType === 'GLOBAL'
  ) {
    return true;
  }

  const roles = getCurrentUserRoles();
  return roles.includes('SYSTEM_ADMIN') || roles.includes('SUPER_ADMIN');
}

/**
 * Debug current authentication state
 * Logs detailed information about the current access token
 */
export function debugAuthState(): void {
  console.group('🔍 Authentication Debug Info');
  
  const token = getAccessToken();
  console.log('Access Token Present:', !!token);
  
  if (token) {
    console.log('Token Length:', token.length);
    console.log('Token Preview:', token.substring(0, 20) + '...');
    
    // Check token format - backend now supports both JWTs and session tokens
    const isJWT = token.startsWith('eyJ');
    
    if (isJWT) {
      console.log('✅ Token is JWT format (correct from adminLogin)');
      console.log('✅ Backend auth guard now supports JWT validation');
      
      // Decode JWT for useful debugging info
      const payload = decodeJWT(token);
      if (payload && typeof payload === 'object' && payload !== null) {
        const jwtPayload = payload as Record<string, unknown>;
        console.log('JWT Payload:', payload);
        console.log('User ID:', jwtPayload.sub || jwtPayload.userId);
        console.log('Email:', jwtPayload.email);
        console.log('Role:', jwtPayload.role);
        console.log('Scope:', jwtPayload.scopeType);
        
        // Check expiration (15 minutes from adminLogin)
        if (typeof jwtPayload.exp === 'number') {
          const expDate = new Date(jwtPayload.exp * 1000);
          const now = new Date();
          const minutesLeft = Math.round((expDate.getTime() - now.getTime()) / 1000 / 60);
          console.log('Token Expires:', expDate.toISOString());
          console.log('Token Expired:', now > expDate);
          console.log('Time Until Expiry:', minutesLeft, 'minutes');
          
          if (minutesLeft < 2) {
            console.warn('⚠️ Token expiring soon - re-login required');
          }
        }
      }
    } else {
      console.log('ℹ️ Token appears to be session token format');
      console.log('ℹ️ Backend supports both JWT and session token validation');
    }
    
    console.log('');
    console.log('📋 Authentication Facts:');
    console.log('• adminLogin returns JWT accessToken (15 min expiry)');
    console.log('• Backend auth guard validates Bearer JWT');
    console.log('• refreshToken mutation + Apollo ErrorLink retry + proactive refresh before JWT exp');
    console.log('• All services use the same authentication now');
  } else {
    console.log('❌ No access token found - use adminLogin mutation to get JWT');
  }
  
  console.groupEnd();
}