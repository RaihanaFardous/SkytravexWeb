import { randomInt } from 'node:crypto';
import { site } from '@/lib/site';

// Creates a demo account on the live booking site (Aerotake) for a visitor
// who filled in the SkyTravex demo form, the same way Aerotake's own
// "Create account" form does. The visitor then signs in with the email and
// generated password shown to them.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REGISTER_URL = new URL('/api/auth/register', site.demoUrl).toString();
const LOGIN_URL = new URL('/login', site.demoUrl).toString();
const FORGOT_URL = new URL('/login', site.demoUrl).toString();

// Best-effort limit per server instance: 5 demo sign-ups per IP per hour.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const WORDS = ['Sky', 'Jet', 'Wing', 'Cloud', 'Orbit', 'Pilot', 'Route', 'Gate', 'Cabin', 'Runway', 'Coast', 'Atlas'];
function makePassword() {
  const a = randomInt(WORDS.length);
  const b = (a + 1 + randomInt(WORDS.length - 1)) % WORDS.length;
  return `${WORDS[a]}-${WORDS[b]}-${randomInt(1000, 10000)}`;
}

// Aerotake expects "<dial code> <national number>", with Bangladesh
// numbers written as 11 digits starting 01.
function formatPhone(dialCode, number) {
  let digits = String(number || '').replace(/\D/g, '');
  if (dialCode === '+880' && /^1[3-9]\d{8}$/.test(digits)) digits = `0${digits}`;
  if (dialCode === '+880' && /^8801[3-9]\d{8}$/.test(digits)) digits = digits.slice(2);
  if (dialCode === '+44' && /^7\d{9}$/.test(digits)) digits = `0${digits}`;
  return `${dialCode} ${digits}`.trim();
}

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  let input;
  try {
    input = await request.json();
  } catch {
    return json({ ok: false, error: 'Send the form again.' }, 400);
  }

  const name = String(input.name || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const dialCode = String(input.dialCode || '+880').trim();
  const phoneNumber = String(input.phone || '').trim();

  if (input.fax) return json({ ok: false, error: 'Request blocked.' }, 400);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Enter your name and a valid email address.' }, 400);
  }

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) {
    return json({ ok: false, error: 'Too many demo requests from this network. Please try again in an hour.' }, 429);
  }

  const password = makePassword();
  const phone = phoneNumber ? formatPhone(dialCode, phoneNumber) : '';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: new URL(site.demoUrl).origin,
        Referer: LOGIN_URL,
        'User-Agent': 'SkyTravex-Demo/1.0 (+https://skytravex-web.vercel.app)',
      },
      body: JSON.stringify({ email, password, phone }),
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    const data = await response.json().catch(() => ({}));
    const message = String(data.message || '');

    if (response.ok) {
      return json({
        ok: true,
        account: 'created',
        login: { url: LOGIN_URL, email, password },
      });
    }

    if (response.status === 409 || /already|exists|registered|in use/i.test(message)) {
      return json({
        ok: true,
        account: 'exists',
        login: { url: LOGIN_URL, email, forgotUrl: FORGOT_URL },
      });
    }

    if (data.error === 'invalid_request' && /phone|mobile/i.test(message)) {
      return json({ ok: false, field: 'phone', error: message }, 400);
    }

    if (data.error === 'invalid_request' && /email/i.test(message)) {
      return json({ ok: false, field: 'email', error: message }, 400);
    }

    // Captcha, rate limits or anything unexpected: the visitor can still
    // create the account on the demo site directly.
    return json({ ok: false, fallback: true, signupUrl: LOGIN_URL, error: message || 'Automatic sign-up is unavailable right now.' }, 502);
  } catch (error) {
    clearTimeout(timer);
    return json({ ok: false, fallback: true, signupUrl: LOGIN_URL, error: 'The demo site did not respond in time.' }, 504);
  }
}
