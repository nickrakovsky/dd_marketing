import { DemoError, SESSION_SECONDS } from './demo-types';

const encoder = new TextEncoder();
const COOKIE = '__Host-dd_demo';
const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');

export async function digest(value: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

export class DemoAuth {
  private key: Promise<CryptoKey>;
  constructor(secret: string, private now = Date.now) {
    if (secret.length < 32) throw new Error('Demo signing secret must have at least 32 characters');
    this.key = crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  }
  private async sign(value: string) {
    return hex(await crypto.subtle.sign('HMAC', await this.key, encoder.encode(value)));
  }
  private async verify(value: string, signature: string) {
    if (!/^[a-f0-9]{64}$/.test(signature)) return false;
    const bytes = Uint8Array.from(signature.match(/../g)!, byte => parseInt(byte, 16));
    return crypto.subtle.verify('HMAC', await this.key, bytes, encoder.encode(value));
  }
  async newSession() {
    const id = crypto.randomUUID();
    const expires = Math.floor(this.now() / 1000) + SESSION_SECONDS;
    const value = `${id}.${expires}`;
    return `${COOKIE}=${value}.${await this.sign(`session:${value}`)}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
  }
  async session(request: Request): Promise<{ hash: string; expires: number } | null> {
    const cookie = request.headers.get('cookie')?.split(';').map(item => item.trim()).find(item => item.startsWith(`${COOKIE}=`));
    const value = cookie?.slice(COOKIE.length + 1);
    if (!value) return null;
    const [id, expiresText, signature, extra] = value.split('.');
    const expires = Number(expiresText);
    if (extra || !/^[a-f0-9-]{36}$/.test(id) || !Number.isSafeInteger(expires) || expires <= this.now() / 1000
      || !await this.verify(`session:${id}.${expiresText}`, signature || '')) return null;
    return { hash: await digest(id), expires };
  }
  async receipt(id: string, session: { hash: string; expires: number }, scope: 'lead' | 'booking' = 'lead') {
    return `${id}.${session.expires}.${await this.sign(`${scope}:${id}:${session.hash}:${session.expires}`)}`;
  }
  async leadId(token: unknown, session: { hash: string; expires: number }, scope: 'lead' | 'booking' = 'lead') {
    if (typeof token !== 'string' || token.length > 160) throw new DemoError('invalid_receipt', 403);
    const [id, expiresText, signature, extra] = token.split('.');
    if (extra || !/^[a-f0-9]{64}$/.test(id) || Number(expiresText) !== session.expires
      || !await this.verify(`${scope}:${id}:${session.hash}:${session.expires}`, signature || '')) throw new DemoError('invalid_receipt', 403);
    return id;
  }
  async rateKey(ip: string, bucket: number) {
    return `ip:${await this.sign(`rate:${bucket}:${ip}`)}`;
  }
}
