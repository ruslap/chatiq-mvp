/**
 * Sound notifications utility for admin panel
 * Provides audio feedback for new messages, like in the chat widget
 */

const SOUND_STORAGE_KEY = 'chtq_admin_sound_enabled';

// Check if sound is enabled (default: true)
export function isSoundEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';
}

// Toggle sound setting
export function setSoundEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
}

// Play a tone using Web Audio API
function playTone(freq: number | number[], duration: number, type: OscillatorType = 'sine'): void {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        const freqs = Array.isArray(freq) ? freq : [freq];

        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.value = f;
            osc.type = type;
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            osc.start(ctx.currentTime + (i * 0.1));
            osc.stop(ctx.currentTime + duration + (i * 0.1));
        });
    } catch (e) {
        console.warn('[Admin Sound] Playback failed:', e);
    }
}

// Sound effects
export const sounds = {
    // Notification sound when new message arrives from visitor
    newMessage: () => {
        if (!isSoundEnabled()) return;
        playTone([500, 700, 900], 0.12, 'sine');
    },
    // Send sound when admin sends a message
    send: () => {
        if (!isSoundEnabled()) return;
        playTone(800, 0.08, 'sine');
    },
    // Subtle notification for new chat
    newChat: () => {
        if (!isSoundEnabled()) return;
        playTone([400, 600, 800], 0.15, 'sine');
    },
};

export default sounds;
