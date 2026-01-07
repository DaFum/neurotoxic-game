import { Howl, Howler } from 'howler';

class AudioManager {
    constructor() {
        this.music = null;
        this.sfx = {};
        
        // Load preferences or defaults
        this.musicVolume = parseFloat(localStorage.getItem('neurotoxic_vol_music') || '0.5');
        this.sfxVolume = parseFloat(localStorage.getItem('neurotoxic_vol_sfx') || '0.5');
        this.muted = localStorage.getItem('neurotoxic_muted') === 'true';

        // Apply global mute
        Howler.mute(this.muted);
        
        // SFX Preload
        this.loadSFX();
    }

    loadSFX() {
        const sfxUrls = {
            hit: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
            miss: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
            menu: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
            travel: 'https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3' // Placeholder engine
        };

        for (const [key, url] of Object.entries(sfxUrls)) {
            this.sfx[key] = new Howl({ 
                src: [url],
                volume: this.sfxVolume
            });
        }
    }

    playMusic(songId) {
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
        // Prevent restarting if already playing ambient
        if (this.music && this.music.loop()) return;
        this.playMusic('ambient');
    }

    stopMusic() {
        if (this.music) this.music.stop();
    }

    playSFX(key) {
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
        if (songId === 'ambient') return 'https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3';
        return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'; 
    }
}

export const audioManager = new AudioManager();
