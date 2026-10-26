export function coordinatesFromMapPoint({ lat, lng }) {
  return { latitude: Number(lat).toFixed(6), longitude: Number(lng).toFixed(6) };
}

export function areValidCoordinates(latitude, longitude) {
  if (latitude === '' || longitude === '') return false;
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
