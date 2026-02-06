type AudioCacheEntry = {
  audio: HTMLAudioElement;
};

const audioCache = new Map<string, AudioCacheEntry>();

function getAudio(url: string): HTMLAudioElement {
  const cached = audioCache.get(url);
  if (cached) return cached.audio;

  const audio = new Audio(url);
  audio.preload = "auto";
  audioCache.set(url, { audio });
  return audio;
}

export const soundEffects = {
  preload(url: string): void {
    if (!url) return;

    try {
      const audio = getAudio(url);
      // Hint browser to start fetching/decoding
      audio.load();
    } catch {
      // Ignore preload failures
    }
  },

  async play(url: string): Promise<void> {
    if (!url) return;

    try {
      const audio = getAudio(url);
      if (audio.readyState < 2) {
        // Ensure fetch starts ASAP (helps on first play)
        audio.load();
      }
      // Rewind so repeated triggers play immediately
      audio.currentTime = 0;
      await audio.play();
    } catch (err) {
      // Autoplay restrictions or missing file should not break recognition flow
      console.debug("Sound play blocked/failed:", err);
    }
  },
};
