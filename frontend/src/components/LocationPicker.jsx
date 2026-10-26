import React, { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { coordinatesFromMapPoint, areValidCoordinates } from './locationCoordinates';

const DEFAULT_CENTER = [22.5726, 88.3639];

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
  const hasPoint = areValidCoordinates(latitude, longitude);
  const position = hasPoint ? [Number(latitude), Number(longitude)] : null;

  function select(point) {
    onChange(coordinatesFromMapPoint(point));
  }

  return (
    <section className="location-picker" aria-label="Choose issue location">
      <div className="location-picker-heading">
        <div>
          <strong>Where is the issue?</strong>
          <p>Click the map or drag the pin to set the location.</p>
        </div>
        {hasPoint && <button type="button" className="location-reset" onClick={() => onChange({ latitude: '', longitude: '' })}>Clear pin</button>}
      </div>
      <MapContainer center={position || DEFAULT_CENTER} zoom={position ? 15 : 12} className="location-picker-map" scrollWheelZoom>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler onSelect={select} />
        <Recenter position={position} />
        {position && <Marker position={position} icon={markerIcon} draggable eventHandlers={{ dragend(event) { select(event.target.getLatLng()); } }} />}
      </MapContainer>
      <div className="location-coordinates">
        <label>Latitude<input aria-label="Latitude" type="number" step="any" min="-90" max="90" value={latitude} onChange={(e) => onChange({ latitude: e.target.value, longitude })} placeholder="Click map to select" /></label>
        <label>Longitude<input aria-label="Longitude" type="number" step="any" min="-180" max="180" value={longitude} onChange={(e) => onChange({ latitude, longitude: e.target.value })} placeholder="Click map to select" /></label>
      </div>
      <p className="location-selected" aria-live="polite">{hasPoint ? `Selected: ${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}` : 'No location selected yet.'}</p>
    </section>
  );
}
