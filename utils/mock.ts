import type { Page } from '@playwright/test';

export async function mockResponse(page: Page, url: RegExp, method: string, status: number, body: unknown = {}): Promise<void> {
  await page.route(url, async (route) => {
    const request = route.request();
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': request.headers()['access-control-request-headers'] ?? '*',
      'access-control-allow-methods': '*'
    };
    if (request.method() === 'OPTIONS' && request.headers()['access-control-request-method'] === method) {
      await route.fulfill({status: 204, headers});
    } else if (request.method() === method) {
      await route.fulfill({status, headers, contentType: 'application/json', body: JSON.stringify(body)});
    } else {
      await route.fallback();
    }
  });
}
