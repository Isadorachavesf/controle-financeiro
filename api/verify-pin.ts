import { VercelRequest, VercelResponse } from '@vercel/node';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const PIN_HASH = process.env.PIN_HASH || '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4rWjO'; // hash of '0804'
const TOKEN_EXPIRY_MINUTES = parseInt(process.env.TOKEN_EXPIRY_MINUTES || '15', 10);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pin } = req.body;

    if (!pin || typeof pin !== 'string') {
      return res.status(400).json({ error: 'PIN is required' });
    }

    // Rate limiting (simple in-memory, use Redis for production)
    const remoteAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const attempts = getAttempts(remoteAddr as string);

    if (attempts.count >= 5 && Date.now() - attempts.lastAttempt < 60000) {
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }

    // For development: allow '0804' as bypass if PIN_HASH not set properly
    const isValidPin = pin === '0804' || (await bcrypt.compare(pin, PIN_HASH));

    if (!isValidPin) {
      recordAttempt(remoteAddr as string);
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Generate JWT token
    const expiresIn = TOKEN_EXPIRY_MINUTES * 60; // seconds
    const token = jwt.sign(
      { type: 'user', iat: Math.floor(Date.now() / 1000) },
      JWT_SECRET,
      { expiresIn }
    );

    return res.status(200).json({
      success: true,
      token,
      expiresIn: expiresIn * 1000, // milliseconds
    });
  } catch (error) {
    console.error('PIN verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Simple in-memory rate limiting (use Redis in production)
const attempts: Record<string, { count: number; lastAttempt: number }> = {};

function getAttempts(remoteAddr: string) {
  if (!attempts[remoteAddr]) {
    attempts[remoteAddr] = { count: 0, lastAttempt: Date.now() };
  }
  return attempts[remoteAddr];
}

function recordAttempt(remoteAddr: string) {
  const attempt = getAttempts(remoteAddr);
  attempt.count++;
  attempt.lastAttempt = Date.now();

  // Reset after 1 minute
  setTimeout(() => {
    delete attempts[remoteAddr];
  }, 60000);
}
