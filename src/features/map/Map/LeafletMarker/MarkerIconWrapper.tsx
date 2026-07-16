import React from 'react';
import { getSafeImageURLEx } from '../../../../helpers/helpers';

export interface MarkerIconWrapperProps {
  item: any;
  color?: string;
  label?: string;
}

/**
 * "Symmetry Pro" Marker Design.
 * Mathematically balanced gaps (Top = Left = Right = 8px).
 * Uses alpha-only glassmorphism to eliminate harsh whites/blacks.
 */
const MarkerIconWrapper = React.memo(({ item, color, label }: MarkerIconWrapperProps) => {
  const finalColor = color || '#3b82f6';
  const isGroup = !!item.group;

  // URL Resolution
  const imageUrl = isGroup
    ? ''
    : (item.image || getSafeImageURLEx(item.public_id, item?.avatar, "icon"));


  // Layout Constants (60x80 container)
  // Pin is 60px wide. Top circle radius is 30. Center is (30, 30).
  // Avatar is 44x44. Centered at (30, 30) => Top = 8, Left = 8.
  // Gaps: Left=8, Right=8, Top=8. Perfect symmetry.

  return (
    <div
      className="relative flex flex-col items-center group"
      style={{ width: '60px', height: '80px' }}
    >
      {/* Dynamic Ground Aura */}
      <div
        className="absolute bottom-0 w-10 h-2 blur-[12px] rounded-full opacity-30 transition-all duration-500 group-hover:scale-150"
        style={{ backgroundColor: finalColor }}
      />

      {/* Floating Body */}
      <div className="relative w-[60px] h-[78px] flex flex-col items-center transition-transform duration-500 ease-out group-hover:-translate-y-3">

        {/* The Symmetrical Pin Body */}
        <div className="absolute inset-0 pointer-events-none">
          <svg width="60" height="78" viewBox="0 0 60 78" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* The main shell - Glass effect using alpha accent color */}
            <path
              d="M30 78C30 78 0 52 0 30C0 13.4315 13.4315 0 30 0C46.5685 0 60 13.4315 60 30C60 52 30 78 30 78Z"
              fill={finalColor}
              fillOpacity="0.15"
            />
            {/* Elegant glowing border */}
            <path
              d="M30 76.5C30 76.5 1.5 51.5 1.5 30C1.5 14.2599 14.2599 1.5 30 1.5C45.7401 1.5 58.5 14.2599 58.5 30C58.5 51.5 30 76.5 30 76.5Z"
              stroke={finalColor}
              strokeWidth="2.5"
              strokeOpacity="0.4"
            />
            {/* Internal Core Accent Ring */}
            <circle cx="30" cy="30" r="23.5" stroke={finalColor} strokeWidth="3" strokeOpacity="0.8" />
          </svg>
        </div>

        {/* The Avatar Photo - Perfectly Centered in the shell */}
        <div
          className="absolute top-[8px] left-[8px] w-[44px] h-[44px] rounded-full overflow-hidden z-10 shadow-lg pointer-events-none"
          style={{
            backgroundColor: `${finalColor}11`,
            border: `1.5px solid ${finalColor}33`
          }}
        >
          {isGroup ? (
            <div
              className="w-full h-full flex items-center justify-center font-black text-sm italic"
              style={{ color: finalColor, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
            >
              {label}+
            </div>
          ) : (
            <img
              src={imageUrl}
              alt="P"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
              style={{ display: 'block', width: '44px', height: '44px' }}
            />
          )}

          {/* Surface reflection */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay"
            style={{ background: `linear-gradient(145deg, ${finalColor}, transparent 70%)` }}
          />
        </div>

        {/* Precision Status Indicator */}
        <div
          className="absolute top-[6px] right-[6px] w-[14px] h-[14px] rounded-full shadow-lg z-20 pointer-events-none flex items-center justify-center"
          style={{
            backgroundColor: finalColor,
            border: '2.5px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40 animate-pulse" />
        </div>
      </div>

    </div>
  );
});

export default MarkerIconWrapper;
