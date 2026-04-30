class SoundService {
  constructor() {
    // Use data URLs for silent sounds as fallback
    // Users can replace these with real sound files in /public/sounds/
    const silentAudio = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    
    this.sounds = {
      move: this.loadSound('/sounds/move.mp3', silentAudio),
      capture: this.loadSound('/sounds/capture.mp3', silentAudio),
      check: this.loadSound('/sounds/check.mp3', silentAudio),
      gameEnd: this.loadSound('/sounds/game-end.mp3', silentAudio),
      notify: this.loadSound('/sounds/notify.mp3', silentAudio)
    };
    
    // Load settings from localStorage
    const settings = this.getSettings();
    this.enabled = settings.enabled;
    this.volume = settings.volume;
    
    // Apply volume to all sounds
    this.updateVolume();
  }

  loadSound(url, fallback) {
    const audio = new Audio();
    audio.src = url;
    
    // If sound fails to load, use fallback
    audio.addEventListener('error', () => {
      console.warn(`Failed to load sound: ${url}, using silent fallback`);
      audio.src = fallback;
    });
    
    return audio;
  }

  getSettings() {
    const saved = localStorage.getItem('soundSettings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      volume: 0.5
    };
  }

  saveSettings(settings) {
    localStorage.setItem('soundSettings', JSON.stringify(settings));
    this.enabled = settings.enabled;
    this.volume = settings.volume;
    this.updateVolume();
  }

  updateVolume() {
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });
  }

  play(soundName) {
    if (!this.enabled) return;
    
    const sound = this.sounds[soundName];
    if (sound) {
      // Clone and play to allow overlapping sounds
      const clone = sound.cloneNode();
      clone.volume = this.volume;
      clone.play().catch(err => {
        // Silently fail if sound can't play (e.g., user hasn't interacted with page yet)
        console.debug('Sound play prevented:', err.message);
      });
    }
  }

  playMove() {
    this.play('move');
  }

  playCapture() {
    this.play('capture');
  }

  playCheck() {
    this.play('check');
  }

  playGameEnd() {
    this.play('gameEnd');
  }

  playNotify() {
    this.play('notify');
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.saveSettings({ enabled, volume: this.volume });
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.updateVolume();
    this.saveSettings({ enabled: this.enabled, volume: this.volume });
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }
}

export default new SoundService();
