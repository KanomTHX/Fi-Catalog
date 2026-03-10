// Code 39 barcode encoder
const CODE39_CHARS: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnn', '6': 'nnwwwnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwn', '9': 'nnwwnnwn', 'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw',
  'C': 'wnwnnwnn', 'D': 'nnnnwwnnw', 'E': 'wnnnwwnn', 'F': 'nnwnwwnn',
  'G': 'nnnnnwwnw', 'H': 'wnnnnwwn', 'I': 'nnwnnwwn', 'J': 'nnnnwwwn',
  'K': 'wnnnnnnww', 'L': 'nnwnnnnww', 'M': 'wnwnnnnw', 'N': 'nnnnwnnww',
  'O': 'wnnnwnnw', 'P': 'nnwnwnnw', 'Q': 'nnnnnnwww', 'R': 'wnnnnnww',
  'S': 'nnwnnnww', 'T': 'nnnnwnww', 'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw',
  'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwn', ' ': 'nwwnnnwn', '$': 'nwnwnwnn',
  '/': 'nwnwnnnw', '+': 'nwnnnwnw', '%': 'nnnwnwnw', '*': 'nwnnwnwn',
};

function patternToBars(pattern: string): boolean[] {
  const bars: boolean[] = [];
  for (let i = 0; i < pattern.length; i++) {
    const isBar = i % 2 === 0;
    const isWide = pattern[i] === 'w';
    const width = isWide ? 3 : 1;
    for (let j = 0; j < width; j++) {
      bars.push(isBar);
    }
  }
  return bars;
}

export function encodeCode39(text: string): boolean[] {
  const upper = text.toUpperCase();
  const allBars: boolean[] = [];

  // Start character *
  allBars.push(...patternToBars(CODE39_CHARS['*']));
  allBars.push(false); // gap

  for (const ch of upper) {
    const pattern = CODE39_CHARS[ch];
    if (!pattern) continue;
    allBars.push(...patternToBars(pattern));
    allBars.push(false); // gap
  }

  // Stop character *
  allBars.push(...patternToBars(CODE39_CHARS['*']));

  return allBars;
}

export function renderCode39ToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options: { width?: number; height?: number; barColor?: string } = {}
) {
  const { width = 300, height = 60, barColor = '#000' } = options;
  const bars = encodeCode39(text);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  const barWidth = width / bars.length;
  ctx.fillStyle = barColor;
  for (let i = 0; i < bars.length; i++) {
    if (bars[i]) {
      ctx.fillRect(i * barWidth, 0, barWidth, height);
    }
  }
}
