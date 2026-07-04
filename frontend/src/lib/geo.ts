/** Great-circle distance in kilometers between two lat/lng points. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

/** Rough arrival estimate assuming average city-traffic ambulance speed. */
export function estimateEtaMinutes(distanceKm: number, avgSpeedKmh = 40): number {
  return Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60));
}
