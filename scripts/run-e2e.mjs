import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from './lib/run.mjs';

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const composeFile = path.join(projectRoot, 'docker', 'compose.yaml');

function dockerCompose(args) {
  run('docker', ['compose', '-f', composeFile, ...args], { cwd: projectRoot });
}

let testExitError;
try {
  run('node', ['scripts/build-be.mjs'], { cwd: projectRoot });
  run('node', ['scripts/build-fe.mjs'], { cwd: projectRoot });
  dockerCompose(['build']);
  dockerCompose(['up', '-d']);
  run('node', ['scripts/wait-for-health.mjs'], { cwd: projectRoot });
  run('npx', ['playwright', 'test'], { cwd: projectRoot });
} catch (error) {
  testExitError = error;
} finally {
  console.log('[run-e2e] tearing down docker stack');
  try {
    dockerCompose(['down', '-v']);
  } catch (teardownError) {
    console.error('[run-e2e] teardown failed', teardownError);
  }
}

if (testExitError) {
  console.error('[run-e2e] failed:', testExitError.message);
  process.exit(1);
}
