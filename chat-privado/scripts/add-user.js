// Uso: npm run add-user -- <nome> <senha>
// Grava o usuário em config/users.json com a senha já em hash (scrypt).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../server/auth.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(ROOT, 'config', 'users.json');
const [name, password] = process.argv.slice(2);

if (!name || !password) {
  console.error('Uso: npm run add-user -- <nome> <senha>');
  process.exit(1);
}
if (!/^[a-z0-9_-]{2,20}$/.test(name)) {
  console.error('Nome: use de 2 a 20 caracteres, só letras minúsculas, números, _ e -.');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Senha: mínimo de 8 caracteres.');
  process.exit(1);
}

let users = [];
try {
  users = JSON.parse(await readFile(file, 'utf8'));
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}
if (users.some((u) => u.name === name)) {
  console.error(`Já existe um usuário "${name}". Apague a entrada em config/users.json antes de recriar.`);
  process.exit(1);
}
users.push({ name, passwordHash: hashPassword(password) });
await mkdir(dirname(file), { recursive: true });
await writeFile(file, JSON.stringify(users, null, 2) + '\n');
console.log(`Usuário "${name}" criado.`);
