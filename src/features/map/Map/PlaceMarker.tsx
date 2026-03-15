import React from 'react';
import { Marker as ReactMarker } from 'react-leaflet';
import { Place } from '../../types/places';
import { generatePlaceImage } from '../../../helpers/helpers';
import LeafletDivIcon from './LeafletDivIcon';

interface PlaceMarkerProps {
  place: Place;
  selected: boolean;
  onClick: (place: Place) => void;
}

const generateSolidColorFromIndex = (_index: any): string => {
  const getChannel = (seed: bigint): number => {
    const sinValue = Math.sin(Number(seed % BigInt(Number.MAX_SAFE_INTEGER)));
    return (Math.abs(sinValue) * 256) % 256;
  };

  const index = _index ? BigInt(_index) : BigInt(0);
  const r = Math.floor(getChannel(index * BigInt(123456)));
  const g = Math.floor(getChannel(index * BigInt(789101)));
  const b = Math.floor(getChannel(index * BigInt(112131)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const PlaceMarker: React.FC<PlaceMarkerProps> = ({ place, selected, onClick }) => {
  const { latitude, longitude, image, name } = place.extras.place;
  const imageUrl = image || generatePlaceImage(place.public_id);
  const finalColor = generateSolidColorFromIndex(place.public_id);

  return (
    <ReactMarker
      position={[latitude, longitude]}
      // @ts-expect-error - LeafletDivIcon type not compatible with Leaflet Marker icon type
      icon={LeafletDivIcon({
        source: (
          <div className="relative flex flex-col items-center group" style={{ width: '60px', height: '80px' }}>
            {/* Ground Aura */}
            <div
              className="absolute bottom-0 w-10 h-2 blur-[12px] rounded-full opacity-30 transition-all duration-500 group-hover:scale-150"
              style={{ backgroundColor: finalColor }}
            />

            {/* Floating Body */}
            <div className={`relative w-[60px] h-[78px] flex flex-col items-center transition-all duration-500 ease-out ${selected ? '-translate-y-4 scale-110' : 'group-hover:-translate-y-3'}`}>

              {/* Symmetrical Pin Body */}
              <div className="absolute inset-0 pointer-events-none">
                <svg width="60" height="78" viewBox="0 0 60 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M30 78C30 78 0 52 0 30C0 13.4315 13.4315 0 30 0C46.5685 0 60 13.4315 60 30C60 52 30 78 30 78Z"
                    fill={finalColor}
                    fillOpacity={selected ? "0.25" : "0.15"}
                  />
                  <path
                    d="M30 76.5C30 76.5 1.5 51.5 1.5 30C1.5 14.2599 14.2599 1.5 30 1.5C45.7401 1.5 58.5 14.2599 58.5 30C58.5 51.5 30 76.5 30 76.5Z"
                    stroke={selected ? '#fff' : finalColor}
                    strokeWidth="2.5"
                    strokeOpacity={selected ? "0.8" : "0.4"}
                  />
                  <circle cx="30" cy="30" r="23.5" stroke={finalColor} strokeWidth="3" strokeOpacity="0.8" />
                </svg>
              </div>

              {/* Avatar/Place Image */}
              <div
                className={`absolute top-[8px] left-[8px] w-[44px] h-[44px] rounded-full overflow-hidden z-10 shadow-lg pointer-events-none border ${selected ? 'border-white' : 'border-transparent'}`}
                style={{
                  backgroundColor: `${finalColor}11`,
                  borderColor: selected ? '#fff' : `${finalColor}33`
                }}
              >
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                  style={{ display: 'block', width: '44px', height: '44px' }}
                />
                <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay" style={{ background: `linear-gradient(145deg, ${finalColor}, transparent 70%)` }} />
              </div>

              {/* Status/Type Indicator */}
              <div
                className="absolute top-[6px] right-[6px] w-[14px] h-[14px] rounded-full shadow-lg z-20 pointer-events-none flex items-center justify-center border-2 border-white/20"
                style={{ backgroundColor: finalColor }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40 animate-pulse" />
              </div>
            </div>

            {/* Premium Tooltip Label */}
            <div className={`absolute top-[82px] left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-300 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0.5'}`}>
              <div className="px-3.5 py-1.5 rounded-xl bg-gray-950/95 border border-white/10 shadow-2xl backdrop-blur-md">
                <span className="text-[11px] font-black tracking-widest text-white uppercase whitespace-nowrap">
                  {name}
                </span>
              </div>
            </div>
          </div>
        ),
        anchor: [30, 78],
      })}
      eventHandlers={{
        click: () => onClick(place),
      }}
    />
  );
};

export default PlaceMarker;
