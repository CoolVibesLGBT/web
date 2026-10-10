import type { Map as MapLibreMap, LayerSpecification } from 'maplibre-gl';

// Oyun tarzı 3D harita: OpenFreeMap'in ücretsiz vektör stili + Pokemon GO
// benzeri pastel/yeşil renk paleti ve 3D bina extrusion'ları. Renkler ve
// mantık, referans HTML prototipinden birebir taşındı.

export const GAME_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export const GAME_COLORS = {
  ground: ['#b8fd9c', '#aef58f', '#c4ffac'],
  park: '#a9f190',
  forest: '#93e67e',
  farmland: '#c9f796',
  grass: '#b8fd9c',
  sand: '#eef7b8',
  water: '#86e0d6',
  roadFill: '#649483',
  roadCasing: '#f4fe9a',
  building: '#fbf8f0',
  buildingRoof: '#e6edf1',
  label: '#345a38',
} as const;

const ROAD_WIDTH = [
  'interpolate', ['linear'], ['zoom'],
  12, 1.5,
  15, 4,
  17, 8,
  20, 16,
] as const;

const CASING_WIDTH = [
  'interpolate', ['linear'], ['zoom'],
  12, 2.5,
  15, 6,
  17, 11,
  20, 20,
] as const;

const PATCHWORK = [
  'match',
  ['%', ['coalesce', ['id'], 0], 3],
  0, GAME_COLORS.ground[0],
  1, GAME_COLORS.ground[1],
  2, GAME_COLORS.ground[2],
  GAME_COLORS.ground[0],
] as const;

/**
 * OpenFreeMap "liberty" stilini, referans oyun haritasındaki gibi pastel
 * yeşil/sarı renklere boyar ve düz binaları 3D fill-extrusion ile değiştirir.
 * `map.on('load', ...)` içinden çağrılmalı.
 */
export function applyGameMapTheme(map: MapLibreMap) {
  const style = map.getStyle();
  const layers: LayerSpecification[] = style?.layers ?? [];

  if (map.getLayer('background')) {
    try {
      map.setPaintProperty('background', 'background-color', GAME_COLORS.ground[0]);
    } catch {
      // ignore
    }
  }

  layers.forEach((layer) => {
    const id = String(layer.id || '').toLowerCase();
    if (layer.type !== 'fill') return;

    try {
      if (id.includes('water')) {
        map.setPaintProperty(layer.id, 'fill-color', GAME_COLORS.water);
        map.setPaintProperty(layer.id, 'fill-opacity', 1);
      } else if (id.includes('farmland')) {
        map.setPaintProperty(layer.id, 'fill-color', GAME_COLORS.farmland);
      } else if (id.includes('wood') || id.includes('forest')) {
        map.setPaintProperty(layer.id, 'fill-color', GAME_COLORS.forest);
      } else if (
        id.includes('park') ||
        id.includes('garden') ||
        id.includes('cemetery') ||
        id.includes('recreation')
      ) {
        map.setPaintProperty(layer.id, 'fill-color', GAME_COLORS.park);
        map.setPaintProperty(layer.id, 'fill-opacity', 0.95);
      } else if (
        id.includes('grass') ||
        id.includes('meadow') ||
        id.includes('scrub') ||
        id.includes('pitch')
      ) {
        map.setPaintProperty(layer.id, 'fill-color', GAME_COLORS.grass);
      } else if (id.includes('sand') || id.includes('beach')) {
        map.setPaintProperty(layer.id, 'fill-color', GAME_COLORS.sand);
      } else if (id.includes('building')) {
        // ayrı 3D katmanla hallediliyor
      } else if (id.includes('landuse') || id.includes('landcover')) {
        map.setPaintProperty(layer.id, 'fill-color', PATCHWORK as unknown as string);
      }
    } catch {
      // Bazı stil sürümlerinde katman tipi uyuşmayabilir — sessizce geç.
    }
  });

  const flatBuilding = layers.find((layer) => layer.id === 'building');
  if (flatBuilding && 'source' in flatBuilding) {
    try {
      map.setLayoutProperty('building', 'visibility', 'none');
    } catch {
      // ignore
    }

    try {
      if (!map.getLayer('game-buildings-3d')) {
        map.addLayer({
          id: 'game-buildings-3d',
          type: 'fill-extrusion',
          source: flatBuilding.source,
          'source-layer': (flatBuilding as { 'source-layer'?: string })['source-layer'],
          minzoom: 14,
          paint: {
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'render_height'], 8],
              0, GAME_COLORS.building,
              40, GAME_COLORS.buildingRoof,
              120, '#b9c7d2',
            ],
            'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': 0.96,
          },
        } as LayerSpecification);
      }

      if (!map.getLayer('game-buildings-outline')) {
        map.addLayer({
          id: 'game-buildings-outline',
          type: 'line',
          source: flatBuilding.source,
          'source-layer': (flatBuilding as { 'source-layer'?: string })['source-layer'],
          minzoom: 15,
          paint: {
            'line-color': '#ffffff',
            'line-width': 1,
            'line-opacity': 0.6,
          },
        } as LayerSpecification);
      }
    } catch {
      // ignore
    }
  }

  layers.forEach((layer) => {
    const id = String(layer.id || '').toLowerCase();
    if (layer.type !== 'line') return;

    const isRoad =
      id.includes('transportation') ||
      id.includes('road') ||
      id.includes('bridge') ||
      id.includes('tunnel');

    if (!isRoad || id.includes('label')) return;

    try {
      if (id.includes('casing')) {
        map.setPaintProperty(layer.id, 'line-color', GAME_COLORS.roadCasing);
        map.setPaintProperty(layer.id, 'line-width', CASING_WIDTH as unknown as number);
        map.setPaintProperty(layer.id, 'line-opacity', 1);
      } else {
        map.setPaintProperty(layer.id, 'line-color', GAME_COLORS.roadFill);
        map.setPaintProperty(layer.id, 'line-width', ROAD_WIDTH as unknown as number);
        map.setPaintProperty(layer.id, 'line-opacity', 1);
      }
    } catch {
      // ignore
    }
  });

  layers.forEach((layer) => {
    if (layer.type === 'symbol' && layer.layout && (layer.layout as Record<string, unknown>)['text-field']) {
      try {
        map.setPaintProperty(layer.id, 'text-color', GAME_COLORS.label);
      } catch {
        // ignore
      }
    }
  });
}
