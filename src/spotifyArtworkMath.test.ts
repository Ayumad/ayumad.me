import { describe, expect, it } from "vitest";
import {
  asciiGlyphForLuminance,
  bayerThreshold,
  pixelLuminance,
  sampleArtworkParticles,
} from "./spotifyArtworkMath";

describe("Spotify artwork sampling", () => {
  it("maps image luminance into bounded ASCII glyphs", () => {
    expect(pixelLuminance(0, 0, 0)).toBe(0);
    expect(pixelLuminance(255, 255, 255)).toBeCloseTo(1);
    expect(asciiGlyphForLuminance(-1)).toBe(" ");
    expect(asciiGlyphForLuminance(1)).toBe("@");
    expect(asciiGlyphForLuminance(2)).toBe("@");
  });

  it("uses every ordered Bayer threshold exactly once per tile", () => {
    const thresholds = Array.from({ length: 16 }, (_, index) =>
      bayerThreshold(index % 4, Math.floor(index / 4)),
    );

    expect(new Set(thresholds).size).toBe(16);
    expect(Math.min(...thresholds)).toBeGreaterThan(0);
    expect(Math.max(...thresholds)).toBeLessThan(1);
  });

  it("generates deterministic, bounded artwork particles", () => {
    const width = 48;
    const height = 48;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let index = 0; index < data.length; index += 4) {
      data[index] = (index / 4) % 255;
      data[index + 1] = 180;
      data[index + 2] = 220;
      data[index + 3] = 255;
    }

    const first = sampleArtworkParticles(data, width, height, 120);
    const second = sampleArtworkParticles(data, width, height, 120);

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
    expect(first.length).toBeLessThanOrEqual(120);
    for (const particle of first) {
      expect(particle.x).toBeGreaterThanOrEqual(0);
      expect(particle.x).toBeLessThanOrEqual(1);
      expect(particle.y).toBeGreaterThanOrEqual(0);
      expect(particle.y).toBeLessThanOrEqual(1);
    }
  });
});
