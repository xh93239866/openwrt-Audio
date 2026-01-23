import { eventBus } from '../core/eventBus.js';

export class UIManager {
  constructor() {
    this.currentId = null;
    this.bind();
  }

  bind() {
    eventBus.on('track:play', track => {
      this.currentId = String(track.id || '');
      this.update();
      this._updateCurrentTrackInfo(track);
    });

    eventBus.on('track:pause', () => {
      this._togglePlayPauseButtons(false);
    });

    eventBus.on('player:playing', track => {
      this._togglePlayPauseButtons(true);
    });

    eventBus.on('music:list:rendered', () => {
      this.update();
    });
  }

  update() {
    document.querySelectorAll('.music-item').forEach(el => {
      const isCurrent = el.dataset.id === this.currentId;
      el.classList.toggle('active', isCurrent);
      if (isCurrent) {
        el.setAttribute('aria-current', 'true');
      } else {
        el.removeAttribute('aria-current');
      }
    });
  }

  _updateCurrentTrackInfo(track) {
    const name = document.getElementById('current-track-name');
    const singer = document.getElementById('current-track-singer');
    const mobileName = document.getElementById('mobile-track-name');
    const mobileSinger = document.getElementById('mobile-track-singer');
    const title = track.name || track.title || '未知标题';
    const artist = track.singer || track.artist || '未知艺术家';

    if (name) name.textContent = title;
    if (singer) singer.textContent = artist;
    if (mobileName) mobileName.textContent = title;
    if (mobileSinger) mobileSinger.textContent = artist;
  }

  _togglePlayPauseButtons(isPlaying) {
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    if (!playBtn || !pauseBtn) return;
    playBtn.style.display = isPlaying ? 'none' : 'inline-flex';
    pauseBtn.style.display = isPlaying ? 'inline-flex' : 'none';
  }
}