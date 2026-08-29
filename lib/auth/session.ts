import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'civilworks_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'civilworks-secret-key-2026-super-secure';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  assignedProjectIds: string[];
  expiresAt: number;
}

/**
 * Creates a signed base64url session token
 */
export function createSessionToken(payload: Omit<SessionPayload, 'expiresAt'>, durationHours = 24): string {
  const expiresAt = Date.now() + durationHours * 60 * 60 * 1000;
  const fullPayload: SessionPayload = { ...payload, expiresAt };
  const jsonStr = JSON.stringify(fullPayload);
  const encodedPayload = Buffer.from(jsonStr).toString('base64url');
  
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(encodedPayload);
  const signature = hmac.digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a signed session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || !token.includes('.')) return null;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(encodedPayload);
  const expectedSignature = hmac.digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const payload: SessionPayload = JSON.parse(jsonStr);

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Sets the session cookie on response headers
 */
export async function setSessionCookie(payload: Omit<SessionPayload, 'expiresAt'>) {
  const token = createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  });
  return token;
}

/**
 * Gets current user session payload from cookie
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Removes session cookie on logout
 */
export async function removeSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
}
