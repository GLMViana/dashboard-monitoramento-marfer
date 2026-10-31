import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SHARE_PRESETS,
  DEGRADE_STEPS,
  RECOVER_AFTER_SECONDS,
  shareOptions,
  nextDegradeLevel,
  applyDegradation,
  countActiveShares,
  presetOrDefault,
} from '../client/quality.js';

test('presets têm resolução e bitrate crescentes com a qualidade', () => {
  const order = ['720p30', '1080p30', '1080p60', '1440p60', '2160p30', '2160p60'];
  for (let i = 1; i < order.length; i++) {
    const a = SHARE_PRESETS[order[i - 1]];
    const b = SHARE_PRESETS[order[i]];
    assert.ok(b.width * b.height >= a.width * a.height, `${order[i]} não é maior que ${order[i - 1]}`);
    assert.ok(b.maxBitrate >= a.maxBitrate, `bitrate de ${order[i]} caiu`);
  }
});

test('shareOptions monta captura e encoding do preset escolhido', () => {
  const opts = shareOptions('2160p60', { audio: true });
  assert.equal(opts.captureOptions.resolution.width, 3840);
  assert.equal(opts.captureOptions.resolution.frameRate, 60);
  assert.equal(opts.captureOptions.audio, true);
  assert.equal(opts.publishOptions.screenShareEncoding.maxBitrate, 20_000_000);
  assert.equal(opts.publishOptions.screenShareEncoding.maxFramerate, 60);
});

test('preset desconhecido cai no padrão', () => {
  assert.equal(presetOrDefault('lixo'), '1080p30');
  assert.equal(shareOptions('lixo').captureOptions.resolution.height, 1080);
});

test('conexão ruim sobe o nível de degradação até o máximo', () => {
  let level = 0;
  for (let i = 0; i < 10; i++) level = nextDegradeLevel(level, 'poor', 0);
  assert.equal(level, DEGRADE_STEPS.length - 1);
  assert.equal(nextDegradeLevel(0, 'lost', 0), 1);
});

test('conexão boa só recupera depois do tempo de estabilidade', () => {
  assert.equal(nextDegradeLevel(2, 'good', RECOVER_AFTER_SECONDS - 1), 2);
  assert.equal(nextDegradeLevel(2, 'excellent', RECOVER_AFTER_SECONDS), 1);
  assert.equal(nextDegradeLevel(0, 'excellent', 999), 0);
});

test('qualidade desconhecida não muda o nível', () => {
  assert.equal(nextDegradeLevel(1, 'unknown', 999), 1);
});

test('applyDegradation reduz bitrate e resolução no sender', async () => {
  let saved;
  const sender = {
    getParameters: () => ({ encodings: [{ maxBitrate: 1 }] }),
    setParameters: async (p) => (saved = p),
  };
  await applyDegradation(sender, '1080p60', 2);
  assert.equal(saved.encodings[0].maxBitrate, Math.round(8_000_000 * 0.25));
  assert.equal(saved.encodings[0].scaleResolutionDownBy, 2);
});

test('applyDegradation sem sender não faz nada', async () => {
  assert.equal(await applyDegradation(undefined, '1080p30', 1), false);
});

test('countActiveShares conta só quem está transmitindo', () => {
  const list = [{ hasScreenShare: true }, { hasScreenShare: false }, { hasScreenShare: true }];
  assert.equal(countActiveShares(list), 2);
});
