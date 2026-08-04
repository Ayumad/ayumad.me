const ASCII_RAMP = " .:-=+*#%@";
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

export interface ArtworkParticle {
  x: number;
  y: number;
  radius: number;
  phase: number;
  tone: number;
}

export function pixelLuminance(red: number, green: number, blue: number) {
  return (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
}

export function asciiGlyphForLuminance(luminance: number) {
  const bounded = Math.min(1, Math.max(0, luminance));
  return ASCII_RAMP[Math.round(bounded * (ASCII_RAMP.length - 1))];
}

export function bayerThreshold(x: number, y: number) {
  return (BAYER_4[y % 4][x % 4] + 0.5) / 16;
}

export function sampleArtworkParticles(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  maximum = 280,
) {
  const particles: ArtworkParticle[] = [];
  const stride = Math.max(2, Math.ceil(Math.sqrt((width * height) / maximum)));

  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const index = (y * width + x) * 4;
      if (data[index + 3] < 80) continue;
      const tone = pixelLuminance(data[index], data[index + 1], data[index + 2]);
      const selection = ((x * 17 + y * 31) % 100) / 100;
      if (selection > Math.max(0.18, tone)) continue;
      particles.push({
        x: x / Math.max(1, width - 1),
        y: y / Math.max(1, height - 1),
        radius: 0.75 + tone * 1.45,
        phase: ((x * 13 + y * 7) % 360) * (Math.PI / 180),
        tone,
      });
      if (particles.length >= maximum) return particles;
    }
  }

  return particles;
}
