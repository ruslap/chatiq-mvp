let soundEnabled =
  localStorage.getItem("chatiq_sound_enabled") !== "false";

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  localStorage.setItem("chatiq_sound_enabled", String(enabled));
}

export function playTone(
  freq: number | number[],
  duration: number,
  type: OscillatorType = "sine",
): void {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const freqs = Array.isArray(freq) ? freq : [freq];

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = f;
      osc.type = type;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + duration,
      );

      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + duration + i * 0.1);
    });
  } catch (e) {
    console.warn("[ChatIQ] Sound playback failed:", e);
  }
}

export const sounds = {
  send: (): void => playTone(800, 0.1, "sine"),
  receive: (): void => playTone(600, 0.15, "sine"),
  notification: (): void => playTone([600, 800], 0.1, "sine"),
  click: (): void => playTone(400, 0.05, "sine"),
  close: (): void => playTone(300, 0.1, "sine"),
};
