/** Cookie flags for access_token (middleware + client auth). */
export function accessTokenCookie(token: string, maxAgeSeconds = 86400): string {
  const secure =
    process.env.NEXT_PUBLIC_COOKIE_SECURE === 'true' ||
    (typeof window !== 'undefined' && window.location.protocol === 'https:');
  const securePart = secure ? '; Secure' : '';
  return `access_token=${token}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${securePart}`;
}

export function clearAccessTokenCookie(): string {
  const secure =
    process.env.NEXT_PUBLIC_COOKIE_SECURE === 'true' ||
    (typeof window !== 'undefined' && window.location.protocol === 'https:');
  const securePart = secure ? '; Secure' : '';
  return `access_token=; path=/; max-age=0${securePart}`;
}
