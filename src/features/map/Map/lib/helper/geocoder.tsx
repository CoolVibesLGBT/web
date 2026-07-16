import type { LatLngExpression } from 'leaflet';
import Geohash from 'ngeohash';

function hashStringToNumber(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Bitwise OR ile 32-bit tamsayıya çevir
  }
  return Math.abs(hash);
}

/**
 * Deterministically generates a coordinate offset based on an ID.
 * Increased to spread markers more widely to prevent overlap at moderate zoom levels.
 */
function getJitter(id: string | number, multiplier: number = 0.005): { lat: number, lng: number } {
  const hash = hashStringToNumber(String(id));

  // Use a simple spiral/circular distribution for better spreading than a box
  const angle = (hash % 1000) * (Math.PI * 2 / 1000);
  const radius = (0.2 + (hash % 800) / 1000) * multiplier;

  return {
    lat: Math.sin(angle) * radius,
    lng: Math.cos(angle) * radius
  };
}

export const decodeGeoHash = (item: any): LatLngExpression => {
  const hasRawLat = item?.location?.latitude !== undefined || item?.user?.location?.latitude !== undefined;
  const hasRawLng = item?.location?.longitude !== undefined || item?.user?.location?.longitude !== undefined;

  let baseLat =
    item?.location?.latitude ??
    item?.user?.location?.latitude ??
    0;

  let baseLng =
    item?.location?.longitude ??
    item?.user?.location?.longitude ??
    0;

  const id = item?.public_id || item?.id || "default";

  // If both coordinates were missing, spread them globally but distinctively
  if (!hasRawLat && !hasRawLng) {
    const globalHashLat = hashStringToNumber(id + "global_v2_lat");
    const globalHashLng = hashStringToNumber(id + "global_v2_lng");

    // Spread across a reasonable world viewing area (-50 to 60 lat, -140 to 140 lng)
    baseLat = (globalHashLat % 110) - 50;
    baseLng = (globalHashLng % 280) - 140;

    return [baseLat, baseLng];
  }

  // Use a much larger jitter (multiplier: 0.008 is ~800m-1km spread)
  // This is a trade-off: markers are less precise but CERTAINLY don't overlap at zoom 14-16.
  const jitter = getJitter(id, 0.008);

  const finalLat = baseLat + jitter.lat;
  const finalLng = baseLng + jitter.lng;

  return [finalLat, finalLng];
};

export const encodeGeoHash = (position: LatLngExpression): string => {
  if (!Array.isArray(position) || position.length !== 2) {
    throw new Error("Invalid LatLngExpression format. Expected [latitude, longitude].");
  }
  const [latitude, longitude] = position;
  const encodedHash = Geohash.encode(latitude, longitude);

  return encodedHash;
};
