import twConfig from '#root/tailwind.config';

// @ts-ignore
export const twColor = (color: string) => twConfig.theme.colors[color];
