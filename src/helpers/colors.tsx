
export const RainbowRankStyleEx: Array<{ background: string; color: string }> = [
  {
    background: 'linear-gradient(135deg, #FF3B30 0%, #FF6B3B 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #FF9500 0%, #FFD60A 100%)',
    color: '#1f2937',
  },
  {
    background: 'linear-gradient(135deg, #FFD60A 0%, #34C759 100%)',
    color: '#1f2937',
  },
  {
    background: 'linear-gradient(135deg, #34C759 0%, #32D74B 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #5856D6 0%, #5E5CE6 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #AF52DE 0%, #FF2D55 100%)',
    color: '#ffffff',
  },
];

export const RainbowRankStyles: Array<{ background: string; color: string }> = [
  {
    background: 'linear-gradient(135deg, #FF3B30 0%, #FF6B3B 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #FF453A 0%, #FF7A45 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #FF6B6B 0%, #FF3B30 100%)',
    color: '#ffffff',
  },

  {
    background: 'linear-gradient(135deg, #FF9500 0%, #FFD60A 100%)',
    color: '#1f2937',
  },
  {
    background: 'linear-gradient(135deg, #FF9F0A 0%, #FFCC00 100%)',
    color: '#1f2937',
  },
  {
    background: 'linear-gradient(135deg, #FFD60A 0%, #FF9500 100%)',
    color: '#1f2937',
  },

  {
    background: 'linear-gradient(135deg, #FFD60A 0%, #34C759 100%)',
    color: '#1f2937',
  },
  {
    background: 'linear-gradient(135deg, #FFE066 0%, #30D158 100%)',
    color: '#1f2937',
  },

  {
    background: 'linear-gradient(135deg, #34C759 0%, #32D74B 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #30D158 0%, #66E27F 100%)',
    color: '#ffffff',
  },

  {
    background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #0A84FF 0%, #64D2FF 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #5AC8FA 0%, #007AFF 100%)',
    color: '#ffffff',
  },

  {
    background: 'linear-gradient(135deg, #5856D6 0%, #5E5CE6 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #6E6BE8 0%, #5856D6 100%)',
    color: '#ffffff',
  },

  {
    background: 'linear-gradient(135deg, #AF52DE 0%, #FF2D55 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #BF5AF2 0%, #FF375F 100%)',
    color: '#ffffff',
  },
  {
    background: 'linear-gradient(135deg, #DA77F2 0%, #FF2D55 100%)',
    color: '#ffffff',
  },
];


// Gradient’lerden hex renkleri çıkart
function extractHexColors(styles: typeof RainbowRankStyles): string[] {
  const hexColors: string[] = [];
  styles.forEach(s => {
    const matches = s.background.match(/#([0-9a-fA-F]{3,6})/g);
    if (matches) hexColors.push(...matches);
  });
  return hexColors;
}


// Basit string -> number hash fonksiyonu
function stringToSeed(str: string): number {
  const safe = typeof str === 'string' ? str : String(str ?? '');
  let hash = 0;
  for (let i = 0; i < safe.length; i++) {
    hash = (hash << 5) - hash + safe.charCodeAt(i);
    hash |= 0; // 32-bit integer
  }
  return Math.abs(hash);
}

// Seeded random aynı şekilde
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const pickSeededColorsString = (seed: string, count = 3): string => {
  const extractedColors = extractHexColors(RainbowRankStyles).map(c => c.replace('#', ''));

  // fallback renkler eğer extractHexColors boş dönerse
  const colors = extractedColors.length > 0 ? extractedColors : ['FF0000', '00FF00', '0000FF'];

  const numericSeed = stringToSeed(seed);

  const selected: string[] = [];

  for (let i = 0; i < count; i++) {
    const idx = Math.floor(seededRandom(numericSeed + i) * colors.length) % colors.length;
    selected.push(colors[idx]);
  }

  return selected.join(',');
};


export const tagNameToColor = (seed: string): React.CSSProperties => {
  const numericSeed = stringToSeed(seed);

  const index = numericSeed % RainbowRankStyles.length;

  return {
    background: RainbowRankStyles[index].background,
    color: RainbowRankStyles[index].color,
  };
};