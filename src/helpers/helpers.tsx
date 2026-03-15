import { defaultServiceServerId, serviceURL } from "../appSettings";
import { DEFAULT_AVATAR_URL, PLACE_AVATAR_URL } from "../constants/constants";
import { pickSeededColorsString } from "./colors";

// helpers/safeUrl.ts
export function buildSafeURL(
    baseUrl: string,
    path: string | undefined | null,
    allowedHosts: string[] = []
  ): string | null {
    try {
      if (!path) return null;
  
      // Tam URL mi, yoksa relative mi kontrol et
      const url = path.startsWith("http") ? new URL(path) : new URL(path, baseUrl);
  
      // Protokol güvenli mi kontrol et
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        console.warn("Blocked unsafe URL protocol:", url.protocol);
        return null;
      }
  
      // Eğer allowedHosts listesi varsa, hostu kontrol et
      if (allowedHosts.length > 0 && !allowedHosts.includes(url.hostname)) {
        console.warn("Blocked external host:", url.hostname);
        return null;
      }
  
      // URL başarılı şekilde doğrulandı
      return url.href;
    } catch (err) {
      console.warn("Invalid URL:", err);
      return null;
    }
  }
  

export function generatePlaceImage(seed : unknown) : string{
  const safeSeed = String(seed ?? 'guest');
  const randColor = pickSeededColorsString(safeSeed, 3);
  return `${PLACE_AVATAR_URL}${encodeURIComponent(safeSeed)}&backgroundColor=${randColor}&backgroundType=gradientLinear,solid`;
}


export function generateFallbackImage(seed : unknown) : string{
  const safeSeed = String(seed ?? 'guest');
  const randColor = pickSeededColorsString(safeSeed, 3);
  return `${DEFAULT_AVATAR_URL}${encodeURIComponent(safeSeed)}&backgroundColor=${randColor}&backgroundType=gradientLinear,solid`;
}

export function getSafeImageURL(
    attachment: unknown,
    variant: string = "small"
  ): string | null {
    const serviceURI = serviceURL[defaultServiceServerId]
    try {
      // Try multiple path structures:
      // 1. attachment.file.variants.image[variant].url (for nested file structure like avatar/cover)
      // 2. attachment.variants.image[variant].url (for direct file structure like media)
      // 3. attachment.file.variants.video[variant].url (for video files)
      // 4. attachment.variants.video[variant].url (for direct video structure)
      const path = attachment?.file?.variants?.image?.[variant]?.url || 
                 attachment?.variants?.image?.[variant]?.url ||
                 attachment?.file?.variants?.video?.[variant]?.url ||
                 attachment?.variants?.video?.[variant]?.url;
      
      if (!path) return null;
  
      // Eğer path mutlak değilse base URL ile birleştir
      const url = path.startsWith("http") ? new URL(path) : new URL(path, serviceURI);
  
      // Sadece http veya https izin ver
      if (!["https:", "http:"].includes(url.protocol)) {
        return null;
      }

      return url.href.toString();
      
    } catch (err) {
      
      return null;
    }

  }

export function getSafeImageURLEx(
    publicId : unknown,
    attachment: unknown,
    variant: string = "small"
  ): string | null {
    const serviceURI = serviceURL[defaultServiceServerId]
    try {
      // Try multiple path structures:
      // 1. attachment.file.variants.image[variant].url (for nested file structure like avatar/cover)
      // 2. attachment.variants.image[variant].url (for direct file structure like media)
      // 3. attachment.file.variants.video[variant].url (for video files)
      // 4. attachment.variants.video[variant].url (for direct video structure)
      const path = attachment?.file?.variants?.image?.[variant]?.url || 
                 attachment?.variants?.image?.[variant]?.url ||
                 attachment?.file?.variants?.video?.[variant]?.url ||
                 attachment?.variants?.video?.[variant]?.url;
      
      if (!path) {
        return generateFallbackImage(publicId)
      };
  
      // Eğer path mutlak değilse base URL ile birleştir
      const url = path.startsWith("http") ? new URL(path) : new URL(path, serviceURI);
  
      // Sadece http veya https izin ver
      if (!["https:", "http:"].includes(url.protocol)) {
           return generateFallbackImage(publicId)
      }

      return url.href.toString();
      
    } catch (err) {
         return generateFallbackImage(publicId)
    }

  }
  
  export function getImageURL(attachment: unknown, variant: string = "small"): string | null {
    return getSafeImageURL(attachment, variant);
  }


export function formatLastSeen(lastOnline: string): string {
  const now = new Date();
  const lastSeenDate = new Date(lastOnline);
  const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return 'Recently active';
}

export function calculateAge(dateOfBirth: string): number | string {
  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) {
    return '-';
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}


export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const random = (min: number, max: number): number => Math.random() * (max - min) + min;

export const getLocalizedContent = (contentObj: Record<string, unknown> | undefined, languageCode: string): unknown => {
  if (!contentObj) return "";

  // Önce istenen dilde içerik var mı kontrol et
  if (contentObj[languageCode]) return contentObj[languageCode];

  // Yoksa ilk bulunan değeri döndür
  const values = Object.values(contentObj);
  if (values.length > 0) return values[0];

  return "";
}
