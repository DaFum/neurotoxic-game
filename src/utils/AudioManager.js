import { Howl, Howler } from 'howler';

class AudioSystem {
    constructor() {
        this.music = null;
        this.sfx = {};
        this.musicVolume = 0.5;
        this.sfxVolume = 0.5;
        this.muted = false;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Load preferences
            const savedMusicVol = localStorage.getItem('neurotoxic_vol_music');
            const savedSfxVol = localStorage.getItem('neurotoxic_vol_sfx');
            const savedMuted = localStorage.getItem('neurotoxic_muted');

            this.musicVolume = savedMusicVol ? parseFloat(savedMusicVol) : 0.5;
            this.sfxVolume = savedSfxVol ? parseFloat(savedSfxVol) : 0.5;
            this.muted = savedMuted === 'true';

            // Apply global mute
            Howler.mute(this.muted);

            // Preload SFX
            await this.loadSFX();

            this.initialized = true;
        } catch (error) {
            console.error('[AudioSystem] Initialization failed:', error);
            // Graceful fallback: audio might just not play, but app shouldn't crash.
        }
    }

    async loadSFX() {
        const sfxUrls = {
            hit: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
            miss: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
            menu: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
            travel: 'https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3'
        };

        const loadPromises = Object.entries(sfxUrls).map(([key, url]) => {
            return new Promise((resolve) => {
                const sound = new Howl({
                    src: [url],
                    volume: this.sfxVolume,
                    onload: () => resolve(),
                    onloaderror: () => {
                        console.warn(`[AudioSystem] Failed to load SFX: ${key}`);
                        resolve(); // Resolve anyway to not block init
                    }
                });
                this.sfx[key] = sound;
            });
        });

        await Promise.all(loadPromises);
    }

    playMusic(songId) {
        if (!this.initialized) return;

        if (this.music) {
            this.music.stop();
        }

        const src = this.getAudioSrc(songId);
        
        this.music = new Howl({
            src: [src],
            html5: true, 
            loop: songId === 'ambient',
            volume: this.musicVolume
        });

        this.music.play();
        return this.music;
    }

    startAmbient() {
        if (!this.initialized) return;
        // Prevent restarting if already playing ambient
        if (this.music && this.music.loop()) return;
        const music = this.playMusic('ambient');
        if (music) {
            music.volume(this.musicVolume * 0.3); // Lower volume for background stream
        }
    }

    stopMusic() {
        if (this.music) this.music.stop();
    }

    playSFX(key) {
        if (!this.initialized) return;
        if (this.sfx[key]) {
            // Update volume in case it changed
            this.sfx[key].volume(this.sfxVolume);
            this.sfx[key].play();
        }
    }

    setMusicVolume(vol) {
        this.musicVolume = vol;
        localStorage.setItem('neurotoxic_vol_music', vol);
        if (this.music) {
            this.music.volume(vol);
        }
    }

    setSFXVolume(vol) {
        this.sfxVolume = vol;
        localStorage.setItem('neurotoxic_vol_sfx', vol);
        // Update all SFX instances
        Object.values(this.sfx).forEach(sound => sound.volume(vol));
    }

    toggleMute() {
        this.muted = !this.muted;
        Howler.mute(this.muted);
        localStorage.setItem('neurotoxic_muted', this.muted);
        return this.muted;
    }

    getAudioSrc(songId) {
        if (songId === 'ambient') return 'https://moshhead-blackmetal.stream.laut.fm/moshhead-blackmetal';
        return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'; 
    }

    dispose() {
        this.stopMusic();
        Howler.unload();
        this.sfx = {};
        this.initialized = false;
    }
}

export const audioManager = new AudioSystem();
// Auto-init for now, or let MainMenu call it?
// Ideally MainMenu or App calls init.
// For backward compatibility with existing usage, we can lazy init or call it here.
// But mostly synchronous calls expect it ready.
// We will trigger init but not await it here, allowing it to load in background.
audioManager.init();
