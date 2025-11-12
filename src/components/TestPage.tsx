import React from 'react';
import { motion, useAnimationFrame } from 'framer-motion';

const columns = 24;
const rows = 11;
const tileGap = 16;
const baseTileWidth = 220;
const baseTileHeight = 260;

const imageSources = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1502720705749-3c42b953d3ab?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1502980426475-b83966705988?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1471357674240-e1a485acb3e1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1504203700686-f21e703e3e59?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1472457897821-70d3819a0e24?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1524503033411-c9566986fc8f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1493119508027-2b584f234d6c?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1521316730702-829a8e30dfd1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1558981403-c5f9891ba31a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517249372651-51384ff07f03?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80'
];

const computeTileDimensions = () => {
  return {
    width: baseTileWidth,
    height: baseTileHeight
  };
};

interface UsePlaneControlsReturn {
  pointerHandlers: {
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
    onPointerLeave: (event: React.PointerEvent) => void;
  };
  offset: React.MutableRefObject<{ x: number; y: number }>;
  velocity: React.MutableRefObject<{ x: number; y: number }>;
  dragging: React.MutableRefObject<boolean>;
}

const usePlaneControls = (): UsePlaneControlsReturn => {
  const offset = React.useRef({ x: 0, y: 0 });
  const velocity = React.useRef({ x: 0, y: 0 });
  const dragging = React.useRef(false);
  const lastPointer = React.useRef({ x: 0, y: 0 });
  const lastTimestamp = React.useRef<number | null>(null);

  const handlePointerDown = (event: React.PointerEvent) => {
    dragging.current = true;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    lastTimestamp.current = event.timeStamp;
    if (event.currentTarget?.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragging.current) return;

    const dx = event.clientX - lastPointer.current.x;
    const dy = event.clientY - lastPointer.current.y;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    const now = event.timeStamp;
    const dt = Math.max(1, now - (lastTimestamp.current ?? now));
    lastTimestamp.current = now;

    offset.current = {
      x: offset.current.x + dx,
      y: offset.current.y + dy
    };

    velocity.current = {
      x: dx / dt,
      y: dy / dt
    };
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    dragging.current = false;
    lastTimestamp.current = event.timeStamp;
    if (event.currentTarget?.releasePointerCapture) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerLeave = () => {
    dragging.current = false;
  };

  React.useEffect(() => {
    const cancelDrag = () => {
      dragging.current = false;
    };

    window.addEventListener('pointerup', cancelDrag);
    window.addEventListener('pointercancel', cancelDrag);
    return () => {
      window.removeEventListener('pointerup', cancelDrag);
      window.removeEventListener('pointercancel', cancelDrag);
    };
  }, []);

  return {
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave
    },
    offset,
    velocity,
    dragging
  };
};

const InfinitePlaneGallery: React.FC = () => {
  const { pointerHandlers, offset, velocity, dragging } = usePlaneControls();
  const tiles = React.useMemo(
    () =>
      Array.from({ length: rows * columns }, (_, index) => ({
        id: index,
        src: imageSources[index % imageSources.length]
      })),
    []
  );
  const tileSize = React.useMemo(computeTileDimensions, []);
  const [planeOffset, setPlaneOffset] = React.useState({ x: 0, y: 0 });

  useAnimationFrame((_, delta) => {
    const friction = Math.pow(0.9, delta / 16);
    velocity.current = {
      x: velocity.current.x * friction,
      y: velocity.current.y * friction
    };

    if (!dragging.current) {
      if (Math.abs(velocity.current.x) < 0.0001) velocity.current.x = 0;
      if (Math.abs(velocity.current.y) < 0.0001) velocity.current.y = 0;
      offset.current = {
        x: offset.current.x + velocity.current.x * delta,
        y: offset.current.y + velocity.current.y * delta
      };
    }

    setPlaneOffset({
      x: offset.current.x,
      y: offset.current.y
    });
  });

  const stepX = tileSize.width + tileGap;
  const stepY = tileSize.height + tileGap;

  const wrap = (value: number, step: number) => {
    const mod = value % step;
    return mod < 0 ? mod + step : mod;
  };

  const normalizedOffsetX = wrap(planeOffset.x, stepX);
  const normalizedOffsetY = wrap(planeOffset.y, stepY);

  const extraTiles = 4;
  const startX = normalizedOffsetX - stepX * extraTiles;
  const startY = normalizedOffsetY - stepY * extraTiles;

  const columnShift = Math.floor(planeOffset.x / stepX);
  const rowShift = Math.floor(planeOffset.y / stepY);

  const rowsToRender = rows + extraTiles * 2 + 2;
  const colsToRender = columns + extraTiles * 2 + 2;

  return (
    <div
      className="relative w-full overflow-hidden rounded-[48px] border border-white/10 bg-black/80 p-6 sm:p-8"
      style={{
        boxShadow: '0 80px 160px -120px rgba(79, 70, 229, 0.65)'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-transparent to-[#020202]" />

      <main
        className="relative h-[480px] w-full touch-none select-none sm:h-[560px] lg:h-[640px]"
        style={{ cursor: 'grab' }}
        {...pointerHandlers}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0">
            {Array.from({ length: rowsToRender }).map((_, row) => {
              const y = startY + row * stepY;
              const logicalRow = row - extraTiles + rowShift;
              const sourceRow = ((logicalRow % rows) + rows) % rows;

              return Array.from({ length: colsToRender }).map((__, col) => {
                const x = startX + col * stepX;
                const logicalCol = col - extraTiles + columnShift;
                const sourceCol = ((logicalCol % columns) + columns) % columns;
                const tileIndex = sourceRow * columns + sourceCol;
                const tile = tiles[tileIndex];

                return (
                  <div
                    key={`${row}-${col}`}
                    className="absolute"
                    style={{
                      width: tileSize.width,
                      height: tileSize.height,
                      transform: `translate3d(${x}px, ${y}px, 0)`
                    }}
                  >
                    <motion.div
                      className="relative h-full w-full overflow-hidden rounded-[26px] border border-white/10 bg-[#101010] shadow-[0_18px_45px_-24px_rgba(0,0,0,0.65)]"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 28 }}
                    >
                      <img
                        src={tile.src}
                        alt={`Gallery tile ${tile.id}`}
                        draggable={false}
                        className="h-full w-full object-cover"
                        style={{ filter: 'saturate(1.05)' }}
                      />
                    </motion.div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </main>

      <div className="pointer-events-none absolute inset-0 rounded-[48px] border border-white/10 opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_55%,rgba(0,0,0,0.65)_100%)]" />
    </div>
  );
};

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#070714] to-[#090821] text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 text-center">
       

        <InfinitePlaneGallery />
      </div>
    </div>
  );
};

export default TestPage;