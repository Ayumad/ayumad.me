/**
 * Curated artist → genre map. Spotify's dev-tier API strips genres from
 * catalog responses, so known artists in Ayush's listening lanes get their
 * genres from here. Keyed by lowercase artist name; additive with any
 * API-provided genres. Add artists as they show up in listening.
 *
 * Lanes (from listening context): dreamy indie pop, shoegaze/grungegaze
 * incl. JP/CN thread, art-pop, electroclash-adjacent, indie canon,
 * album-driven hip hop.
 */
export const CURATED_GENRES: Record<string, string[]> = {
  "the marías": ["dream pop", "indie pop"],
  julie: ["shoegaze", "grungegaze"],
  "she's green": ["shoegaze", "indie rock"],
  glare: ["shoegaze", "grunge"],
  midrift: ["shoegaze", "indie rock"],
  slowdive: ["shoegaze", "dream pop"],
  "cocteau twins": ["dream pop", "ethereal wave"],
  "magdalena bay": ["art pop", "electropop"],
  "charli xcx": ["art pop", "hyperpop"],
  ninajirachi: ["electroclash", "hyperpop"],
  "snow strippers": ["electroclash", "electronic"],
  "jane remover": ["hyperpop", "glitch pop"],
  radiohead: ["art rock", "alternative rock"],
  "the strokes": ["garage rock", "indie rock"],
  "car seat headrest": ["indie rock", "lo-fi"],
  "tyler, the creator": ["hip hop", "alternative hip hop"],
  "the radio dept.": ["dream pop", "indie pop"],
  "part time": ["indie pop", "jangle pop"],
};

export function genresForArtist(artistName: string): string[] {
  const key = artistName.toLowerCase().trim();
  return CURATED_GENRES[key] ?? [];
}
