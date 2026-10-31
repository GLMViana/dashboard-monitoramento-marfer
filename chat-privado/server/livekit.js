import { createHmac } from 'node:crypto';

// Gera um access token JWT (HS256) no formato que o LiveKit espera.
// Não usa dependência extra: o formato é simples e estável.
export function createLiveKitToken({ apiKey, apiSecret, identity, name, room, ttlSeconds = 6 * 3600 }) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    iss: apiKey,
    sub: identity,
    name,
    nbf: now - 10,
    exp: now + ttlSeconds,
    video: {
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  });
  const sig = createHmac('sha256', apiSecret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}
