import {
  createElementObject,
  createPathComponent,
  extendContext,
  LeafletContextInterface,
} from '@react-leaflet/core';
import type * as LeafletTypes from 'leaflet';

import { LucideProps } from 'lucide-react';
import React, { FunctionComponent, useEffect, useState } from 'react';



import MarkerIconWrapper from './LeafletMarker/MarkerIconWrapper';
import LeafletDivIcon from './LeafletDivIcon';
import { AppConfig } from './lib/AppConfig';

type ClusterEvents = {
  onClick?: LeafletTypes.LeafletMouseEventHandlerFn;
  onDblClick?: LeafletTypes.LeafletMouseEventHandlerFn;
  onMouseDown?: LeafletTypes.LeafletMouseEventHandlerFn;
  onMouseUp?: LeafletTypes.LeafletMouseEventHandlerFn;
  onMouseOver?: LeafletTypes.LeafletMouseEventHandlerFn;
  onMouseOut?: LeafletTypes.LeafletMouseEventHandlerFn;
  onContextMenu?: LeafletTypes.LeafletMouseEventHandlerFn;
};

type MarkerClusterControl = LeafletTypes.MarkerClusterGroupOptions & {
  children: React.ReactNode;
  icon: FunctionComponent<LucideProps>;
  color: string;
} & ClusterEvents;

const getLeaflet = () =>
  (typeof window !== 'undefined' ? (window as any).L : null) as typeof import('leaflet') | null;

const CreateMarkerClusterGroup = (
  props: MarkerClusterControl,
  context: LeafletContextInterface
) => {
  const leaflet = getLeaflet();
  if (!leaflet) {
    throw new Error('Leaflet is not available');
  }

  const markerClusterGroup = new (leaflet as any).MarkerClusterGroup({
    removeOutsideVisibleBounds: true,
    spiderfyOnMaxZoom: true,
    spiderLegPolylineOptions: {
      className: 'hidden',
    },
    showCoverageOnHover: false,
    spiderfyOnEveryZoom: false,
    zoomToBoundsOnClick: true,
    unspiderfyOnMapClick: false, // Boş yere tıklayınca grup kapanmasın
    spiderfyDistanceMultiplier: 10,
    iconCreateFunction: (cluster: any) => {
      const customIcon = LeafletDivIcon({
        source: (
          <MarkerIconWrapper
            key={`markerIconWrapper${cluster.getChildCount()}`}
            color={props.color}
            item={{
              group: true,
              index: BigInt(cluster.getChildCount()),
            }}
            label={`${cluster.getChildCount()}`}
          />
        ),
        anchor: [
          AppConfig.ui.markerIconSize / 2,
          AppConfig.ui.markerIconSize / 2,
        ],
      });

      return (
        customIcon ??
        leaflet.divIcon({
          html: `${cluster.getChildCount()}`,
          iconAnchor: [
            AppConfig.ui.markerIconSize / 2,
            AppConfig.ui.markerIconSize / 2,
          ],
        })
      );
    },
    ...props,
  } as any);

  return createElementObject(
    markerClusterGroup,
    extendContext(context, { layerContainer: markerClusterGroup })
  );
};

const LeafletClusterComponent =
  createPathComponent<LeafletTypes.MarkerClusterGroup, MarkerClusterControl>(
    CreateMarkerClusterGroup
  );

export const LeafletCluster: React.FC<MarkerClusterControl> = (props) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let active = true;
    const load = async () => {
      try {
        const leaflet = await import('leaflet');
        if (!(window as any).L) {
          (window as any).L = leaflet;
        }
        await import('leaflet.markercluster');
        if (active) setReady(true);
      } catch (error) {
        console.error('Failed to load Leaflet cluster', error);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (typeof window === 'undefined' || !ready) {
    return null;
  }

  return <LeafletClusterComponent {...props} />;
};
