import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useGlMap } from './GlMapContext';

export interface GlMarkerProps {
  /** [lat, lng] */
  position: [number, number];
  /** Marker'ın iç HTML'i (innerHTML olarak set edilir). */
  html: string;
  className?: string;
  anchor?: 'center' | 'top' | 'bottom';
  onClick?: () => void;
}

/**
 * Tek bir MapLibre GL marker'ını deklaratif bir React bileşeni olarak sarar
 * — her item için bir `<GlMarker key={id} .../>`, React'ın kendi
 * reconciliation'ı (key bazlı) marker ekleme/çıkarmayı yönetir. Elle bir
 * `Map<id, Marker>` tutup diff'lemek yerine bu YAKLAŞIM kanıtlanmış ve daha
 * az hataya açık: pozisyon güncellemesi `setLngLat` ile ayrı, küçük bir
 * efektte, marker'ın kendisi `glMap` değişmediği sürece YENİDEN
 * OLUŞTURULMADAN.
 */
export default function GlMarker({ position, html, className, anchor = 'center', onClick }: GlMarkerProps) {
  const glMap = useGlMap();
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    if (!glMap) return;

    const el = document.createElement('div');
    if (className) el.className = className;
    el.innerHTML = html;
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      onClickRef.current?.();
    });

    const marker = new maplibregl.Marker({ element: el, anchor }).setLngLat([position[1], position[0]]).addTo(glMap);
    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
    // html/className kasıtlı olarak dışarıda: ikon markup'ı mount anında
    // sabitlenir, sadece konum canlı takip edilir (aşağıdaki efekt) — aynı
    // marker'ın her render'da yeniden yaratılıp titremesini önler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glMap, anchor]);

  useEffect(() => {
    markerRef.current?.setLngLat([position[1], position[0]]);
  }, [position[0], position[1]]);

  return null;
}
