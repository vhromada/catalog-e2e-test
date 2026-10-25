import './lib/env.mjs';

const BE_HEALTH_URL = `${process.env.BE_BASE_URL ?? 'http://localhost:8110'}/app/health`;
const FE_URL = process.env.FE_BASE_URL ?? 'http://localhost:8010';
const TIMEOUT_MS = 120_000;
const INTERVAL_MS = 2_000;

async function waitFor(name, url, isReady) {
  const deadline = Date.now() + TIMEOUT_MS;
  for (; ;) {
    try {
      const response = await fetch(url);
      if (await isReady(response)) {
        console.log(`[wait] ${name} is ready (${url})`);
        return;
      }
    } catch {
      // not up yet, keep polling
    }
    if (Date.now() > deadline) {
      throw new Error(`[wait] timed out waiting for ${name} at ${url}`);
    }
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
}

await waitFor('catalog-be', BE_HEALTH_URL, async (response) => {
  if (!response.ok) {
    return false;
  }
  const body = await response.json();
  return body.status === 'UP';
});

await waitFor('catalog-fe', FE_URL, async (response) => response.ok);
