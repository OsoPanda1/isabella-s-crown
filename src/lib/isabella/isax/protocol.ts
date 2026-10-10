/**
 * ISA-X Sovereign — protocolo de firma de peticiones (no es criptografía nueva).
 * Combina primitivas estándar: HMAC-SHA256 (Web Crypto), nonce único, ventana temporal y scopes.
 */
export const ISAX_ALG = "ISAX-HMAC-SHA256" as const;
export const MAX_SKEW_MS = 5 * 60 * 1000;

export interface IsaxCredential {
  keyId: string;
  secret: string;
  tenantId: string;
  scopes: readonly string[];
  revoked: boolean;
  expiresAt: number;
}

export interface IsaxRequest {
  alg: string;
  keyId: string;
  method: string;
  path: string;
  bodyHash: string;
  timestamp: number;
  nonce: string;
  scope: string;
  signature: string;
}

export type IsaxVerdict =
  | { ok: true; keyId: string; tenantId: string; scope: string }
  | { ok: false; code: IsaxDenyCode };

export type IsaxDenyCode =
  | "ALG_NOT_DECLARED" | "UNKNOWN_KEY" | "REVOKED" | "EXPIRED"
  | "CLOCK_SKEW" | "REPLAY" | "SCOPE_DENIED" | "BAD_SIGNATURE";

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");

export async function sha256(text: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

export function canonicalString(r: Omit<IsaxRequest, "signature">): string {
  return [r.alg, r.keyId, r.method.toUpperCase(), r.path, r.bodyHash, r.timestamp, r.nonce, r.scope].join("\n");
}

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function signRequest(cred: IsaxCredential, r: Omit<IsaxRequest, "signature" | "alg" | "keyId">): Promise<IsaxRequest> {
  const base = { ...r, alg: ISAX_ALG, keyId: cred.keyId };
  return { ...base, signature: await hmac(cred.secret, canonicalString(base)) };
}

export class IsaxVerifier {
  private nonces = new Map<string, number>();
  constructor(private readonly lookup: (keyId: string) => IsaxCredential | undefined) {}

  async verify(r: IsaxRequest, now = Date.now()): Promise<IsaxVerdict> {
    if (r.alg !== ISAX_ALG) return { ok: false, code: "ALG_NOT_DECLARED" };
    const cred = this.lookup(r.keyId);
    if (!cred) return { ok: false, code: "UNKNOWN_KEY" };
    if (cred.revoked) return { ok: false, code: "REVOKED" };
    if (cred.expiresAt <= now) return { ok: false, code: "EXPIRED" };
    if (Math.abs(now - r.timestamp) > MAX_SKEW_MS) return { ok: false, code: "CLOCK_SKEW" };
    const { signature, ...base } = r;
    const expected = await hmac(cred.secret, canonicalString(base));
    if (!safeEqual(expected, signature)) return { ok: false, code: "BAD_SIGNATURE" };
    for (const [n, t] of this.nonces) if (now - t > MAX_SKEW_MS) this.nonces.delete(n);
    const nk = `${r.keyId}:${r.nonce}`;
    if (this.nonces.has(nk)) return { ok: false, code: "REPLAY" };
    if (!cred.scopes.includes(r.scope)) return { ok: false, code: "SCOPE_DENIED" };
    this.nonces.set(nk, now);
    return { ok: true, keyId: cred.keyId, tenantId: cred.tenantId, scope: r.scope };
  }
}
