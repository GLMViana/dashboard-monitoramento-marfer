// Uso: npm run add-user -- <nome>
// Libera um nome para entrar no app (sem senha). Grava em config/users.json.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(ROOT, 'config', 'users.json');
const [name] = process.argv.slice(2);

if (!name) {
  console.error('Uso: npm run add-user -- <nome>');
  process.exit(1);
}
if (!/^[a-z0-9_-]{2,20}$/.test(name)) {
  console.error('Nome: use de 2 a 20 caracteres, só letras minúsculas, números, _ e -.');
  process.exit(1);
}

let users = [];
try {
  users = JSON.parse(await readFile(file, 'utf8'));
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}
if (users.some((u) => u.name === name)) {
  console.error(`O nome "${name}" já está liberado.`);
  process.exit(1);
}
users.push({ name });
await mkdir(dirname(file), { recursive: true });
await writeFile(file, JSON.stringify(users, null, 2) + '\n');
console.log(`Nome "${name}" liberado para entrar.`);
