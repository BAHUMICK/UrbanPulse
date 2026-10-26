import test from 'node:test';
import assert from 'node:assert/strict';
import { coordinatesFromMapPoint, areValidCoordinates } from './locationCoordinates.js';

test('map points become decimal coordinates at six-digit precision', () => {
  assert.deepEqual(coordinatesFromMapPoint({ lat: 22.572612345, lng: 88.363912345 }), {
    latitude: '22.572612', longitude: '88.363912',
  });
});

test('coordinate validation rejects missing, non-numeric and out-of-range points', () => {
  assert.equal(areValidCoordinates('', ''), false);
  assert.equal(areValidCoordinates('north', '88'), false);
  assert.equal(areValidCoordinates('91', '88'), false);
  assert.equal(areValidCoordinates('22.5', '181'), false);
  assert.equal(areValidCoordinates('22.5', '88'), true);
});
