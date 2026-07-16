 
import twConfig from '../../../../../../tailwind.config.js';

export const twColor = (color: string) => (twConfig as any).theme?.colors?.[color];
