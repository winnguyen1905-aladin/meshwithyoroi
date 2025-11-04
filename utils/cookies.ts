/**
 * Cookie utility functions for managing authentication tokens
 */

const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';
const ACCESS_TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Set access token in cookie
 */
export function setAccessTokenCookie(token: string): void {
  if (typeof window === 'undefined') return;
  
  // Set cookie with secure, httpOnly-like flags (httpOnly can't be set from client-side)
  // Using SameSite=Strict for better security
  const expires = new Date();
  expires.setTime(expires.getTime() + ACCESS_TOKEN_COOKIE_MAX_AGE * 1000);
  
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=${token}; path=/; max-age=${ACCESS_TOKEN_COOKIE_MAX_AGE}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

/**
 * Get access token from cookie
 */
export function getAccessTokenCookie(): string | null {
  if (typeof window === 'undefined') return null;
  
  const name = ACCESS_TOKEN_COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  
  return null;
}

/**
 * Remove access token cookie
 */
export function removeAccessTokenCookie(): void {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
}

