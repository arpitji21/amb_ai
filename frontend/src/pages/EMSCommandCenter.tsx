import { useRef } from 'react';
import type L from 'leaflet';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import AmbulanceMap from '@/components/AmbulanceMap';
import ActivityTimeline from '@/components/ActivityTimeline';
import StatsPanel from '@/components/StatsPanel';
import { useAmbulanceSocket } from '@/lib/useAmbulanceSocket';
import { HOSPITALS } from '@/lib/mockData';

export default function EMSCommandCenter() {
  const { ambulances, events, stats, connected } = useAmbulanceSocket();
  const mapInstance = useRef<L.Map | null>(null);

  const handleFocus = (id: string) => {
    const a = ambulances.find((x) => x.id === id);
    if (a && mapInstance.current) {
      mapInstance.current.flyTo([a.lat, a.lng], 15, { duration: 0.6 });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F7FA]">
      <Sidebar />
      <main className="flex-1 min-w-0 min-h-0 flex flex-col">
        <TopBar connected={connected} />
        <div className="flex-1 p-4 flex flex-col gap-3 min-h-0">
          <div className="flex-1 min-h-[420px]">
            <AmbulanceMap
              ambulances={ambulances}
              hospitals={HOSPITALS}
              onMapReady={(map) => {
                mapInstance.current = map;
              }}
            />
          </div>
          <ActivityTimeline events={events} />
        </div>
      </main>
      <StatsPanel stats={stats} ambulances={ambulances} hospitals={HOSPITALS} onFocus={handleFocus} />
    </div>
  );
}
