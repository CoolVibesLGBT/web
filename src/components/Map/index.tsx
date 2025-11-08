import { useEffect, useState } from 'react';

import MarkerCategories, { Category } from './lib/MarkerCategories';
import { AppConfig } from './lib/AppConfig';
import LeafleftMapContextProvider from './LeafletMapContextProvider';
import useMapContext from './useMapContext';
import useMarkerData from './useMarkerData';
import { useResizeDetector } from 'react-resize-detector';

import { LeafletMapContainer } from './LeafletMapContainer';
import { LocateButton } from './ui/LocateButton';
import { CenterButton } from './ui/CenterButton';
import { ZoomInButton } from './ui/ZoomInButton';
import { ZoomOutButton } from './ui/ZoomOutButton';
import { LeafletCluster } from './LeafletCluster';
import { CustomMarker } from './LeafletMarker';
import { useRecoilState } from 'recoil';
import { globalState } from '../../state/nearby';




const LeafletMapInner = () => {
  const { map } = useMapContext();
  const [state, setState] = useRecoilState(globalState);

  const [windowHeight, setWindowHeight] = useState<number | null>(() =>
    typeof window !== 'undefined' ? window.innerHeight : null
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const {
    width: viewportWidth,
    height: viewportHeight,
    ref: viewportRef,
  } = useResizeDetector({
    refreshMode: 'debounce',
    refreshRate: 500,
  });



  


  const { clustersByCategory, allMarkersBoundCenter } = useMarkerData({
    locations: state.nearbyUsers,
    map,
    viewportWidth,
    viewportHeight,
  });


  console.log("clustersByCategory",clustersByCategory)
  const isLoading = !map || !viewportWidth || !viewportHeight;
/* 
  useEffect(() => {
    if (!allMarkersBoundCenter || !map) return;

    const moveEnd = () => {
      map.off('moveend', moveEnd);
    };

    try {
      map.flyTo(
        allMarkersBoundCenter.centerPos,
        allMarkersBoundCenter.minZoom,
        { animate: false }
      );
      map.once('moveend', moveEnd);
    } catch (e) {}
  }, [allMarkersBoundCenter, map]); */

 

  return (
    <div
      className="w-full h-[calc(100dvh-130px)] overflow-hidden"
      ref={viewportRef}
      
    >   
  


      <div
        className="rounded-lg h-full w-full transition-opacity">
        {allMarkersBoundCenter && clustersByCategory && (
          <LeafletMapContainer
            center={allMarkersBoundCenter.centerPos}
            zoom={allMarkersBoundCenter.minZoom}
            maxZoom={AppConfig.maxZoom}
            minZoom={AppConfig.minZoom}
            zoomAnimation={true}
            fadeAnimation={true}
          >
            {!isLoading ? (
              <>
                <LocateButton />
                <CenterButton
                  center={allMarkersBoundCenter.centerPos}
                  zoom={allMarkersBoundCenter.minZoom}
                />
                <ZoomInButton />
                <ZoomOutButton />



                {Object.values(clustersByCategory).map((item,index) => (
                  <LeafletCluster
                    key={`cluster${item.category}${index}`}
                    
                    icon={MarkerCategories[item.category as Category].icon}
                    color={MarkerCategories[item.category as Category].color}
                    chunkedLoading={true}
                  >
                    {item.markers.map((marker,markerIndex) => (
                      <CustomMarker item={marker} key={`markerItem${markerIndex}${marker.name}${marker.index}`} />
                    ))}
                  </LeafletCluster>
                ))}
              </>
            ) : (
              // we have to spawn at least one element to keep it happy
              // eslint-disable-next-line react/jsx-no-useless-fragment
              <></>
            )}
          </LeafletMapContainer>
        )}
      </div>
      </div>
     
 
  );
};

// pass through to get context in <MapInner>
const Map = () => (
  <LeafleftMapContextProvider>
    <LeafletMapInner />
  </LeafleftMapContextProvider>
);

export default Map;
