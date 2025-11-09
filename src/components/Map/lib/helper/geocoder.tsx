import { LatLngExpression } from 'leaflet';
import Geohash from 'ngeohash';



function hashStringToNumber(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Bitwise OR ile 32-bit tamsayıya çevir
  }
  return Math.abs(hash);
}

function getLatitudeFromHash(hash: number): number {
  // Enlem aralığı -90 ile 90 arasında
  return (hash % 180) - 90;
}

function getLongitudeFromHash(hash: number): number {
  // Boylam aralığı -180 ile 180 arasında
  return (hash % 360) - 180;
}

function getGeoPointFromWallet(walletAddress: string): { latitude: number; longitude: number } {
  const hash = hashStringToNumber(walletAddress);
  const latitude = getLatitudeFromHash(hash);
  const longitude = getLongitudeFromHash(hash);
  return { latitude, longitude };
}

export const decodeGeoHash = (item: any): LatLngExpression => {
  const lat =
    item?.location?.latitude ??
    item?.user?.location?.latitude ??
    0; // default değer

  const lng =
    item?.location?.longitude ??
    item?.user?.location?.longitude ??
    0; // default değer

  // Debug log sadece geliştirme ortamında faydalı olabilir
  console.log("decodeGeoHash →", { lat, lng, raw: item });

  return [lat, lng];
};

export const encodeGeoHash = (position: LatLngExpression): string => {

    if (!Array.isArray(position) || position.length !== 2) {
      throw new Error("Invalid LatLngExpression format. Expected [latitude, longitude].");
    }
    const [latitude, longitude] = position;
    const encodedHash = Geohash.encode(latitude, longitude);

    return encodedHash;
  };
  

   