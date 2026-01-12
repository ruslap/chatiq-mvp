/**
 * Sound notifications utility for admin panel
 * Provides audio feedback for new messages, like in the chat widget
 */

const SOUND_STORAGE_KEY = 'chtq_admin_sound_enabled';
const MUTED_CHATS_KEY = 'chtq_admin_muted_chats';

// Check if sound is enabled globally (default: true)
export function isGlobalSoundEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';
}

// Check if a specific chat is muted
export function isChatMuted(chatId: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const mutedChats = JSON.parse(localStorage.getItem(MUTED_CHATS_KEY) || '[]');
        return Array.isArray(mutedChats) && mutedChats.includes(chatId);
    } catch {
        return false;
    }
}

// Toggle mute for a specific chat
export function setChatMuted(chatId: string, muted: boolean): void {
    if (typeof window === 'undefined') return;
    try {
        const mutedChats = JSON.parse(localStorage.getItem(MUTED_CHATS_KEY) || '[]');
        const newMutedChats = muted
            ? [...new Set([...mutedChats, chatId])]
            : mutedChats.filter((id: string) => id !== chatId);

        localStorage.setItem(MUTED_CHATS_KEY, JSON.stringify(newMutedChats));
    } catch (e) {
        console.error('Failed to update muted chats:', e);
    }
}

// Check if sound should play for a specific chat
export function shouldPlaySoundForChat(chatId?: string): boolean {
    if (!isGlobalSoundEnabled()) return false;
    if (chatId && isChatMuted(chatId)) return false;
    return true;
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
    newMessage: (chatId?: string) => {
        if (!shouldPlaySoundForChat(chatId)) return;
        playTone([500, 700, 900], 0.12, 'sine');
    },
    // Send sound when admin sends a message
    send: (chatId?: string) => {
        if (!shouldPlaySoundForChat(chatId)) return;
        playTone(800, 0.08, 'sine');
    },
    // Subtle notification for new chat
    newChat: () => {
        if (!shouldPlaySoundForChat()) return;
        playTone([400, 600, 800], 0.15, 'sine');
    },
};

export default sounds;
