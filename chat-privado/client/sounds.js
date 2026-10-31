// Sons curtos gerados com Web Audio: não precisa baixar arquivo nenhum.
let ctx = null;

function getContext() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null; // navegador sem áudio: segue sem som
  }
}

// notes: [frequência em Hz, início em s, duração em s]
function playTones(notes, volume = 0.12) {
  const c = getContext();
  if (!c) return;
  const t0 = c.currentTime;
  for (const [freq, start, dur] of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t0 + start);
    gain.gain.linearRampToValueAtTime(volume, t0 + start + 0.01);
    gain.gain.linearRampToValueAtTime(0, t0 + start + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0 + start);
    osc.stop(t0 + start + dur + 0.02);
  }
}

export const sounds = {
  join: () => playTones([[523, 0, 0.12], [784, 0.12, 0.18]]), // sobe: você entrou
  leave: () => playTones([[784, 0, 0.12], [523, 0.12, 0.18]]), // desce: você saiu
  peerJoin: () => playTones([[880, 0, 0.09]], 0.08), // alguém entrou
  peerLeave: () => playTones([[440, 0, 0.09]], 0.08), // alguém saiu
};
