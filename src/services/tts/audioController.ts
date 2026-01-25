/**
 * Unified Audio Controller
 * Manages playback, state, and mutex for all TTS operations.
 */

let activeAudio: HTMLAudioElement | null = null;
let isStopping = false;

export const AudioController = {
    /**
     * Play an audio element exclusively, stopping any previous playback.
     */
    async play(audio: HTMLAudioElement): Promise<void> {
        if (!audio) return;

        await this.stop();

        activeAudio = audio;

        return new Promise((resolve, reject) => {
            audio.onended = () => {
                activeAudio = null;
                resolve();
            };

            audio.onerror = (err) => {
                console.error("[AudioController] Playback error:", err);
                activeAudio = null;
                reject(err);
            };

            audio.play().catch(err => {
                if (err.name !== 'AbortError') {
                    console.error("[AudioController] Play error:", err);
                }
                activeAudio = null;
                reject(err);
            });
        });
    },

    /**
     * Stop all playback and clear state.
     * Uses a mutex flag to prevent redundant loops.
     */
    async stop(): Promise<void> {
        if (isStopping) return;
        isStopping = true;

        try {
            if (activeAudio) {
                activeAudio.pause();
                activeAudio.currentTime = 0;
                // Revoke URL if it was a blob
                if (activeAudio.src.startsWith('blob:')) {
                    URL.revokeObjectURL(activeAudio.src);
                }
                activeAudio = null;
                console.log("[AudioController] Audio stopped");
            }

            // Also cancel native speech if any
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        } finally {
            isStopping = false;
        }
    },

    isSpeaking(): boolean {
        return activeAudio !== null || (window.speechSynthesis?.speaking ?? false);
    }
};

// Global polyfill for legacy code
if (typeof window !== 'undefined') {
    (window as any).stopTtsSpeaking = () => AudioController.stop();
}
