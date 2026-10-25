import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from './lib/run.mjs';

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const catalogBeDir = path.resolve(projectRoot, '..', 'catalog-be');

const gradlew = path.join(catalogBeDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

console.log(`[build-be] running ${gradlew} bootJar`);
run(gradlew, ['bootJar'], { cwd: catalogBeDir });
console.log('[build-be] done');
