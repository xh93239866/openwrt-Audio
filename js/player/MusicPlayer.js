import { eventBus } from '../core/eventBus.js';
import { storage } from '../core/storage.js';

export class MusicPlayer {
  constructor() {
    this.audio = new Audio();
    this.currentTrack = null;
    this.playMode = {
      shuffle: localStorage.getItem('shuffle') === 'true',
      repeat: localStorage.getItem('repeat') === 'true'
    };
    this._bindAudioEvents();
    this._bindUIEvents();

    try {
      const v = parseFloat(localStorage.getItem('volume'));
      if (!isNaN(v)) this.audio.volume = Math.max(0, Math.min(1, v));
      const slider = document.getElementById('volume-slider');
      if (slider) slider.value = v;
    } catch (e) { /* ignore */ }
  }

  _bindAudioEvents() {
    this.audio.addEventListener('ended', () => {
      eventBus.emit('player:ended');
      this._handlePlayEnd();
    });

    this.audio.addEventListener('play', () => {
      eventBus.emit('player:playing', this.currentTrack);
      if (this.currentTrack) {
        const recentList = storage.getRecent();
        const newRecent = recentList.filter(t => t.id !== this.currentTrack.id);
        newRecent.unshift(this.currentTrack);
        storage.setRecent(newRecent);
      }
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setPositionState && navigator.mediaSession.setPositionState({
            duration: this.audio.duration || 0,
            playbackRate: this.audio.playbackRate,
            position: this.audio.currentTime
          });
        } catch (e) { /* some browsers may throw */ }
      }
    });

    this.audio.addEventListener('pause', () => {
      eventBus.emit('player:paused', this.currentTrack);
    });

    this.audio.addEventListener('error', (e) => {
      const err = this.audio.error;
      let msg = '播放错误';
      if (err) {
        msg = `播放失败（code ${err.code}）`;
      }
      eventBus.emit('player:error', { message: msg, track: this.currentTrack, error: err });
    });

    this.audio.addEventListener('waiting', () => {
      eventBus.emit('player:buffering', this.currentTrack);
    });

    this.audio.addEventListener('stalled', () => {
      eventBus.emit('player:stalled', this.currentTrack);
    });

    eventBus.on('ui:mode:shuffle', (isShuffle) => {
      this.playMode.shuffle = isShuffle;
    });
    eventBus.on('ui:mode:repeat', (isRepeat) => {
      this.playMode.repeat = isRepeat;
    });
  }

  _handlePlayEnd() {
    if (this.playMode.repeat) {
      this.play(this.currentTrack);
    } else {
      eventBus.emit('ui:next');
    }
  }

  _bindUIEvents() {
    eventBus.on('ui:seek', pct => {
      if (!this.audio.duration || isNaN(pct)) return;
      this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, pct * this.audio.duration));
    });

    eventBus.on('ui:volume', v => {
      if (typeof v !== 'number') return;
      this.audio.volume = Math.max(0, Math.min(1, v));
      try { localStorage.setItem('volume', this.audio.volume); } catch (e) { /* ignore */ }
    });

    eventBus.on('ui:play', track => this.play(track));
    eventBus.on('ui:play-btn', () => this.audio.play());
    eventBus.on('ui:pause-btn', () => this.audio.pause());
  }

  play(track) {
    if (!track || !track.url) return;

    if (this.currentTrack && this.currentTrack.id === track.id && !this.audio.paused) {
      return;
    }

    this.currentTrack = track;
    try {
      this.audio.src = track.url;
      this.audio.crossOrigin = 'anonymous';
      const p = this.audio.play();
      if (p && typeof p.then === 'function') {
        p.catch(err => {
          eventBus.emit('player:error', { message: '浏览器阻止自动播放，需要用户交互', error: err });
        });
      }
    } catch (e) {
      eventBus.emit('player:error', { message: '设置音源失败', error: e });
    }

    this.updateMediaSession(track);
    eventBus.emit('track:play', track);
  }

  pause() {
    this.audio.pause();
    eventBus.emit('track:pause', this.currentTrack);
  }

  updateMediaSession(track) {
    if (!('mediaSession' in navigator)) return;

    try {
      const title = track.name || track.title || '';
      const artist = track.singer || track.artist || '';

      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: artist,
        album: track.album || '',
        artwork: [{ src: track.cover || '/cover.png', sizes: '512x512', type: 'image/png' }]
      });
    } catch (e) {
      console.warn('MediaSession API 不支持:', e);
    }

    try {
      navigator.mediaSession.setActionHandler('play', () => this.audio.play());
      navigator.mediaSession.setActionHandler('pause', () => this.audio.pause());
      navigator.mediaSession.setActionHandler('seekto', details => {
        if (details && typeof details.seekTime === 'number') {
          this.audio.currentTime = details.seekTime;
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => eventBus.emit('ui:prev'));
      navigator.mediaSession.setActionHandler('nexttrack', () => eventBus.emit('ui:next'));
    } catch (e) { /* some browsers may throw */ }
  }
}