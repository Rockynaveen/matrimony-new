// ──────────────────────────────────────────────────────────────
// nameUtils.ts — Independent utilities for name extraction,
// generic name filtering, and Google ID token decoding.
// Prevents circular dependencies between AppContext and APIs.
// ──────────────────────────────────────────────────────────────

export const isGenericName = (name?: string | null): boolean => {
  if (!name) return true;
  const lower = name.trim().toLowerCase();
  return (
    lower === '' ||
    lower === 'user' ||
    lower === 'member' ||
    lower === 'user profile' ||
    lower === 'matrimonial member' ||
    lower === 'verified member' ||
    lower === 'null' ||
    lower === 'undefined'
  );
};

export const decodeGoogleIdToken = (
  idToken?: string | null
): { name?: string; given_name?: string; family_name?: string; email?: string; picture?: string; sub?: string } | null => {
  if (!idToken) return null;
  try {
    const parts = idToken.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('[nameUtils] Failed to decode Google ID Token:', err);
    return null;
  }
};

export const extractNameFromEmail = (email: string | undefined | null): string => {
  if (!email || !email.includes('@')) return 'User';
  const username = email.split('@')[0];
  if (!username) return 'User';

  let cleaned = username.replace(/[._\-+]/g, ' ');
  const alphabeticOnly = cleaned.replace(/[0-9]/g, '').trim();
  const targetStr = alphabeticOnly.length >= 2 ? alphabeticOnly : cleaned;

  const expanded = targetStr.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  const words = expanded.split(/\s+/).filter(Boolean);

  if (words.length === 0) return 'User';

  const formatted = words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  if (isGenericName(formatted)) {
    return 'User';
  }

  return formatted || 'User';
};
