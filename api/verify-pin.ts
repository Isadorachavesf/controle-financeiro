import { VercelRequest, VercelResponse } from '@vercel/node';
import { createSessionToken, applyCors } from '../lib/auth';

const APP_PIN = process.env.APP_PIN || '0804';
const TOKEN_EXPIRY_MINUTES = parseInt(process.env.TOKEN_EXPIRY_MINUTES || '60', 10);

// Simple in-memory rate limiting (best-effort; resets on cold start)
const attempts: Record<string, { count: number; lastAttempt: number }> = {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vercel usually parses JSON bodies, but guard against a raw string or
    // undefined body so we never crash with a 500.
    let body: any = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const pin = body?.pin;

    if (!pin || typeof pin !== 'string') {
      return res.status(400).json({ error: 'PIN is required' });
    }

    const remoteAddr = String(req.headers['x-forwarded-for'] || 'unknown');
    const record = attempts[remoteAddr] || { count: 0, lastAttempt: Date.now() };

    if (record.count >= 5 && Date.now() - record.lastAttempt < 60000) {
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }

    if (pin !== APP_PIN) {
      attempts[remoteAddr] = { count: record.count + 1, lastAttempt: Date.now() };
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Success — reset attempts and issue a signed session token
    delete attempts[remoteAddr];
    const { token, expiresInMs } = createSessionToken(TOKEN_EXPIRY_MINUTES);

    return res.status(200).json({
      success: true,
      token,
      expiresIn: expiresInMs,
    });
  } catch (error) {
    console.error('PIN verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
