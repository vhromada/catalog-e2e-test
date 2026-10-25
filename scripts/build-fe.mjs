import fs from 'node:fs/promises';
import './lib/env.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from './lib/run.mjs';

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const catalogFeDir = path.resolve(projectRoot, '..', 'catalog-fe');
const srcDist = path.join(catalogFeDir, 'dist');
const destDist = path.join(projectRoot, 'docker', 'fe', 'dist');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[build-fe] missing environment variable ${name} (set it in .env or .env.local)`);
  }
  return value;
}

const testConfig = {
  VITE_APP_CATALOG_URL: `${requireEnv('BE_BASE_URL')}/rest/`,
  VITE_APP_CATALOG_USERNAME: requireEnv('CATALOG_USERNAME'),
  VITE_APP_CATALOG_PASSWORD: requireEnv('CATALOG_PASSWORD'),
  VITE_APP_HASH_SALT: requireEnv('HASH_SALT'),
  VITE_APP_LOG_ENABLED: false,
  VITE_APP_LOG_CONSOLE_ENABLED: false,
  VITE_APP_ITEMS_PER_PAGE: Number(requireEnv('ITEMS_PER_PAGE')),
  VITE_APP_ALL_DATA_COUNT: 10000
};

console.log(`[build-fe] running npm run build in ${catalogFeDir}`);
run('npm', ['run', 'build'], { cwd: catalogFeDir });

console.log(`[build-fe] copying ${srcDist} -> ${destDist}`);
await fs.rm(destDist, { recursive: true, force: true });
await fs.cp(srcDist, destDist, { recursive: true });

const configPath = path.join(destDist, 'config.json');
await fs.writeFile(configPath, JSON.stringify(testConfig, null, 2));
console.log(`[build-fe] wrote test config.json to ${configPath}`);
