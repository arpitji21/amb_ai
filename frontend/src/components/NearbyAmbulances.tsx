import { PhoneCall, Navigation, LocateFixed } from 'lucide-react';
import type { Ambulance } from '@/types';
import { haversineKm, estimateEtaMinutes } from '@/lib/geo';
import { useGeolocation } from '@/lib/useGeolocation';

export default function NearbyAmbulances({ ambulances }: { ambulances: Ambulance[] }) {
  const geo = useGeolocation();

  const nearby = ambulances
    .filter((a) => a.status === 'available')
    .map((a) => ({ ambulance: a, distanceKm: haversineKm(geo.lat, geo.lng, a.lat, a.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

  return (
    <div className="bg-white border border-line rounded-2xl shadow-card p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display font-extrabold text-sm flex items-center gap-2">
          <Navigation size={16} className="text-primary" /> Nearest Available Ambulance
        </h2>
        <span className="flex items-center gap-1 text-[10.5px] text-muted">
          <LocateFixed size={12} />
          {geo.loading ? 'Locating…' : geo.source === 'gps' ? 'Using your location' : 'Approximate location'}
        </span>
      </div>
      <p className="text-[11.5px] text-muted mb-3">
        Call directly if you need to request pickup for someone else nearby.
      </p>

      {nearby.length === 0 ? (
        <p className="text-[12.5px] text-muted py-2">No ambulances are currently available nearby.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {nearby.map(({ ambulance: a, distanceKm }) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 border border-line rounded-[12px] px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[12.5px]">{a.id}</span>
                  <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-alert-green-soft text-alert-green">
                    Available
                  </span>
                </div>
                <div className="text-[12px] text-ink font-medium mt-0.5 truncate">{a.driver}</div>
                <div className="text-[11px] text-muted mt-0.5">
                  {distanceKm.toFixed(1)} km away · ~{estimateEtaMinutes(distanceKm)} min
                </div>
              </div>
              <a
                href={`tel:${a.phone.replace(/\s+/g, '')}`}
                className="shrink-0 flex items-center gap-1.5 bg-primary text-white text-[12px] font-semibold px-3 py-2 rounded-[9px] hover:opacity-90 transition-opacity"
              >
                <PhoneCall size={13} /> {a.phone}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
