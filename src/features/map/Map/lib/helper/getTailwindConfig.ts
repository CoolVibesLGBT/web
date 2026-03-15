/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - module alias '#root/tailwind.config' requires vite plugin resolution
import twConfig from '#root/tailwind.config';

export const twColor = (color: string) => (twConfig as any).theme?.colors?.[color];
