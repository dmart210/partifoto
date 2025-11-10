// Basic security & validation helpers for public, no-auth environment.
// NOTE: Rate limiting here is in-memory and per-runtime only. For production,
// replace with a durable store (Redis, Upstash, Supabase table) or an edge provider.

const ID_REGEX = /^[A-Za-z0-9_-]{6,20}$/; // nanoid(10) falls within this range
const MAX_NAME_LEN = 60;
const MAX_TITLE_LEN = 200;
const MAX_COMMENT_LEN = 500;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

// Allow common photo/image formats only
export const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif'
]);
export const ALLOWED_EXT = new Set(['jpg','jpeg','png','gif','webp','heic','heif']);

// Simple in-memory token bucket per identifier (IP or synthetic key)
interface Bucket { tokens: number; last: number }
const buckets = new Map<string, Bucket>();

export function enforceRateLimit(key: string, opts: { capacity?: number; refillPerSec?: number } = {}): boolean {
  const capacity = opts.capacity ?? 30; // 30 requests
  const refillPerSec = opts.refillPerSec ?? 1; // regain 1 token / second
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: capacity, last: now };
    buckets.set(key, bucket);
  }
  const deltaSec = (now - bucket.last) / 1000;
  if (deltaSec > 0) {
    bucket.tokens = Math.min(capacity, bucket.tokens + deltaSec * refillPerSec);
    bucket.last = now;
  }
  if (bucket.tokens < 1) {
    return false; // rate limited
  }
  bucket.tokens -= 1;
  return true;
}

export function sanitizeString(input: unknown, maxLen: number): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Collapse internal excessive whitespace
  const collapsed = trimmed.replace(/\s{2,}/g, ' ');
  // Remove control characters (except newline & tab if desired)
  const stripped = collapsed.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  return stripped.slice(0, maxLen);
}

export function validateId(id: string | undefined | null): boolean {
  if (!id) return false;
  return ID_REGEX.test(id);
}

export function isAllowedImageMime(mime: string | undefined | null): boolean {
  if (!mime) return false;
  return ALLOWED_IMAGE_MIME.has(mime.toLowerCase());
}

export function safeFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  const ext = parts.pop()!.toLowerCase();
  return ALLOWED_EXT.has(ext) ? ext : '';
}

export function limitAndSanitizeAlbumName(name: unknown): string | null {
  return sanitizeString(name, MAX_TITLE_LEN); // reuse title limit for album name
}

export function limitAndSanitizeTitle(title: unknown): string | null {
  return sanitizeString(title, MAX_TITLE_LEN);
}

export function limitAndSanitizeName(name: unknown): string | null {
  return sanitizeString(name, MAX_NAME_LEN);
}

export function limitAndSanitizeComment(content: unknown): string | null {
  return sanitizeString(content, MAX_COMMENT_LEN);
}

export function extractClientKey(headers: Headers): string {
  // Prefer forwarded IP chain; fall back to user-agent combination.
  const xf = headers.get('x-forwarded-for') || headers.get('x-real-ip');
  if (xf) return xf.split(',')[0].trim();
  const ua = headers.get('user-agent') || 'unknown';
  return 'ua:' + ua.slice(0, 40);
}
