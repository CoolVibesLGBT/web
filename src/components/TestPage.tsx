
import React, { useState, useRef, useEffect, useReducer } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useInView,
  MotionValue,
} from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const BASE_IMAGE_URLS: string[] = [
  'https://framerusercontent.com/images/d4vuR3XWFNyIGpMuv8ciR2M1U.jpg',
  'https://framerusercontent.com/images/IWE1NxOpUZZfM61WzpahXjluiE4.jpg',
  'https://framerusercontent.com/images/tIIDJsJlFjkX88ysZko6gTVKYZs.jpg',
  'https://framerusercontent.com/images/8dZyfPZxixKyqjowwolyynzuolg.jpg',
  'https://framerusercontent.com/images/TdTePeGkpeFm2o5GuDEgte4Rd4.jpg',
  'https://framerusercontent.com/images/6oMzl15zOgTPczPPSxi978neR0.jpg',
  'https://framerusercontent.com/images/ZS8BFvHHti3UjDLIIEJkDICni8E.jpg',
  'https://framerusercontent.com/images/19UlbpsgZ5Jiwp0mZXSeKIA.jpg',
  'https://framerusercontent.com/images/Zde7wDFiFTc8SSsVnHvIMhTuP08.jpg',
  'https://framerusercontent.com/images/ux961HljTaWDl4R2sdfmXPbaSc.jpg',
  'https://framerusercontent.com/images/3XO5RkPt160kPn0brNqtmfEJ01I.jpg',
  'https://framerusercontent.com/images/cHGcD8TRh5MhC1esSfKglFUtUmo.jpg',
  'https://framerusercontent.com/images/dKzEi2OUPCV6aqJHkhCJ1VOho.jpg',
  'https://framerusercontent.com/images/vVorcvYfjeVqUk0TiYjr6maGIvM.jpg',
  'https://framerusercontent.com/images/bFIbV9Xvx1yzStu0f9G2TSp3mXY.jpg',
  'https://framerusercontent.com/images/yWcUx6iX01ElimOjFYJsNY0mXE.jpg',
  'https://framerusercontent.com/images/qkPllBt8JnwWiR426UeqSUpLwAU.jpg',
  'https://framerusercontent.com/images/A4aGdsZiY5CuLFFhUbjrNQk.jpg',
  'https://framerusercontent.com/images/FR0sgwggOzd7xIDqNSzDB3EAm0w.jpg',
  'https://framerusercontent.com/images/p1JP25L7JVbhtG2isQdjbWUdvs.jpg'
];

export const IMAGE_URLS: string[] = Array(5).fill(BASE_IMAGE_URLS).flat();

export const TILE_SIZE = { width: 200, height: 300 };
export const GAP = 10;

// Defines the conceptual grid layout of the source images for wrapping logic.
// For 100 images, a 10x10 or 20x5 grid works well.
export const IMAGE_GRID_COLS = 10;


interface InfiniteImageGridProps {
  images?: string[];
}

interface TileProps {
  x: number;
  y: number;
  imageUrl: string;
  gridOffsetX: MotionValue<number>;
  viewportSize: { width: number; height: number };
}

const Tile: React.FC<TileProps> = React.memo(({ x, y, imageUrl, gridOffsetX, viewportSize }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const { width: vpWidth } = viewportSize;
  if (vpWidth === 0) return null;

  const tileScreenX = useTransform(gridOffsetX, (v) => x + v);

  const distFromCenter = useTransform(
    tileScreenX,
    (v) => v + (TILE_SIZE.width + GAP) / 2 - vpWidth / 2
  );

  const rotateY = useTransform(
    distFromCenter,
    [-vpWidth / 1.5, 0, vpWidth / 1.5],
    [40, 0, -40],
    { clamp: false }
  );

  const z = useTransform(
    distFromCenter,
    [-vpWidth / 2, 0, vpWidth / 2],
    [-250, 0, -250],
    { clamp: false }
  );
  
  const scale = useTransform(
    distFromCenter,
    [-vpWidth / 2, 0, vpWidth / 2],
    [0.85, 1, 0.85],
    { clamp: false }
  );
  
  const opacity = useTransform(
    distFromCenter,
    [-vpWidth / 2, 0, vpWidth / 2],
    [0.3, 1, 0.3],
    { clamp: false }
  );

  return (
    <motion.div
      ref={ref}
      className="absolute"
      style={{
        width: TILE_SIZE.width + GAP,
        height: TILE_SIZE.height + GAP,
        left: x,
        top: y,
        rotateY,
        z,
        scale,
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 1, y: 60, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
    >
      <div className="w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
        <motion.img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover rounded-xl shadow-lg"
          draggable="false"
          style={{ opacity }}
        />
      </div>
    </motion.div>
  );
});

const TestPage: React.FC<InfiniteImageGridProps> = ({ images = IMAGE_URLS }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  const x = useMotionValue(-TILE_SIZE.width / 2);
  const y = useMotionValue(-TILE_SIZE.height / 2);
  const tiltX = useTransform(y, (value) => {
    const clamped = Math.max(-600, Math.min(600, value));
    return 12 + clamped / 60;
  });
  const waveSkew = useTransform(x, (value) => {
    const clamped = Math.max(-800, Math.min(800, value));
    return clamped / 700;
  });

  const [_, forceRender] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const unsubscribeX = x.on('change', forceRender);
    const unsubscribeY = y.on('change', forceRender);
    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [x, y]);

  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      setViewportSize({ width: containerWidth, height: containerHeight });
      const cols = Math.ceil(containerWidth / (TILE_SIZE.width + GAP)) + 4;
      const rows = Math.ceil(containerHeight / (TILE_SIZE.height + GAP)) + 4;
      setGridSize({ rows, cols });
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);
    updateDimensions();

    return () => {
      resizeObserver.unobserve(container);
      resizeObserver.disconnect();
    };
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    x.stop();
    y.stop();
    x.set(x.get() - e.deltaX);
    y.set(y.get() - e.deltaY);
  };

  const renderTiles = () => {
    const tiles = [];
    if (gridSize.rows === 0 || gridSize.cols === 0 || images.length === 0) return null;

    const fullTileWidth = TILE_SIZE.width + GAP;
    const fullTileHeight = TILE_SIZE.height + GAP;

    const currentOffsetX = x.get();
    const currentOffsetY = y.get();

    const startCol = Math.floor(-currentOffsetX / fullTileWidth) - 1;
    const endCol = startCol + gridSize.cols;
    const startRow = Math.floor(-currentOffsetY / fullTileHeight) - 1;
    const endRow = startRow + gridSize.rows;

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const numImageRows = Math.ceil(images.length / IMAGE_GRID_COLS);
        const imgCol = (col % IMAGE_GRID_COLS + IMAGE_GRID_COLS) % IMAGE_GRID_COLS;
        const imgRow = (row % numImageRows + numImageRows) % numImageRows;
        const imgIndex = (imgRow * IMAGE_GRID_COLS + imgCol) % images.length;

        if (images[imgIndex]) {
          tiles.push(
            <Tile
              key={`${col}-${row}`}
              x={col * fullTileWidth}
              y={row * fullTileHeight}
              imageUrl={images[imgIndex]}
              gridOffsetX={x}
              viewportSize={viewportSize}
            />
          );
        }
      }
    }
    return tiles;
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden`}
    >
                <div
            ref={containerRef}
            className="mt-10 h-[100dvh] w-full overflow-hidden select-none rounded-2xl bg-transparent md:h-[75vh]"
            onWheel={handleWheel}
            style={{ perspective: '1800px', transformStyle: 'preserve-3d' }}
          >
            <motion.div
              className="relative h-full w-full"
              drag
              dragTransition={{ power: 0.1, timeConstant: 250 }}
              style={{
                x,
                y,
                cursor: 'grab',
                transformStyle: 'preserve-3d',
                rotateX: tiltX,
                skewY: waveSkew,
              }}
              whileTap={{ cursor: 'grabbing' }}
            >
              {renderTiles() || (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                  No images available.
                </div>
              )}
            </motion.div>
          </div>
    </div>
  );
};

export default TestPage;
