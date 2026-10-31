import { Room, RoomEvent, Track, ConnectionQuality } from '/vendor/livekit-client.mjs';
import {
  SHARE_PRESETS,
  DEFAULT_PRESET,
  MAX_SIMULTANEOUS_SHARES,
  shareOptions,
  nextDegradeLevel,
  applyDegradation,
  countActiveShares,
} from '/quality.js';
import { sounds } from '/sounds.js';

const $ = (id) => document.getElementById(id);
const TOKEN_KEY = 'canal-token';
const LEVEL_TEXT = ['qualidade escolhida', 'qualidade reduzida', 'qualidade mínima'];

const state = {
  token: null,
  me: null,
  channels: { text: [], voice: [] },
  livekitUrl: null,
  presence: {}, // sala de voz -> [{ name, muted, sharing }], vindo do servidor
  textChannel: null,
  unread: new Map(),
  messages: [],
  ws: null,
  wsRetry: 1000,
  room: null,
  voiceChannel: null,
  view: 'text',
  // qualidade de transmissão
  sender: null,
  shareTimer: null,
  sharePreset: DEFAULT_PRESET,
  degradeLevel: 0,
  quality: null,
  qualitySince: Date.now(),
  autoDegrade: true,
  elements: new Map(), // sid -> { track, el }, reaproveitado entre renderizações
};

// ---------- utilidades ----------

function storage(op, value) {
  try {
    if (op === 'get') return localStorage.getItem(TOKEN_KEY);
    if (op === 'set') localStorage.setItem(TOKEN_KEY, value);
    if (op === 'del') localStorage.removeItem(TOKEN_KEY);
  } catch {
    // navegador sem armazenamento (modo privado): segue só com a sessão atual
  }
  return null;
}

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== '/api/login') logout();
    throw new Error(data.error || `Erro ${res.status}`);
  }
  return data;
}

function wsSend(obj) {
  if (state.ws?.readyState === WebSocket.OPEN) state.ws.send(JSON.stringify(obj));
}

function setStatus(text) {
  $('status').textContent = text;
}

function setVoiceMsg(text) {
  $('voice-msg').textContent = text;
}

// ---------- login ----------

async function login(form) {
  $('login-error').textContent = '';
  try {
    const { token } = await api('/api/login', {
      method: 'POST',
      body: { name: form.name.value, password: form.password.value },
    });
    state.token = token;
    storage('set', token);
    form.password.value = '';
    await boot();
  } catch (err) {
    $('login-error').textContent = err.message;
  }
}

function logout() {
  leaveVoice();
  if (state.ws) state.ws.onclose = null;
  state.ws?.close();
  state.ws = null;
  state.token = null;
  storage('del');
  $('app').hidden = true;
  $('login').hidden = false;
}

async function boot() {
  const config = await api('/api/config');
  state.me = config.name;
  state.channels = config.channels;
  state.livekitUrl = config.livekitUrl;
  $('login').hidden = true;
  $('app').hidden = false;
  $('me-name').textContent = state.me;
  fillQualityOptions();
  renderChannels();
  connectChat();
  selectText(state.channels.text[0]);
}

// ---------- canais ----------

function renderChannels() {
  const textList = $('text-channels');
  const voiceList = $('voice-channels');
  textList.replaceChildren();
  voiceList.replaceChildren();

  for (const name of state.channels.text) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.text = name;
    btn.textContent = `# ${name}`;
    btn.addEventListener('click', () => selectText(name));
    li.append(btn);
    textList.append(li);
  }

  for (const name of state.channels.voice) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.voice = name;
    btn.textContent = `🔊 ${name}`;
    btn.addEventListener('click', () => joinVoice(name));
    li.append(btn);

    const people = state.presence[name] || [];
    if (people.length) {
      const ul = document.createElement('ul');
      ul.className = 'people';
      for (const p of people) {
        const item = document.createElement('li');
        item.textContent = p.name === state.me ? `${p.name} (você)` : p.name;
        if (p.name === state.me) item.classList.add('me');
        if (p.sharing) item.textContent += ' · 🖥';
        if (p.muted) item.textContent += ' · 🔇';
        ul.append(item);
      }
      li.append(ul);
    }
    voiceList.append(li);
  }
  markActive();
}

function markActive() {
  for (const btn of document.querySelectorAll('[data-text]')) {
    const name = btn.dataset.text;
    const unread = state.unread.get(name) || 0;
    btn.classList.toggle('active', state.view === 'text' && name === state.textChannel);
    btn.textContent = `# ${name}`;
    if (unread > 0 && name !== state.textChannel) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = String(unread);
      btn.append(badge);
    }
  }
  for (const btn of document.querySelectorAll('[data-voice]')) {
    const name = btn.dataset.voice;
    btn.classList.toggle('active', state.view === 'voice' && name === state.voiceChannel);
    btn.classList.toggle('connected', !!state.room && name === state.voiceChannel);
  }
  $('back-to-voice').hidden = !(state.room && state.view === 'text');
}

function showView(view) {
  state.view = view;
  $('text-view').hidden = view !== 'text';
  $('voice-view').hidden = view !== 'voice';
  if (view === 'voice') $('channel-title').textContent = `🔊 ${state.voiceChannel}`;
  else $('channel-title').textContent = `# ${state.textChannel ?? ''}`;
  markActive();
}

function selectText(name) {
  if (!name) return;
  state.textChannel = name;
  state.unread.delete(name);
  state.messages = [];
  $('messages').replaceChildren();
  showView('text');
  requestHistory();
  $('message-input').focus();
}

// ---------- chat de texto e presença ----------

function connectChat() {
  if (state.ws) return;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws?token=${encodeURIComponent(state.token)}`);
  state.ws = ws;
  ws.onopen = () => {
    state.wsRetry = 1000;
    setStatus('');
    requestHistory();
    // se a conexão caiu durante a chamada, avisa o servidor de novo
    if (state.room) sendVoiceJoin();
  };
  ws.onmessage = (ev) => onChatMessage(JSON.parse(ev.data));
  ws.onclose = () => {
    state.ws = null;
    if (!state.token) return;
    setStatus('Chat desconectado. Reconectando...');
    setTimeout(connectChat, state.wsRetry);
    state.wsRetry = Math.min(state.wsRetry * 2, 15000);
  };
}

function requestHistory() {
  if (state.textChannel) wsSend({ type: 'history', channel: state.textChannel });
}

function onChatMessage(msg) {
  if (msg.type === 'voice') {
    state.presence = msg.rooms;
    renderChannels();
    return;
  }
  if (msg.type === 'history') {
    if (msg.channel !== state.textChannel) return;
    state.messages = msg.messages;
    $('messages').replaceChildren(...msg.messages.map(renderMessage));
    scrollMessages(true);
  } else if (msg.type === 'message') {
    const m = msg.message;
    if (m.channel === state.textChannel && state.view === 'text') {
      const box = $('messages');
      const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
      box.append(renderMessage(m));
      scrollMessages(nearBottom || m.from === state.me);
    } else {
      state.unread.set(m.channel, (state.unread.get(m.channel) || 0) + 1);
      markActive();
    }
  } else if (msg.type === 'error') {
    setStatus(msg.error);
    setTimeout(() => setStatus(''), 4000);
  }
}

function renderMessage(m) {
  const wrap = document.createElement('div');
  wrap.className = 'msg';
  const meta = document.createElement('div');
  meta.className = 'meta';
  const who = document.createElement('b');
  who.textContent = m.from;
  const when = document.createElement('span');
  when.textContent = new Date(m.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  meta.append(who, when);
  const text = document.createElement('p');
  text.textContent = m.text;
  wrap.append(meta, text);
  return wrap;
}

function scrollMessages(force) {
  const box = $('messages');
  if (force) box.scrollTop = box.scrollHeight;
}

// ---------- voz e tela ----------

function fillQualityOptions() {
  const select = $('quality');
  if (select.options.length) return;
  for (const [key, p] of Object.entries(SHARE_PRESETS)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = p.label;
    if (key === DEFAULT_PRESET) opt.selected = true;
    select.append(opt);
  }
}

function micOn() {
  return !!state.room?.localParticipant.isMicrophoneEnabled;
}

function isSharing() {
  return !!state.room?.localParticipant.getTrackPublication(Track.Source.ScreenShare)?.track;
}

function sendVoiceJoin() {
  wsSend({ type: 'voice-join', room: state.voiceChannel, muted: !micOn(), sharing: isSharing() });
}

function sendVoiceState() {
  if (state.room) wsSend({ type: 'voice-state', muted: !micOn(), sharing: isSharing() });
}

async function joinVoice(name) {
  if (state.room) await leaveVoice();
  setVoiceMsg('Conectando...');
  try {
    const { token, url } = await api('/api/voice-token', { method: 'POST', body: { room: name } });
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true },
      videoCaptureDefaults: { resolution: { width: 1280, height: 720, frameRate: 30 } },
    });
    state.room = room;
    state.voiceChannel = name;
    bindRoomEvents(room);
    await room.connect(url || state.livekitUrl, token);
    try {
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch {
      setVoiceMsg('Sem acesso ao microfone. Você entrou só para ouvir.');
    }
    showView('voice');
    renderVoice();
    updateControls();
    sendVoiceJoin();
    sounds.join();
    if (!$('voice-msg').textContent.startsWith('Sem acesso')) setVoiceMsg('');
  } catch (err) {
    await leaveVoice();
    setVoiceMsg(`Não consegui entrar: ${err.message}`);
  }
}

function bindRoomEvents(room) {
  const rerender = () => {
    renderVoice();
    updateControls();
  };
  room
    .on(RoomEvent.ParticipantConnected, () => {
      sounds.peerJoin();
      rerender();
    })
    .on(RoomEvent.ParticipantDisconnected, () => {
      sounds.peerLeave();
      rerender();
    })
    .on(RoomEvent.TrackSubscribed, rerender)
    .on(RoomEvent.TrackUnsubscribed, rerender)
    .on(RoomEvent.TrackPublished, rerender)
    .on(RoomEvent.TrackUnpublished, rerender)
    .on(RoomEvent.LocalTrackPublished, onLocalShareChange)
    .on(RoomEvent.LocalTrackUnpublished, onLocalShareChange)
    .on(RoomEvent.ActiveSpeakersChanged, updateSpeaking)
    .on(RoomEvent.ConnectionQualityChanged, onConnectionQuality)
    .on(RoomEvent.Disconnected, () => {
      wsSend({ type: 'voice-leave' });
      cleanupVoice();
      setVoiceMsg('Você saiu da chamada.');
    });
}

function onLocalShareChange(pub) {
  if (pub?.source === Track.Source.ScreenShare) {
    if (pub.track) {
      state.degradeLevel = 0;
      state.qualitySince = Date.now();
      state.sender = pub.track.sender ?? null;
      startShareMonitor();
    } else {
      stopShareMonitor();
      state.sender = null;
      state.degradeLevel = 0;
    }
  }
  renderVoice();
  updateControls();
  sendVoiceState();
}

// Renderiza só o que muda: vídeos e áudios são reaproveitados pelo id da faixa.
function renderVoice() {
  const r = state.room;
  if (!r) return;
  const stage = $('stage');
  const sink = $('audio-sink');
  const participants = [r.localParticipant, ...r.remoteParticipants.values()];
  const wanted = new Set();
  const tiles = [];

  for (const p of participants) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.identity = p.identity;
    const label = document.createElement('span');
    label.className = 'label';
    const micPub = p.getTrackPublication(Track.Source.Microphone);
    const micOff = !micPub || micPub.isMuted;
    label.textContent = `${p.isLocal ? 'Você' : p.identity}${micOff ? ' · mudo' : ''}`;

    let hasVideo = false;
    for (const source of [Track.Source.ScreenShare, Track.Source.Camera]) {
      const pub = p.getTrackPublication(source);
      if (!pub?.track || pub.isMuted) continue;
      if (source === Track.Source.ScreenShare) tile.classList.add('screen');
      const el = pubElement(pub.track, p.isLocal);
      wanted.add(pub.trackSid);
      if (el.parentElement !== tile) tile.append(el);
      hasVideo = true;
      if (source === Track.Source.ScreenShare) break;
    }
    if (!hasVideo) {
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = p.identity.slice(0, 1).toUpperCase();
      tile.append(avatar);
    }
    tile.append(label);
    tiles.push(tile);

    // Áudio dos outros participantes (o seu não é reproduzido, para evitar eco).
    for (const source of [Track.Source.Microphone, Track.Source.ScreenShareAudio]) {
      const pub = p.getTrackPublication(source);
      if (!pub?.track || p.isLocal) continue;
      const el = pubElement(pub.track, false);
      wanted.add(pub.trackSid);
      if (el.parentElement !== sink) sink.append(el);
    }
  }

  // Transmissão de tela primeiro.
  tiles.sort((a, b) => Number(b.classList.contains('screen')) - Number(a.classList.contains('screen')));
  stage.replaceChildren(...tiles);
  updateSpeaking();

  // Libera o que não existe mais (faixa saiu ou participante foi embora).
  for (const sid of [...state.elements.keys()]) {
    if (!wanted.has(sid)) releaseElement(sid);
  }
}

function pubElement(track, isLocal) {
  const sid = track.sid;
  let entry = state.elements.get(sid);
  if (!entry) {
    const el = track.attach();
    el.playsInline = true;
    if (track.kind === Track.Kind.Video || isLocal) el.muted = true;
    entry = { track, el };
    state.elements.set(sid, entry);
  }
  return entry.el;
}

function releaseElement(sid) {
  const entry = state.elements.get(sid);
  if (!entry) return;
  entry.track.detach(entry.el);
  entry.el.remove();
  state.elements.delete(sid);
}

function updateSpeaking() {
  const r = state.room;
  if (!r) return;
  for (const tile of document.querySelectorAll('.tile')) {
    const id = tile.dataset.identity;
    const p = id === r.localParticipant.identity ? r.localParticipant : r.remoteParticipants.get(id);
    tile.classList.toggle('speaking', !!p?.isSpeaking);
  }
}

function updateControls() {
  const r = state.room;
  const inVoice = !!r;
  const lp = r?.localParticipant;
  $('btn-mic').textContent = micOn() ? 'Microfone ligado' : 'Microfone desligado';
  $('btn-mic').setAttribute('aria-pressed', String(micOn()));
  $('btn-cam').textContent = lp?.isCameraEnabled ? 'Câmera ligada' : 'Câmera desligada';
  $('btn-cam').setAttribute('aria-pressed', String(!!lp?.isCameraEnabled));
  $('btn-share').textContent = isSharing() ? 'Parar de compartilhar' : 'Compartilhar tela';
  $('btn-share').setAttribute('aria-pressed', String(isSharing()));
  for (const id of ['btn-leave', 'btn-mic', 'btn-cam', 'btn-share']) $(id).disabled = !inVoice;
  $('voice-panel').hidden = !inVoice;
  $('voice-panel-channel').textContent = inVoice ? state.voiceChannel : '';
  markActive();
}

async function toggleMic() {
  const lp = state.room?.localParticipant;
  if (!lp) return;
  try {
    await lp.setMicrophoneEnabled(!lp.isMicrophoneEnabled);
  } catch (err) {
    setVoiceMsg(`Microfone: ${err.message}`);
  }
  updateControls();
  renderVoice();
  sendVoiceState();
}

async function toggleCam() {
  const lp = state.room?.localParticipant;
  if (!lp) return;
  try {
    await lp.setCameraEnabled(!lp.isCameraEnabled);
  } catch (err) {
    setVoiceMsg(`Câmera: ${err.message}`);
  }
  updateControls();
  renderVoice();
}

async function toggleShare() {
  const lp = state.room?.localParticipant;
  if (!lp) return;
  if (isSharing()) {
    await lp.setScreenShareEnabled(false);
    return;
  }
  // Limite de transmissões simultâneas, contando você e os outros.
  const everyone = [lp, ...state.room.remoteParticipants.values()];
  const active = countActiveShares(everyone.map((p) => ({ hasScreenShare: !!p.getTrackPublication(Track.Source.ScreenShare)?.track })));
  if (active >= MAX_SIMULTANEOUS_SHARES) {
    setVoiceMsg(`Já tem ${MAX_SIMULTANEOUS_SHARES} telas sendo compartilhadas. Espera uma terminar.`);
    return;
  }
  const preset = $('quality').value;
  state.sharePreset = preset;
  const audio = $('share-audio').checked;
  const { captureOptions, publishOptions } = shareOptions(preset, { audio });
  try {
    await lp.setScreenShareEnabled(true, captureOptions, publishOptions);
    setVoiceMsg(`Transmitindo em ${SHARE_PRESETS[preset].label}.`);
  } catch (err) {
    // cancelar o seletor de tela do navegador gera NotAllowedError: não é erro para mostrar
    if (err?.name !== 'NotAllowedError') setVoiceMsg(`Não consegui compartilhar: ${err.message}`);
  }
  updateControls();
}

// ---------- qualidade adaptativa da transmissão ----------

function onConnectionQuality(quality, participant) {
  if (!participant?.isLocal) return;
  state.quality = quality;
  state.qualitySince = Date.now();
}

function startShareMonitor() {
  stopShareMonitor();
  state.shareTimer = setInterval(checkShareQuality, 3000);
}

function stopShareMonitor() {
  clearInterval(state.shareTimer);
  state.shareTimer = null;
}

async function checkShareQuality() {
  const lp = state.room?.localParticipant;
  const pub = lp?.getTrackPublication(Track.Source.ScreenShare);
  if (!pub?.track) return stopShareMonitor();
  state.sender = pub.track.sender ?? state.sender;
  if (!state.autoDegrade || !state.sender) return;

  const goodSeconds =
    state.quality === ConnectionQuality.Excellent || state.quality === ConnectionQuality.Good
      ? (Date.now() - state.qualitySince) / 1000
      : 0;
  const next = nextDegradeLevel(state.degradeLevel, state.quality ?? 'unknown', goodSeconds);
  if (next === state.degradeLevel) return;

  state.degradeLevel = next;
  await applyDegradation(state.sender, state.sharePreset, next);
  setVoiceMsg(`Rede instável: ${LEVEL_TEXT[next]}.`);
}

// ---------- saída ----------

function cleanupVoice() {
  stopShareMonitor();
  for (const sid of [...state.elements.keys()]) releaseElement(sid);
  $('stage').replaceChildren();
  $('audio-sink').replaceChildren();
  state.room = null;
  state.voiceChannel = null;
  state.sender = null;
  state.degradeLevel = 0;
  if (state.view === 'voice') showView('text');
  updateControls();
}

async function leaveVoice() {
  const r = state.room;
  if (!r) return;
  sounds.leave();
  wsSend({ type: 'voice-leave' });
  cleanupVoice();
  await r.disconnect().catch(() => {});
}

// ---------- eventos da interface ----------

$('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  login(e.currentTarget);
});
$('logout').addEventListener('click', logout);
$('composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('message-input');
  const text = input.value.trim();
  if (!text || !state.textChannel || state.ws?.readyState !== WebSocket.OPEN) return;
  state.ws.send(JSON.stringify({ type: 'send', channel: state.textChannel, text }));
  input.value = '';
});
$('btn-mic').addEventListener('click', toggleMic);
$('btn-cam').addEventListener('click', toggleCam);
$('btn-share').addEventListener('click', toggleShare);
$('btn-leave').addEventListener('click', leaveVoice);
$('panel-leave').addEventListener('click', leaveVoice);
$('back-to-voice').addEventListener('click', () => showView('voice'));
$('quality').addEventListener('change', () => setVoiceMsg('A nova qualidade vale na próxima transmissão.'));

// ---------- início ----------

state.token = storage('get');
if (state.token) {
  boot().catch(() => {
    state.token = null;
    storage('del');
    $('login').hidden = false;
  });
} else {
  $('login').hidden = false;
}
