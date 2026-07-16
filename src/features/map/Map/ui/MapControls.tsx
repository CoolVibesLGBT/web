import { motion } from 'framer-motion';
import type { LatLngExpression } from 'leaflet';
import { ZoomInButton } from './ZoomInButton';
import { ZoomOutButton } from './ZoomOutButton';
import { LocateButton } from './LocateButton';
import { CenterButton } from './CenterButton';
import { useTheme } from '../../../../contexts/ThemeContext';

interface MapControlsProps {
    center: LatLngExpression;
    zoom: number;
}

export const MapControls = ({ center, zoom }: MapControlsProps) => {
    const { theme } = useTheme();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className="absolute top-1/2 right-6 -translate-y-1/2 z-[1000] flex flex-col gap-2"
        >
            {/* Zoom Controls Panel */}
            <div className={`flex flex-col rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden ${theme === 'dark'
                ? 'cv-card-surface-soft border-white/10'
                : 'bg-white/70 border-black/5'
                }`}>
                <ZoomInButton />
                <div className={`h-px w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`} />
                <ZoomOutButton />
            </div>

            {/* Utility Controls Panel */}
            <div className={`flex flex-col rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden ${theme === 'dark'
                ? 'cv-card-surface-soft border-white/10'
                : 'bg-white/70 border-black/5'
                }`}>
                <LocateButton />
                <div className={`h-px w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`} />
                <CenterButton center={center} zoom={zoom} />
            </div>
        </motion.div>
    );
};
