import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHmac } from 'node:crypto';
import WebSocket from 'ws';
import { createApp } from '../server/index.js';
import { hashPassword, verifyPassword, createSession, readSession, createRateLimiter } from '../server/auth.js';
import { createLiveKitToken } from '../server/livekit.js';
import { createMessageStore } from '../server/store.js';

const cfg = {
  apiKey: 'test-key',
  apiSecret: 'test-secret-with-enough-length-for-hmac',
  sessionSecret: 'session-secret-for-tests',
  livekitUrl: 'wss://livekit.example.test',
};

let dir;
let server;
let base;
let wsBase;

before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'canal-test-'));
  await writeFile(
    join(dir, 'users.json'),
    JSON.stringify([
      { name: 'ana', passwordHash: hashPassword('senha-da-ana-123') },
      { name: 'bia', passwordHash: hashPassword('senha-da-bia-123') },
    ]),
  );
  await writeFile(join(dir, 'channels.json'), JSON.stringify({ text: ['geral'], voice: ['Voz geral'] }));
  const config = { ...cfg, configDir: dir, dataDir: join(dir, 'data'), port: 0 };
  server = createApp(config);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  base = `http://127.0.0.1:${port}`;
  wsBase = `ws://127.0.0.1:${port}`;
});

after(async () => {
  server?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

async function login(name = 'ana', password = 'senha-da-ana-123') {
  const res = await fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password }),
  });
  return { status: res.status, body: await res.json() };
}

test('senha: hash verifica a senha certa e recusa a errada', () => {
  const h = hashPassword('abcdefgh');
  assert.equal(verifyPassword('abcdefgh', h), true);
  assert.equal(verifyPassword('abcdefgx', h), false);
  assert.equal(verifyPassword('abcdefgh', 'lixo'), false);
});

test('sessão: assinatura válida, adulterada e expirada', () => {
  const token = createSession('ana', 's', 60_000);
  assert.equal(readSession(token, 's'), 'ana');
  assert.equal(readSession(token, 'outro'), null);
  const [payload, sig] = token.split('.');
  const forged = Buffer.from(JSON.stringify({ u: 'admin', exp: Date.now() + 60_000 })).toString('base64url');
  assert.equal(readSession(`${forged}.${sig}`, 's'), null);
  assert.equal(readSession(createSession('ana', 's', -1), 's'), null);
  assert.ok(payload);
});

test('limitador: bloqueia depois do máximo na janela', () => {
  const rl = createRateLimiter({ max: 2, windowMs: 60_000 });
  assert.equal(rl.allow('ip'), true);
  assert.equal(rl.allow('ip'), true);
  assert.equal(rl.allow('ip'), false);
});

test('token do LiveKit tem assinatura HS256 verificável e grant da sala', () => {
  const token = createLiveKitToken({ apiKey: 'k', apiSecret: 'segredo', identity: 'ana', name: 'ana', room: 'Voz geral' });
  const [h, p, s] = token.split('.');
  const expected = createHmac('sha256', 'segredo').update(`${h}.${p}`).digest('base64url');
  assert.equal(s, expected);
  const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
  assert.equal(claims.iss, 'k');
  assert.equal(claims.sub, 'ana');
  assert.equal(claims.video.room, 'Voz geral');
  assert.equal(claims.video.roomJoin, true);
  assert.ok(claims.exp > claims.nbf);
});

test('login: senha errada e usuário inexistente retornam 401 iguais', async () => {
  const a = await login('ana', 'errada-errada');
  const b = await login('ninguem', 'qualquer-coisa');
  assert.equal(a.status, 401);
  assert.equal(b.status, 401);
  assert.equal(a.body.error, b.body.error);
});

test('login correto devolve token que abre a configuração', async () => {
  const { status, body } = await login();
  assert.equal(status, 200);
  assert.equal(body.name, 'ana');
  const res = await fetch(`${base}/api/config`, { headers: { Authorization: `Bearer ${body.token}` } });
  assert.equal(res.status, 200);
  const cfgBody = await res.json();
  assert.deepEqual(cfgBody.channels.text, ['geral']);
  assert.equal(cfgBody.livekitUrl, cfg.livekitUrl);
});

test('rotas protegidas recusam quem não está logado', async () => {
  const res = await fetch(`${base}/api/config`);
  assert.equal(res.status, 401);
});

test('token de voz só existe para canal de voz cadastrado', async () => {
  const { body } = await login();
  const auth = { Authorization: `Bearer ${body.token}`, 'Content-Type': 'application/json' };
  const ok = await fetch(`${base}/api/voice-token`, { method: 'POST', headers: auth, body: JSON.stringify({ room: 'Voz geral' }) });
  assert.equal(ok.status, 200);
  const { token } = await ok.json();
  assert.ok(token.split('.').length === 3);
  const bad = await fetch(`${base}/api/voice-token`, { method: 'POST', headers: auth, body: JSON.stringify({ room: 'Outra' }) });
  assert.equal(bad.status, 404);
});

test('arquivos: página principal com CSP, sem sair da pasta do cliente', async () => {
  const home = await fetch(`${base}/`);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-security-policy'), /script-src 'self'/);
  const html = await home.text();
  assert.match(html, /Canal privado/);

  const traversal = await fetch(`${base}/%2e%2e/package.json`);
  assert.notEqual(traversal.status, 200);
  const traversal2 = await fetch(`${base}/..%2fserver%2findex.js`);
  assert.notEqual(traversal2.status, 200);
});

test('vendor do LiveKit é servido', async () => {
  const res = await fetch(`${base}/vendor/livekit-client.mjs`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /javascript/);
});

function openWs(token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsBase}/ws?token=${encodeURIComponent(token ?? '')}`);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

function nextMessage(ws, predicate = () => true) {
  return new Promise((resolve) => {
    const handler = (raw) => {
      const msg = JSON.parse(raw.toString());
      if (predicate(msg)) {
        ws.off('message', handler);
        resolve(msg);
      }
    };
    ws.on('message', handler);
  });
}

test('websocket recusa conexão sem token válido', async () => {
  await assert.rejects(openWs('token-falso'));
});

test('chat: envia, recebe em tempo real e guarda histórico', async () => {
  const { body } = await login();
  const ws = await openWs(body.token);
  const got = nextMessage(ws, (m) => m.type === 'message');
  ws.send(JSON.stringify({ type: 'send', channel: 'geral', text: 'oi pessoal' }));
  const msg = await got;
  assert.equal(msg.message.text, 'oi pessoal');
  assert.equal(msg.message.from, 'ana');

  const hist = nextMessage(ws, (m) => m.type === 'history');
  ws.send(JSON.stringify({ type: 'history', channel: 'geral' }));
  const h = await hist;
  assert.equal(h.messages.at(-1).text, 'oi pessoal');
  ws.close();
});

test('chat: canal inexistente e texto vazio são ignorados', async () => {
  const { body } = await login();
  const ws = await openWs(body.token);
  let received = false;
  ws.on('message', () => (received = true));
  ws.send(JSON.stringify({ type: 'send', channel: 'nao-existe', text: 'x' }));
  ws.send(JSON.stringify({ type: 'send', channel: 'geral', text: '   ' }));
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(received, false);
  ws.close();
});

test('chat: limite de envio por janela de tempo', async () => {
  const { body } = await login();
  const ws = await openWs(body.token);
  const errors = [];
  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString());
    if (m.type === 'error') errors.push(m);
  });
  for (let i = 0; i < 8; i++) ws.send(JSON.stringify({ type: 'send', channel: 'geral', text: `m${i}` }));
  await new Promise((r) => setTimeout(r, 300));
  assert.ok(errors.length >= 1);
  ws.close();
});

test('store: lê só o canal pedido e ignora linha corrompida', async () => {
  const file = join(dir, 'msgs', 'messages.jsonl');
  const store = createMessageStore(file);
  await store.append({ channel: 'a', text: '1' });
  await store.append({ channel: 'b', text: '2' });
  const { appendFile } = await import('node:fs/promises');
  await appendFile(file, '{quebrado\n', 'utf8');
  await store.append({ channel: 'a', text: '3' });
  const list = await store.recent('a');
  assert.deepEqual(list.map((m) => m.text), ['1', '3']);
});

test('CSP usa a origem exata do LiveKit (wss em produção, ws em desenvolvimento)', async () => {
  const { securityHeaders } = await import('../server/index.js');
  const prod = securityHeaders('wss://livekit.exemplo.com')['Content-Security-Policy'];
  assert.match(prod, /connect-src 'self' wss:\/\/livekit\.exemplo\.com https:\/\/livekit\.exemplo\.com/);
  const dev = securityHeaders('ws://localhost:7880')['Content-Security-Policy'];
  assert.match(dev, /connect-src 'self' ws:\/\/localhost:7880 http:\/\/localhost:7880/);
  assert.doesNotMatch(prod, /connect-src[^;]*\bhttps:(?!\/\/livekit)/);
});

test('presença: entrada, mudo e saída de sala de voz são avisados aos outros', async () => {
  const wsA = await openWs((await login()).body.token);
  const wsB = await openWs((await login('bia', 'senha-da-bia-123')).body.token);
  const inRoom = (m) => m.type === 'voice' && (m.rooms['Voz geral'] || []).some((p) => p.name === 'ana');

  const joined = nextMessage(wsB, inRoom);
  wsA.send(JSON.stringify({ type: 'voice-join', room: 'Voz geral', muted: true, sharing: false }));
  const m = await joined;
  assert.equal(m.rooms['Voz geral'].find((p) => p.name === 'ana').muted, true);

  const unmuted = nextMessage(wsB, (x) => inRoom(x) && x.rooms['Voz geral'].find((p) => p.name === 'ana').muted === false);
  wsA.send(JSON.stringify({ type: 'voice-state', muted: false, sharing: false }));
  await unmuted;

  const left = nextMessage(wsB, (x) => x.type === 'voice' && !x.rooms['Voz geral']);
  wsA.send(JSON.stringify({ type: 'voice-leave' }));
  await left;
  wsB.close();
  wsA.close();
});

test('presença: fechar a aba tira a pessoa da sala', async () => {
  const wsA = await openWs((await login()).body.token);
  const wsB = await openWs((await login('bia', 'senha-da-bia-123')).body.token);
  const joined = nextMessage(wsB, (x) => x.type === 'voice' && (x.rooms['Voz geral'] || []).some((p) => p.name === 'ana'));
  wsA.send(JSON.stringify({ type: 'voice-join', room: 'Voz geral', muted: false, sharing: false }));
  await joined;
  const gone = nextMessage(wsB, (x) => x.type === 'voice' && !x.rooms['Voz geral']);
  wsA.close();
  await gone;
  wsB.close();
});
