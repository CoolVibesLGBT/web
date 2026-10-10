import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { LocateFixed, Shrink, ZoomIn, ZoomOut } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { applyGameMapTheme, GAME_MAP_STYLE_URL } from './theme';
import { GlMapContext } from './GlMapContext';
import GlMarker from './GlMarker';

export type GameMarkerVariant = 'pokestop' | 'gym';

export interface GameMarkerContent {
  imageUrl?: string | null;
  label?: string;
  variant?: GameMarkerVariant;
}

export interface GameMapProps {
  locations?: any[];
  getMarkerId?: (item: any) => string;
  getMarkerCoords?: (item: any) => [number, number] | null;
  getMarkerContent?: (item: any) => GameMarkerContent;
  onMarkerClick?: (item: any) => void;
  onMapMoveEnd?: (lat: number, lng: number) => void;
  /** [lat, lng] — oyuncunun (giriş yapan kullanıcının) konumu. Verilirse radar halkalı mavi nokta olarak gösterilir. */
  playerPosition?: [number, number] | null;
  /** [lat, lng] — oyuncu konumu yoksa haritanın başlangıçta ortalanacağı nokta. */
  initialCenter?: [number, number];
  initialZoom?: number;
  pitch?: number;
  bearing?: number;
}

const DEFAULT_CENTER: [number, number] = [41.0082, 28.9784]; // İstanbul
const DEFAULT_ZOOM = 16.5;
const DEFAULT_PITCH = 65;
const DEFAULT_BEARING = -20;

const defaultGetMarkerId = (item: any): string =>
  String(item?.id ?? item?.public_id ?? item?.extras?.place?.id ?? Math.random());

const defaultGetMarkerCoords = (item: any): [number, number] | null => {
  const lat =
    item?.location?.latitude ??
    item?.user?.location?.latitude ??
    item?.extras?.place?.latitude ??
    item?.latitude;
  const lng =
    item?.location?.longitude ??
    item?.user?.location?.longitude ??
    item?.extras?.place?.longitude ??
    item?.longitude;

  if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  return [lat, lng];
};

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Avatar rozeti (pulse halkası + resim/baş harf + yer çizgisi) + yer gölgesi
 * — kişi/mekan marker'larının ortak iç HTML'i. */
function buildMarkerHtml(content: GameMarkerContent): string {
  const variant = content.variant ?? 'pokestop';
  const imageUrl = content.imageUrl ? escapeAttr(content.imageUrl) : null;
  const initial = content.label ? escapeAttr(content.label.charAt(0).toUpperCase()) : (variant === 'gym' ? 'G' : '');
  const avatarInner = imageUrl ? `<img src="${imageUrl}" alt="" />` : initial;

  return (
    '<div class="gm-shadow"></div>' +
    '<div class="gm-avatar-wrap">' +
    '<div class="gm-pulse-ring"></div>' +
    `<div class="gm-avatar-circle">${avatarInner}</div>` +
    '<div class="gm-ground-line"></div>' +
    '</div>'
  );
}

const PLAYER_HTML =
  '<div class="gm-player-cone"></div>' +
  '<div class="gm-player-radius"></div>' +
  '<div class="gm-player-shadow"></div>' +
  '<div class="gm-player-ground-line"></div>' +
  '<div class="gm-player-pulse"></div>' +
  '<div class="gm-player-dot"></div>';

interface GameMapControlsProps {
  mapRef: React.RefObject<maplibregl.Map | null>;
  onRecenter: () => void;
}

/** Uygulamanın geri kalanıyla aynı stil dilini kullanan (yuvarlak, blur'lu,
 * tema duyarlı) zoom/konum/ortala kontrolleri — MapLibre'nin varsayılan,
 * temasız NavigationControl'ü yerine. */
function GameMapControls({ mapRef, onRecenter }: GameMapControlsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const panelClass = `flex flex-col rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden ${isDark ? 'cv-card-surface-soft border-white/10' : 'bg-white/80 border-black/5'
    }`;
  const btnClass = `p-3 transition-all ${isDark ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'
    }`;
  const dividerClass = `h-px w-full ${isDark ? 'bg-white/10' : 'bg-black/5'}`;

  const handleLocate = useCallback(() => {
    const map = mapRef.current;
    if (!map || !('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition((position) => {
      map.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 16.5 });
    });
  }, [mapRef]);

  return (
    <div className="absolute top-1/2 right-4 z-20 flex -translate-y-1/2 flex-col gap-3 lg:right-6">
      <div className={panelClass}>
        <button type="button" onClick={() => mapRef.current?.zoomIn()} className={btnClass} aria-label="Zoom in">
          <ZoomIn size={20} />
        </button>
        <div className={dividerClass} />
        <button type="button" onClick={() => mapRef.current?.zoomOut()} className={btnClass} aria-label="Zoom out">
          <ZoomOut size={20} />
        </button>
      </div>
      <div className={panelClass}>
        <button type="button" onClick={handleLocate} className={btnClass} aria-label="Locate me">
          <LocateFixed size={20} />
        </button>
        <div className={dividerClass} />
        <button type="button" onClick={onRecenter} className={btnClass} aria-label="Recenter">
          <Shrink size={20} />
        </button>
      </div>
    </div>
  );
}

/**
 * Pokemon GO tarzı, 3D açılı (pitch) oyun haritası. OpenFreeMap vektör
 * tile'ları + MapLibre GL ile gerçek 3D binalar, oyun renk paleti ve
 * pokestop/gym tarzı marker'lar render eder.
 *
 * Marker'lar (ve oyuncu noktası) `<GlMarker>` ile DEKLARATİF olarak render
 * edilir — her item kendi React key'ine sahip, pozisyon takibi doğrudan
 * MapLibre'nin `setLngLat`'ine dayanır. Elle bir marker registry'si
 * tutup diff'lemek yerine bu yaklaşım, kanıtlanmış bir referans
 * mimarisinden (Context + per-marker bileşen) birebir alındı.
 */
export default function GameMap({
  locations = [],
  getMarkerId = defaultGetMarkerId,
  getMarkerCoords = defaultGetMarkerCoords,
  getMarkerContent,
  onMarkerClick,
  onMapMoveEnd,
  playerPosition,
  initialCenter,
  initialZoom = DEFAULT_ZOOM,
  pitch = DEFAULT_PITCH,
  bearing = DEFAULT_BEARING,
}: GameMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [glMap, setGlMap] = useState<maplibregl.Map | null>(null);
  const recenterTargetRef = useRef<[number, number]>(initialCenter ?? playerPosition ?? DEFAULT_CENTER);

  const onMapMoveEndRef = useRef(onMapMoveEnd);
  onMapMoveEndRef.current = onMapMoveEnd;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    const startCenter = playerPosition ?? initialCenter ?? DEFAULT_CENTER;
    recenterTargetRef.current = startCenter;

    const map = new maplibregl.Map({
      container,
      style: GAME_MAP_STYLE_URL,
      center: [startCenter[1], startCenter[0]],
      zoom: initialZoom,
      pitch,
      bearing,
      maxPitch: 85,
      canvasContextAttributes: { antialias: true },
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    // Sabit oyun kamerası: pitch/bearing referans HTML'deki gibi hep aynı
    // açıda kalır. Döndürme (sağ-tık sürükleme / iki parmak twist) hem
    // kafa karıştırıcıydı (etiketler/binalar garip açılarda okunmuyordu)
    // hem de marker'ların her döndürmede yanlış konuma "zıplamış" gibi
    // görünmesine yol açıyordu — pan/zoom açık kalıyor, sadece döndürme
    // tamamen kapatılıyor.
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();

    map.on('load', () => {
      if (cancelled) return;
      try {
        applyGameMapTheme(map);
      } catch {
        // Stil repaint'i başarısız olursa harita yine de kullanılabilir kalsın.
      }
      setGlMap(map);
    });

    map.on('moveend', () => {
      const c = map.getCenter();
      onMapMoveEndRef.current?.(c.lat, c.lng);
    });

    // Container boyutu mount SONRASI değişirse (sol/sağ sidebar'ların
    // immersive modda gizlenmesi, pencere yeniden boyutlanması, vb.)
    // MapLibre'ye haber verilmezse dahili canvas/transform boyutu BAYATLAR.
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => map.resize());
    resizeObserver?.observe(container);

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      setGlMap(null);
      map.remove();
      mapRef.current = null;
    };
    // Harita bir kez kurulur; merkez/zoom/pitch değişiklikleri recenter
    // butonu veya ayrı efektlerle ele alınır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (playerPosition) {
      recenterTargetRef.current = playerPosition;
    }
  }, [playerPosition]);

  const handleRecenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const target = recenterTargetRef.current;
    map.easeTo({
      center: [target[1], target[0]],
      zoom: initialZoom,
      pitch,
      bearing,
      duration: 700,
    });
  }, [bearing, initialZoom, pitch]);

  return (
    <div className="gm-map-root">
      <div ref={containerRef} className="gm-map-canvas" />
      <GlMapContext.Provider value={glMap}>
        {playerPosition && (
          <GlMarker key="__player" position={playerPosition} anchor="center" html={PLAYER_HTML} className="gm-player-wrap" />
        )}
        {locations.map((item) => {
          const coords = getMarkerCoords(item);
          if (!coords) return null;
          const id = getMarkerId(item);
          const content: GameMarkerContent = getMarkerContent?.(item) ?? {};
          return (
            <GlMarker
              key={id}
              position={coords}
              anchor="bottom"
              html={buildMarkerHtml(content)}
              className={`gm-game-object gm-${content.variant ?? 'pokestop'}`}
              onClick={() => onMarkerClick?.(item)}
            />
          );
        })}
      </GlMapContext.Provider>
      <GameMapControls mapRef={mapRef} onRecenter={handleRecenter} />
    </div>
  );
}
