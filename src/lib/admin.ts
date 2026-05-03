export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ?? 'kalpkothari14@gmail.com';
export const ADMIN_PASSWORD_HASH =
  (import.meta.env.VITE_ADMIN_PASSWORD_HASH as string | undefined) ??
  '33407eca36b39ea76a06504f1e1bdb650fa97493bef9e8002853f1e18543d738';

export const isAdminEmail = (email?: string | null) => {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

const secureHashEquals = (left: string, right: string): boolean => {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i++) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
};

export const isValidAdminCredential = (email: string, hashedPassword: string) => {
  return isAdminEmail(email) && secureHashEquals(hashedPassword, ADMIN_PASSWORD_HASH);
};