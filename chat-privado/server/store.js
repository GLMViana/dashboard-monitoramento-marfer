import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

// Histórico de chat em JSON Lines (um registro por linha).
// Simples de propósito: para um grupo pequeno, ler o arquivo basta.
export function createMessageStore(file) {
  return {
    async append(message) {
      await mkdir(dirname(file), { recursive: true });
      await appendFile(file, JSON.stringify(message) + '\n', 'utf8');
    },
    async recent(channel, limit = 100) {
      let raw;
      try {
        raw = await readFile(file, 'utf8');
      } catch (err) {
        if (err.code === 'ENOENT') return [];
        throw err;
      }
      const out = [];
      const lines = raw.split('\n');
      for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
        if (!lines[i]) continue;
        try {
          const msg = JSON.parse(lines[i]);
          if (msg.channel === channel) out.push(msg);
        } catch {
          // linha corrompida: ignora
        }
      }
      return out.reverse();
    },
  };
}
