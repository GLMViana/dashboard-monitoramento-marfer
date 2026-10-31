// Lógica de qualidade da transmissão de tela. Sem DOM, para dar pra testar no Node.

// maxBitrate em bits por segundo. São valores de referência: ajuste conforme o uso.
export const SHARE_PRESETS = {
  '720p30': { label: '720p · 30 fps', width: 1280, height: 720, frameRate: 30, maxBitrate: 2_500_000 },
  '1080p30': { label: '1080p · 30 fps', width: 1920, height: 1080, frameRate: 30, maxBitrate: 5_000_000 },
  '1080p60': { label: '1080p · 60 fps', width: 1920, height: 1080, frameRate: 60, maxBitrate: 8_000_000 },
  '1440p60': { label: '1440p · 60 fps', width: 2560, height: 1440, frameRate: 60, maxBitrate: 12_000_000 },
  '2160p30': { label: '4K · 30 fps', width: 3840, height: 2160, frameRate: 30, maxBitrate: 15_000_000 },
  '2160p60': { label: '4K · 60 fps', width: 3840, height: 2160, frameRate: 60, maxBitrate: 20_000_000 },
};

export const DEFAULT_PRESET = '1080p30';
export const MAX_SIMULTANEOUS_SHARES = 3;

// Passos de degradação: nível 0 é a qualidade escolhida, os seguintes reduzem bitrate e resolução.
export const DEGRADE_STEPS = [
  { bitrateFactor: 1, scaleDown: 1 },
  { bitrateFactor: 0.5, scaleDown: 1 },
  { bitrateFactor: 0.25, scaleDown: 2 },
];

// Segundos de conexão boa antes de voltar um nível (evita oscilar).
export const RECOVER_AFTER_SECONDS = 15;

export function presetOrDefault(key) {
  return SHARE_PRESETS[key] ? key : DEFAULT_PRESET;
}

// Opções para setScreenShareEnabled do livekit-client.
export function shareOptions(key, { audio = false } = {}) {
  const p = SHARE_PRESETS[presetOrDefault(key)];
  return {
    captureOptions: {
      audio,
      resolution: { width: p.width, height: p.height, frameRate: p.frameRate },
    },
    publishOptions: {
      simulcast: false,
      screenShareEncoding: { maxBitrate: p.maxBitrate, maxFramerate: p.frameRate },
    },
  };
}

// Decide o próximo nível de degradação a partir da qualidade reportada pelo LiveKit.
// quality: 'excellent' | 'good' | 'poor' | 'lost' | 'unknown'
// goodSeconds: há quantos segundos a conexão está boa de forma contínua.
export function nextDegradeLevel(level, quality, goodSeconds) {
  const max = DEGRADE_STEPS.length - 1;
  if (quality === 'poor' || quality === 'lost') return Math.min(level + 1, max);
  if ((quality === 'excellent' || quality === 'good') && level > 0 && goodSeconds >= RECOVER_AFTER_SECONDS) {
    return level - 1;
  }
  return level;
}

// Aplica o nível no RTCRtpSender sem reabrir a seleção de tela.
export async function applyDegradation(sender, presetKey, level) {
  if (!sender) return false;
  const p = SHARE_PRESETS[presetOrDefault(presetKey)];
  const step = DEGRADE_STEPS[Math.min(level, DEGRADE_STEPS.length - 1)];
  const params = sender.getParameters();
  if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
  const enc = params.encodings[0];
  enc.maxBitrate = Math.round(p.maxBitrate * step.bitrateFactor);
  enc.scaleResolutionDownBy = step.scaleDown;
  await sender.setParameters(params);
  return true;
}

// Conta quantas transmissões de tela existem na sala (inclusive a sua).
export function countActiveShares(participants) {
  return participants.filter((p) => p.hasScreenShare).length;
}
