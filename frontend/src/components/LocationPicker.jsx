import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { coordinatesFromMapPoint, areValidCoordinates } from './locationCoordinates';

import { FALLBACK_CENTER, getApproximateLocation } from './approximateLocation';

const markerIcon = L.divIcon({
  className: 'location-picker-marker',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapClickHandler({ onSelect }) {
  useMapEvents({ click(event) { onSelect(event.latlng); } });
  return null;
}

function Recenter({ position }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (position) map.panTo(position);
  }, [map, position]);
  return null;
}

export default function LocationPicker({ latitude, longitude, onChange }) {
  const [locationSource, setLocationSource] = useState('loading');
  const edited = useRef(false);
  const latest = useRef({ latitude, longitude, onChange });
  latest.current = { latitude, longitude, onChange };

  useEffect(() => {
    const initial = latest.current;
    if (initial.latitude !== '' || initial.longitude !== '') {
      setLocationSource('manual');
      return undefined;
    }
    const controller = new AbortController();
    let cancelled = false;
    getApproximateLocation({ signal: controller.signal }).then((point) => {
      const current = latest.current;
      if (cancelled || edited.current || current.latitude !== '' || current.longitude !== '') return;
      setLocationSource(point.source);
      current.onChange({ latitude: point.latitude, longitude: point.longitude });
    });
    return () => { cancelled = true; controller.abort(); };
  }, []);

  function changePoint(point) {
    edited.current = true;
    setLocationSource('manual');
    onChange(point);
  }

  const hasPoint = areValidCoordinates(latitude, longitude);
  const position = hasPoint ? [Number(latitude), Number(longitude)] : null;

  function select(point) {
    changePoint(coordinatesFromMapPoint(point));
  }

  return (
    <section className="location-picker" aria-label="Choose issue location">
      <div className="location-picker-heading">
        <div>
          <strong>Where is the issue?</strong>
          <p>Click the map or drag the pin to set the location.</p>
        </div>
        {hasPoint && <button type="button" className="location-reset" onClick={() => changePoint({ latitude: '', longitude: '' })}>Clear pin</button>}
      </div>
      <MapContainer center={position || FALLBACK_CENTER} zoom={12} className="location-picker-map" scrollWheelZoom>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler onSelect={select} />
        <Recenter position={position} />
        {position && <Marker position={position} icon={markerIcon} draggable eventHandlers={{ dragend(event) { select(event.target.getLatLng()); } }} />}
      </MapContainer>
      <div className="location-coordinates">
        <label>Latitude<input aria-label="Latitude" type="number" step="any" min="-90" max="90" value={latitude} onChange={(e) => changePoint({ latitude: e.target.value, longitude })} placeholder="Click map to select" /></label>
        <label>Longitude<input aria-label="Longitude" type="number" step="any" min="-180" max="180" value={longitude} onChange={(e) => changePoint({ latitude, longitude: e.target.value })} placeholder="Click map to select" /></label>
      </div>
      <p className="location-selected" aria-live="polite">{hasPoint ? `Selected: ${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}` : 'No location selected yet.'}</p>
      <p className="location-selected" role="status">
        {locationSource === 'loading' ? 'Finding an approximate area… You can select the issue location now.'
          : locationSource === 'approximate' ? 'Approximate area from your network, not GPS. Confirm the issue location by moving the pin.'
          : locationSource === 'fallback' ? 'Approximate location unavailable. Showing Visakhapatnam; move the pin to the issue location.'
          : 'Use the pin for the issue location, which may differ from where you are.'}
      </p>
      <p className="location-selected">Approximate lookup uses ipapi.co, which receives your public IP address. No GPS permission is requested.</p>
    </section>
  );
}
