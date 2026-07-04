import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Ambulance, AmbulanceStatus, Hospital } from '@/types';
import { COMMAND_CENTER } from '@/lib/mockData';
import AmbulancePopup from './AmbulancePopup';

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 150);
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(id);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
}

const STATUS_COLOR: Record<AmbulanceStatus, string> = {
  available: '#16A34A',
  responding: '#D97706',
  critical: '#DC2626',
  arrived: '#0F5C8C',
};

function ambulanceIcon(status: AmbulanceStatus) {
  const color = STATUS_COLOR[status];
  const html = `<div class="marker-ping"><div class="ring" style="background:${color}"></div><div class="core" style="background:${color}"></div></div>`;
  return L.divIcon({ className: '', html, iconSize: [20, 20], iconAnchor: [10, 10] });
}

function hospitalIcon(name: string) {
  const html = renderToStaticMarkup(
    <div
      style={{
        background: '#fff',
        border: '2px solid #0F5C8C',
        borderRadius: 9,
        padding: '4px 8px',
        font: '700 10px Inter, sans-serif',
        color: '#0F5C8C',
        boxShadow: '0 2px 8px rgba(0,0,0,.15)',
        whiteSpace: 'nowrap',
      }}
    >
      🏥 {name}
    </div>
  );
  return L.divIcon({ className: '', html, iconSize: undefined });
}

const LEGEND = [
  { label: 'Available', color: STATUS_COLOR.available },
  { label: 'Responding', color: STATUS_COLOR.responding },
  { label: 'Critical', color: STATUS_COLOR.critical },
  { label: 'At Hospital', color: STATUS_COLOR.arrived },
];

export default function AmbulanceMap({
  ambulances,
  hospitals,
  onMapReady,
}: {
  ambulances: Ambulance[];
  hospitals: Hospital[];
  onMapReady?: (map: L.Map) => void;
}) {
  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-card border border-line relative">
      <MapContainer
        center={COMMAND_CENTER}
        zoom={13}
        className="w-full h-full"
        scrollWheelZoom
        ref={(map) => {
          if (map) onMapReady?.(map);
        }}
      >
        <InvalidateOnMount />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hospitals.map((h) => (
          <Marker key={h.name} position={[h.lat, h.lng]} icon={hospitalIcon(h.name)} />
        ))}
        {ambulances.map((a) => (
          <Marker key={a.id} position={[a.lat, a.lng]} icon={ambulanceIcon(a.status)}>
            <Popup minWidth={230}>
              <AmbulancePopup ambulance={a} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute bottom-3.5 left-3.5 z-[500] bg-white/90 backdrop-blur rounded-[11px] px-3 py-2.5 shadow-card flex gap-3.5 text-[11px] text-muted">
        {LEGEND.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
