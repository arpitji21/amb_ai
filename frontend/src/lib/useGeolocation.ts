import { useEffect, useState } from 'react';
import { COMMAND_CENTER } from './mockData';

export interface GeoState {
  lat: number;
  lng: number;
  source: 'gps' | 'fallback';
  loading: boolean;
}

export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>({
    lat: COMMAND_CENTER[0],
    lng: COMMAND_CENTER[1],
    source: 'fallback',
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: 'gps', loading: false }),
      () => setState((s) => ({ ...s, loading: false })),
      { timeout: 8000 }
    );
  }, []);

  return state;
}
