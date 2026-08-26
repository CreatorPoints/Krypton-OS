/* ==========================================================================
   PhotonOS - Web Audio API Synthesizer Engine
   ========================================================================== */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = localStorage.getItem('krypton_sound_enabled') !== 'false';
        const savedVol = localStorage.getItem('krypton_master_volume');
        this.volume = savedVol !== null ? parseFloat(savedVol) : 0.8;
        this.muted = localStorage.getItem('krypton_master_muted') === 'true';
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

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.volume > 0 && this.muted) {
            this.muted = false;
            localStorage.setItem('krypton_master_muted', 'false');
        }
        localStorage.setItem('krypton_master_volume', this.volume.toString());
        window.dispatchEvent(new CustomEvent('krypton_sound_volume_changed', {
            detail: { volume: this.volume, muted: this.muted, enabled: this.enabled }
        }));
    }

    setMuted(isMuted) {
        this.muted = !!isMuted;
        localStorage.setItem('krypton_master_muted', this.muted.toString());
        window.dispatchEvent(new CustomEvent('krypton_sound_volume_changed', {
            detail: { volume: this.volume, muted: this.muted, enabled: this.enabled }
        }));
    }

    toggleMute() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    setEnabled(isEnabled) {
        this.enabled = !!isEnabled;
        localStorage.setItem('krypton_sound_enabled', this.enabled.toString());
        window.dispatchEvent(new CustomEvent('krypton_sound_volume_changed', {
            detail: { volume: this.volume, muted: this.muted, enabled: this.enabled }
        }));
    }

    playTone(freq, type = 'sine', duration = 0.1, volume = 0.15) {
        if (!this.enabled || this.muted || this.volume <= 0) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            const effectiveVol = Math.max(0.0001, volume * this.volume);
            gain.gain.setValueAtTime(effectiveVol, this.ctx.currentTime);
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

    playTrash() {
        this.playTone(320, 'sine', 0.05, 0.12);
        setTimeout(() => this.playTone(220, 'triangle', 0.08, 0.12), 40);
        setTimeout(() => this.playTone(140, 'sawtooth', 0.12, 0.1), 90);
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
