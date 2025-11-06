import { defaultServiceServerId, serviceURL } from "../appSettings";

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
  

  // helpers/imageUrl.ts

export function getSafeImageURL(
    attachment: any,
    variant: string = "small"
  ): string | null {
    console.log("GELENAttachments",attachment)
    var serviceURI = serviceURL[defaultServiceServerId]
    try {
      const path = attachment?.file?.variants?.image?.[variant]?.url;
      if (!path) return null;
  
      // Eğer path mutlak değilse base URL ile birleştir
      const url = path.startsWith("http") ? new URL(path) : new URL(path, serviceURI);

  
      // Sadece http veya https izin ver
      if (!["https:", "http:"].includes(url.protocol)) {
        console.warn("🚫 Unsafe protocol:", url.protocol);
        return null;
      }

      console.log('URL',url)
      return url.href.toString();
      
    } catch (err) {
      console.warn("🚫 Invalid or unsafe URL:", err);
      return null;
    }

  }
  
  // ✅ Kolay kullanım fonksiyonu
  export function getImageURL(attachment: any, variant: string = "small"): string | null {
    const serviceURL = "https://cdn.mydomain.com/";
    return getSafeImageURL(attachment, serviceURL, variant);
  }