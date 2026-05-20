import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export default async function globalSetup() {
  const root = resolve(__dirname, '..', '..');
  try {
    execFileSync(
      'docker',
      ['compose', 'exec', '-T', '-e', 'SCICONNECT_FORCE_DEMO_SITE=1', 'backend', 'sh', '-c', 'cd /srv/backend/app && python seed_demo.py'],
      {
      cwd: root,
      stdio: 'inherit',
    });
  } catch (err) {
    console.warn('Не удалось выполнить seed_demo.py перед E2E. Проверьте, что docker compose stack запущен.');
    throw err;
  }
}
