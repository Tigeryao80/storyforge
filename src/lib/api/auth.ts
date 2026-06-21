// src/lib/api/auth.ts
// Lightweight API route auth for local-only StoryForge.
// Routes require X-API-Key header matching STORYFORGE_API_KEY env var.
// If no key is set, routes are open (local dev convenience).
// Role-based access: STORYFORGE_ROLE env var can be 'admin' or 'user'.
// Admin-only routes check for role === 'admin'.

import { NextRequest } from 'next/server';

const API_KEY = process.env.STORYFORGE_API_KEY || '';
const API_ROLE = process.env.STORYFORGE_ROLE || 'admin';

/**
 * Check if the request is authenticated.
 * Returns null if OK, or a Response object with 401/403 if not.
 */
export function requireAuth(request: Request): Response | null {
  // If no API key configured, allow all (local dev mode)
  if (!API_KEY) return null;

  const provided = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!provided) {
    return new Response(JSON.stringify({ error: 'Missing API key. Provide X-API-Key header.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (provided !== API_KEY) {
    return new Response(JSON.stringify({ error: 'Invalid API key.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}

/**
 * Check if the request has the required role.
 * Must be called AFTER requireAuth (auth check first).
 */
export function requireRole(request: Role): Response | null {
  if (API_ROLE !== request) {
    return new Response(JSON.stringify({ error: `Role '${request}' required. Current role: '${API_ROLE}'.` }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}

type Role = 'admin' | 'user';
