import { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'node:crypto';

// A 4-digit personal PIN doesn't warrant heavyweight JWT/bcrypt libraries
// (which were also the source of runtime 500s on Vercel). We sign a tiny
// session token with an HMAC using Node's built-in crypto — zero external
// dependencies, so it can never fail to install or import.
const AUTH_SECRET = process.env.JWT_SECRET || 'change-me-in-production-secret';

export interface AuthenticatedRequest extends VercelRequest {
  user?: { exp: number };
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function sign(data: string): string {
  return base64url(createHmac('sha256', AUTH_SECRET).update(data).digest());
}

/** Create a signed session token that expires after `expiryMinutes`. */
export function createSessionToken(expiryMinutes: number): { token: string; expiresInMs: number } {
  const expiresInMs = expiryMinutes * 60 * 1000;
  const payload = base64url(JSON.stringify({ exp: Date.now() + expiresInMs }));
  const token = `${payload}.${sign(payload)}`;
  return { token, expiresInMs };
}

/** Validate the Bearer token on a request. Returns true if valid and unexpired. */
export function verifyToken(req: AuthenticatedRequest): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

  const token = authHeader.substring(7);
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return false;

  try {
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    if (typeof decoded.exp !== 'number' || Date.now() > decoded.exp) return false;
    req.user = decoded;
    return true;
  } catch {
    return false;
  }
}

/** Apply permissive CORS headers and short-circuit OPTIONS preflight. */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

export function withAuth(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    if (applyCors(req, res)) return;

    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      await handler(req, res);
    } catch (error) {
      console.error('Handler error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
