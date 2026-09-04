import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

const WORKER_PATH = new URL('../public/sw.js', import.meta.url);
const EXPECTED_CACHE_NAME = 'couple-finance-v3';
const ASSETS = ['/manifest.json', '/icon-192.png', '/icon-512.png', '/favicon.ico'];

function createWorkerHarness() {
  const listeners = new Map();
  const cacheOperations = { opened: [], added: [], deleted: [] };
  const cacheKeys = ['couple-finance-v1', EXPECTED_CACHE_NAME, 'couple-finance-v2'];
  const lifecycle = { skippedWaiting: 0, claimed: 0 };
  const cache = {
    addAll: async (urls) => cacheOperations.added.push([...urls]),
  };
  const caches = {
    open: async (name) => {
      cacheOperations.opened.push(name);
      return cache;
    },
    keys: async () => [...cacheKeys],
    delete: async (name) => {
      cacheOperations.deleted.push(name);
      return true;
    },
    match: async () => undefined,
  };
  const self = {
    addEventListener: (type, handler) => listeners.set(type, handler),
    skipWaiting: () => { lifecycle.skippedWaiting += 1; },
    clients: { claim: () => { lifecycle.claimed += 1; } },
    location: { origin: 'https://couple-finance.test' },
  };
  const context = vm.createContext({
    URL,
    caches,
    fetch: async () => ({ ok: true }),
    self,
  });

  return readFile(WORKER_PATH, 'utf8').then((source) => {
    new vm.Script(source, { filename: WORKER_PATH.pathname }).runInContext(context);
    return { listeners, cacheOperations, cacheKeys, lifecycle };
  });
}

function request(url, options = {}) {
  const headers = new Map(
    Object.entries(options.headers ?? {}).map(([name, value]) => [name.toLowerCase(), value]),
  );
  return {
    url,
    mode: options.mode ?? 'same-origin',
    method: options.method ?? 'GET',
    headers: {
      get: (name) => headers.get(name.toLowerCase()) ?? null,
      has: (name) => headers.has(name.toLowerCase()),
    },
  };
}

async function dispatchFetch(worker, fetchRequest) {
  const event = {
    request: fetchRequest,
    respondWithCalled: false,
    respondWith: () => { event.respondWithCalled = true; },
  };
  worker.listeners.get('fetch')(event);
  return event.respondWithCalled;
}

test('cache lifecycle uses v3 and removes old caches', async () => {
  // Given: the worker is loaded with cache and lifecycle API doubles.
  const worker = await createWorkerHarness();

  // When: install and activate events run to completion.
  const installWaits = [];
  worker.listeners.get('install')({ waitUntil: (promise) => installWaits.push(promise) });
  await Promise.all(installWaits);
  const activateWaits = [];
  worker.listeners.get('activate')({ waitUntil: (promise) => activateWaits.push(promise) });
  await Promise.all(activateWaits);

  // Then: v3 is populated, old keys are deleted, and lifecycle hooks run.
  assert.deepEqual(worker.cacheOperations.opened, [EXPECTED_CACHE_NAME]);
  assert.deepEqual(worker.cacheOperations.added, [ASSETS]);
  assert.deepEqual(worker.cacheOperations.deleted, ['couple-finance-v1', 'couple-finance-v2']);
  assert.equal(worker.lifecycle.skippedWaiting, 1);
  assert.equal(worker.lifecycle.claimed, 1);
});

test('fetch only intercepts explicit precached assets', async (t) => {
  const cases = [
    ['navigation GET', request('https://couple-finance.test/', { mode: 'navigate' }), false],
    ['same-origin API GET', request('https://couple-finance.test/api/report'), false],
    ['Supabase REST GET', request('https://ieahmpxiaamesrnfgbng.supabase.co/rest/v1/transactions'), false],
    ['Supabase PATCH', request('https://ieahmpxiaamesrnfgbng.supabase.co/rest/v1/transactions/1', { method: 'PATCH' }), false],
    ['RSC query', request('https://couple-finance.test/?_rsc=abc'), false],
    ['RSC header', request('https://couple-finance.test/dashboard', { headers: { RSC: '1' } }), false],
    ['Next action POST', request('https://couple-finance.test/dashboard', { method: 'POST', headers: { 'Next-Action': 'abc' } }), false],
    ['arbitrary static asset', request('https://couple-finance.test/_next/static/chunk.js'), false],
    ...ASSETS.map((asset) => [asset, request(`https://couple-finance.test${asset}`), true]),
  ];

  for (const [name, fetchRequest, expected] of cases) {
    await t.test(name, async () => {
      // Given: a realistic Request-like fetch event for one request class.
      const worker = await createWorkerHarness();

      // When: the worker receives the fetch event.
      const intercepted = await dispatchFetch(worker, fetchRequest);

      // Then: only explicit precached assets are intercepted.
      assert.equal(intercepted, expected);
    });
  }
});
