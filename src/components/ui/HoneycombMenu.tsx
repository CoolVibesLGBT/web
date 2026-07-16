import React, { useRef, useMemo } from 'react';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';

export interface HoneycombNode {
    id: string;
    label: string;
    icon?: React.ReactNode;
    color: string;
    isSelected?: boolean;
    isCenter?: boolean;
}

interface HoneycombMenuProps {
    nodes: HoneycombNode[];
    onNodeClick: (node: HoneycombNode) => void;
    onClose: () => void;
}

export const HoneycombMenu: React.FC<HoneycombMenuProps> = ({ nodes, onNodeClick, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const nodeSize = 80; // Diameter of each node
    const spacing = 10;
    const D = nodeSize + spacing;

    // Define exactly 15 layout positions
    // Ring 0 (1), Ring 1 (6), Ring 2 (selected 8)
    const layout = useMemo(() => [
        { r: 0, c: 0 }, // Center
        // Ring 1
        { r: 0, c: -1 }, { r: 0, c: 1 },
        { r: -1, c: -0.5 }, { r: -1, c: 0.5 },
        { r: 1, c: -0.5 }, { r: 1, c: 0.5 },
        // Ring 2 (8 items)
        { r: -2, c: -1 }, { r: -2, c: 0 }, { r: -2, c: 1 },
        { r: 2, c: -1 }, { r: 2, c: 0 }, { r: 2, c: 1 },
        { r: -1, c: -1.5 }, { r: 1, c: -1.5 }
    ], []);

    const mappedNodes = useMemo(() => {
        return nodes.slice(0, 15).map((node, i) => {
            const pos = layout[i] || { r: 0, c: 0 };
            return {
                ...node,
                x: pos.c * D,
                y: pos.r * D * (Math.sqrt(3) / 2)
            };
        });
    }, [nodes, D, layout]);

    const panX = useMotionValue(0);
    const panY = useMotionValue(0);

    // References to node DOM elements to update their scale directly for performance
    const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useAnimationFrame(() => {
        if (!containerRef.current) return;

        // Calculate the center of the viewport relative to the container
        // const vw = window.innerWidth;
        // const vh = window.innerHeight;

        const currentPanX = panX.get();
        const currentPanY = panY.get();

        nodeRefs.current.forEach((el, index) => {
            if (!el) return;
            const node = mappedNodes[index];
            if (!node) return;

            // Global position of this node's center on screen
            // The container is centered at (vw/2, vh/2) via CSS flex
            // so we just add pan to the node's local x/y
            const globalX = node.x + currentPanX;
            const globalY = node.y + currentPanY;

            const dist = Math.sqrt(globalX * globalX + globalY * globalY);

            // Apple Watch scaling logic
            const flatRadius = 50; // Inner circle where scale is 1
            const maxDist = 200; // Distance over which it shrinks
            let scale = 1;
            let opacity = 1;

            if (dist > flatRadius) {
                scale = Math.max(0.3, 1 - (dist - flatRadius) / maxDist);
                opacity = Math.max(0, 1 - (dist - flatRadius) / (maxDist * 1.5));
            }

            el.style.transform = `translate3d(${node.x}px, ${node.y}px, 0) scale(${scale})`;
            el.style.opacity = String(opacity);
            el.style.zIndex = Math.round(scale * 100).toString();
        });
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl overflow-hidden flex items-center justify-center touch-none"
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 z-[210] p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Draggable Area */}
            <motion.div
                className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                drag
                dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
                dragElastic={0.2}
                style={{ x: panX, y: panY }}
            >
                {/* Center anchor container (0,0) is center of screen */}
                <div className="relative flex items-center justify-center w-0 h-0">
                    {mappedNodes.map((node, idx) => (
                        <button
                            key={node.id}
                            ref={el => { nodeRefs.current[idx] = el; }}
                            onClick={() => onNodeClick(node)}
                            className={`absolute flex flex-col items-center justify-center rounded-full shadow-xl transition-colors
                                ${node.isCenter ? 'ring-4 ring-white/50' : ''}
                                ${node.isSelected ? 'ring-4 ring-emerald-400' : ''}
                            `}
                            style={{
                                width: nodeSize,
                                height: nodeSize,
                                left: -nodeSize / 2, // Center the element on its x,y
                                top: -nodeSize / 2,
                                backgroundColor: node.color,
                                // We use initial translate here so it renders correctly before first animation frame
                                transform: `translate3d(${node.x}px, ${node.y}px, 0) scale(1)`,
                            }}
                        >
                            <span className="text-white drop-shadow-md pb-1">
                                {node.icon}
                            </span>
                            <span className="text-white text-[10px] font-bold leading-tight text-center px-1 max-w-full truncate drop-shadow-md">
                                {node.label}
                            </span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Hint overlay */}
            <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none z-[205]">
                <p className="text-white/60 text-sm font-medium tracking-wide">
                    Drag to explore • Tap to select
                </p>
            </div>
        </motion.div>
    );
};
