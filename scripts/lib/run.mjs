import { spawnSync } from 'node:child_process';

export function run(command, args, options = {}) {
  const [file, fileArgs] = process.platform === 'win32' ? ['cmd.exe', ['/c', command, ...args]] : [command, args];
  const result = spawnSync(file, fileArgs, {
    stdio: 'inherit',
    ...options
  });
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${command} ${args.join(' ')}`);
  }
}
