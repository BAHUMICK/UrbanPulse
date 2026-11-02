import { areValidCoordinates, coordinatesFromMapPoint } from './locationCoordinates.js';

export const FALLBACK_CENTER = [17.6868, 83.2185];

export async function getApproximateLocation({ fetchImpl = fetch, signal, timeoutMs = 4000 } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, timeoutMs);
  try {
    const response = await fetchImpl('https://ipapi.co/json/', {
      signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer',
    });
    if (!response.ok) throw new Error('Location unavailable');
    const data = await response.json();
    const validValue = (value) => typeof value === 'number' || (typeof value === 'string' && value.trim() !== '');
    if (data.error || !validValue(data.latitude) || !validValue(data.longitude) || !areValidCoordinates(data.latitude, data.longitude)) {
      throw new Error('Invalid approximate location');
    }
    return { ...coordinatesFromMapPoint({ lat: data.latitude, lng: data.longitude }), source: 'approximate' };
  } catch {
    return { ...coordinatesFromMapPoint({ lat: FALLBACK_CENTER[0], lng: FALLBACK_CENTER[1] }), source: 'fallback' };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
