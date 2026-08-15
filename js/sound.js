/* ==========================================================================
   PhotonOS - Web Audio API Synthesizer Engine
   ========================================================================== */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type = 'sine', duration = 0.1, volume = 0.15) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Audio context safely ignored if blocked
        }
    }

    playClick() {
        this.playTone(800, 'sine', 0.04, 0.1);
    }

    playWindowOpen() {
        this.playTone(440, 'triangle', 0.08, 0.12);
        setTimeout(() => this.playTone(880, 'triangle', 0.12, 0.12), 60);
    }

    playWindowClose() {
        this.playTone(660, 'triangle', 0.08, 0.1);
        setTimeout(() => this.playTone(330, 'triangle', 0.12, 0.1), 60);
    }

    playError() {
        this.playTone(150, 'sawtooth', 0.15, 0.2);
        setTimeout(() => this.playTone(110, 'sawtooth', 0.2, 0.2), 100);
    }

    playSuccess() {
        this.playTone(523.25, 'sine', 0.08, 0.15); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.08, 0.15), 70); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.14, 0.15), 140); // G5
    }

    playPetHappy() {
        this.playTone(587.33, 'sine', 0.06, 0.18);
        setTimeout(() => this.playTone(880, 'sine', 0.08, 0.18), 50);
        setTimeout(() => this.playTone(1174.66, 'sine', 0.1, 0.18), 110);
    }

    playPetEat() {
        this.playTone(300, 'square', 0.05, 0.1);
        setTimeout(() => this.playTone(450, 'square', 0.05, 0.1), 50);
        setTimeout(() => this.playTone(600, 'square', 0.05, 0.1), 100);
    }

    playTerminalKey() {
        this.playTone(1200 + Math.random() * 400, 'sine', 0.02, 0.03);
    }

    playAntigravity() {
        this.playTone(200, 'sine', 0.3, 0.15);
        if (!this.enabled || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.6);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.6);
        } catch (e) {}
    }

    playGlitchSting() {
        this.playTone(90, 'sawtooth', 0.25, 0.25);
    }
}

export const sound = new SoundEngine();
