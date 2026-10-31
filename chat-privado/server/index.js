import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';
import { join, extname, resolve, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { createSession, readSession, verifyPassword, hashPassword, createRateLimiter } from './auth.js';

// Hash fictício: comparado quando o usuário não existe, para o tempo de resposta não revelar nomes válidos.
const DUMMY_HASH = hashPassword('dummy-password-never-used');
import { createLiveKitToken } from './livekit.js';
import { createMessageStore } from './store.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT_DIR = join(ROOT, 'client');
const CONFIG_DIR = join(ROOT, 'config');
const DATA_DIR = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : join(ROOT, 'data');
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;
const MAX_TEXT = 2000;
const MSG_RATE = { max: 6, windowMs: 10_000 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// CSP com a origem exata do LiveKit (ws/wss para sinalização, http/https para a validação inicial do SDK).
export function securityHeaders(livekitUrl) {
  const lk = new URL(livekitUrl);
  const secure = lk.protocol === 'wss:' || lk.protocol === 'https:';
  const origins = [
    `${secure ? 'wss' : 'ws'}://${lk.host}`,
    `${secure ? 'https' : 'http'}://${lk.host}`,
  ].join(' ');
  return {
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; " +
      `media-src 'self' blob:; connect-src 'self' ${origins}; frame-ancestors 'none'`,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
  };
}

export function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT) || 3000,
    livekitUrl: env.LIVEKIT_URL || 'ws://localhost:7880',
    livekitHttpUrl: env.LIVEKIT_HTTP_URL || env.LIVEKIT_URL || 'ws://localhost:7880',
    apiKey: env.LIVEKIT_API_KEY || 'devkey',
    apiSecret: env.LIVEKIT_API_SECRET || 'secret',
    sessionSecret: env.SESSION_SECRET || randomBytes(32).toString('hex'),
    // Atrás de proxy (Caddy), o IP real vem no X-Forwarded-For. Só ligue se o proxy estiver na frente.
    trustProxy: env.TRUST_PROXY === '1',
    dataDir: DATA_DIR,
    configDir: env.CONFIG_DIR ? resolve(env.CONFIG_DIR) : CONFIG_DIR,
  };
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

// Usuários e canais são relidos a cada uso: adicionar alguém não exige reiniciar.
const loadUsers = (dir) => readJson(join(dir, 'users.json'), []);
const loadChannels = async (dir) => {
  const c = await readJson(join(dir, 'channels.json'), { text: ['geral'], voice: ['Voz geral'] });
  return { text: c.text ?? [], voice: c.voice ?? [] };
};

async function readBody(req, limit = 16 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('payload grande demais'), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('JSON inválido'), { status: 400 });
  }
}

function bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

export function createApp(config, { store = createMessageStore(join(config.dataDir, 'messages.jsonl')) } = {}) {
  const loginLimiter = createRateLimiter({ max: 10, windowMs: 15 * 60_000 });
  const SECURITY_HEADERS = securityHeaders(config.livekitUrl);

  // O Caddy acrescenta o IP real no fim do X-Forwarded-For, então o último item é o confiável.
  function clientIp(req, trustProxy) {
    if (trustProxy && req.headers['x-forwarded-for']) {
      return String(req.headers['x-forwarded-for']).split(',').at(-1).trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }

  function send(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...SECURITY_HEADERS });
    res.end(JSON.stringify(body));
  }

  const requireUser = (req) => readSession(bearer(req), config.sessionSecret);

  async function handleApi(req, res, url) {
    if (req.method === 'POST' && url.pathname === '/api/login') {
      const ip = clientIp(req, config.trustProxy);
      if (!loginLimiter.allow(ip)) return send(res, 429, { error: 'Muitas tentativas. Espera uns minutos.' });
      const body = await readBody(req);
      const name = String(body.name ?? '').trim().toLowerCase();
      const users = await loadUsers(config.configDir);
      const user = users.find((u) => u.name === name);
      // Verifica a senha mesmo se o usuário não existir, para não revelar quem existe pelo tempo de resposta.
      const ok = verifyPassword(String(body.password ?? ''), user?.passwordHash ?? DUMMY_HASH);
      if (!user || !ok) return send(res, 401, { error: 'Nome ou senha incorretos.' });
      loginLimiter.reset(ip);
      return send(res, 200, { token: createSession(name, config.sessionSecret, SESSION_TTL_MS), name });
    }

    const me = requireUser(req);
    if (!me) return send(res, 401, { error: 'Não autenticado.' });

    if (req.method === 'GET' && url.pathname === '/api/config') {
      return send(res, 200, { name: me, channels: await loadChannels(config.configDir), livekitUrl: config.livekitUrl });
    }

    if (req.method === 'POST' && url.pathname === '/api/voice-token') {
      const body = await readBody(req);
      const channels = await loadChannels(config.configDir);
      const room = String(body.room ?? '');
      if (!channels.voice.includes(room)) return send(res, 404, { error: 'Canal de voz não existe.' });
      const token = createLiveKitToken({
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
        identity: me,
        name: me,
        room,
      });
      return send(res, 200, { token, url: config.livekitUrl });
    }

    return send(res, 404, { error: 'Rota não encontrada.' });
  }

  async function serveStatic(res, pathname) {
    let filePath;
    if (pathname === '/' || pathname === '/index.html') {
      filePath = join(CLIENT_DIR, 'index.html');
    } else if (pathname === '/vendor/livekit-client.mjs') {
      filePath = join(ROOT, 'node_modules', 'livekit-client', 'dist', 'livekit-client.esm.mjs');
    } else {
      filePath = resolve(CLIENT_DIR, '.' + decodeURIComponent(pathname));
      if (!filePath.startsWith(CLIENT_DIR + sep)) return send(res, 403, { error: 'Proibido.' });
    }
    try {
      const info = await stat(filePath);
      if (!info.isFile()) throw new Error('não é arquivo');
      const data = await readFile(filePath);
      res.writeHead(200, {
        'Content-Type': MIME[extname(filePath)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
        ...SECURITY_HEADERS,
      });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
      res.end('Não encontrado');
    }
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Método não permitido.' });
      return await serveStatic(res, url.pathname);
    } catch (err) {
      if (!res.headersSent) send(res, err.status || 500, { error: err.status ? err.message : 'Erro interno.' });
    }
  });

  // ---- Chat de texto por WebSocket ----
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });
  const clients = new Set();

  server.on('upgrade', async (req, socket, head) => {
    const url = new URL(req.url, 'http://localhost');
    const user = url.pathname === '/ws' ? readSession(url.searchParams.get('token'), config.sessionSecret) : null;
    if (!user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      return socket.destroy();
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.user = user;
      ws.alive = true;
      ws.sent = [];
      clients.add(ws);
      ws.on('pong', () => (ws.alive = true));
      ws.on('close', () => clients.delete(ws));
      ws.on('message', (raw) => {
        onWsMessage(ws, raw).catch((err) => console.error('erro no chat:', err.message));
      });
    });
  });

  async function onWsMessage(ws, raw) {
    let msg;
    try {
      msg = JSON.parse(raw.toString('utf8'));
    } catch {
      return ws.send(JSON.stringify({ type: 'error', error: 'mensagem inválida' }));
    }
    const channels = await loadChannels(config.configDir);
    if (msg.type === 'history') {
      if (!channels.text.includes(msg.channel)) return;
      const messages = await store.recent(msg.channel);
      return ws.send(JSON.stringify({ type: 'history', channel: msg.channel, messages }));
    }
    if (msg.type === 'send') {
      const text = String(msg.text ?? '').trim();
      if (!channels.text.includes(msg.channel)) return;
      if (!text || text.length > MAX_TEXT) return;
      const now = Date.now();
      ws.sent = ws.sent.filter((t) => now - t < MSG_RATE.windowMs);
      if (ws.sent.length >= MSG_RATE.max) {
        return ws.send(JSON.stringify({ type: 'error', error: 'Calma aí, muitas mensagens seguidas.' }));
      }
      ws.sent.push(now);
      const message = {
        id: randomUUID(),
        channel: msg.channel,
        from: ws.user,
        text,
        at: new Date(now).toISOString(),
      };
      await store.append(message);
      const payload = JSON.stringify({ type: 'message', message });
      for (const c of clients) if (c.readyState === 1) c.send(payload);
    }
  }

  // Derruba conexões mortas (sem resposta de ping) para não acumular recursos.
  const heartbeat = setInterval(() => {
    for (const ws of clients) {
      if (!ws.alive) {
        ws.terminate();
        continue;
      }
      ws.alive = false;
      ws.ping();
    }
  }, 30_000);
  server.on('close', () => clearInterval(heartbeat));

  return server;
}

// Execução direta: node server/index.js
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const config = loadConfig();
  if (!process.env.SESSION_SECRET) console.warn('SESSION_SECRET não definido: sessões vão expirar a cada reinício.');
  createApp(config).listen(config.port, () => {
    console.log(`Canal privado rodando em http://localhost:${config.port}`);
  });
}
