import test from 'node:test';
import assert from 'node:assert/strict';
import { getApproximateLocation } from './approximateLocation.js';

const fallback = { latitude: '17.686800', longitude: '83.218500', source: 'fallback' };

test('IP lookup returns approximate coordinates without cookies or a referrer', async () => {
  const result = await getApproximateLocation({ fetchImpl: async (url, options) => {
    assert.equal(url, 'https://ipapi.co/json/');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.referrerPolicy, 'no-referrer');
    assert.ok(options.signal);
    return { ok: true, json: async () => ({ latitude: 12.9716, longitude: 77.5946 }) };
  } });
  assert.deepEqual(result, { latitude: '12.971600', longitude: '77.594600', source: 'approximate' });
});

test('network errors, rate limits and malformed JSON fall back to Visakhapatnam', async () => {
  for (const fetchImpl of [
    async () => { throw new Error('Offline'); },
    async () => ({ ok: false, status: 429 }),
    async () => ({ ok: true, json: async () => { throw new Error('Bad JSON'); } }),
  ]) assert.deepEqual(await getApproximateLocation({ fetchImpl }), fallback);
});

test('missing, invalid and out-of-range coordinates never become a false location', async () => {
  for (const data of [ {}, { latitude: null, longitude: null }, { latitude: '', longitude: ' ' },
    { latitude: true, longitude: false }, { latitude: 91, longitude: 83 },
    { latitude: 17, longitude: 181 }, { latitude: 'bad', longitude: 83 },
    { error: true, latitude: 17, longitude: 83 },
  ]) assert.deepEqual(await getApproximateLocation({ fetchImpl: async () => ({ ok: true, json: async () => data }) }), fallback);
});

test('zero coordinates remain a valid approximate location', async () => {
  const result = await getApproximateLocation({ fetchImpl: async () => ({ ok: true, json: async () => ({ latitude: 0, longitude: 0 }) }) });
  assert.deepEqual(result, { latitude: '0.000000', longitude: '0.000000', source: 'approximate' });
});

test('slow lookup is aborted and falls back', async () => {
  let aborted = false;
  const result = await getApproximateLocation({ timeoutMs: 5, fetchImpl: (url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => { aborted = true; reject(new Error('Aborted')); }, { once: true });
  }) });
  assert.equal(aborted, true);
  assert.deepEqual(result, fallback);
});

test('unmount cancellation aborts the in-flight lookup', async () => {
  const controller = new AbortController();
  let aborted = false;
  const lookup = getApproximateLocation({ signal: controller.signal, fetchImpl: (url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => { aborted = true; reject(new Error('Aborted')); });
  }) });
  controller.abort();
  assert.deepEqual(await lookup, fallback);
  assert.equal(aborted, true);
});
