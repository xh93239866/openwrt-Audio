import { eventBus } from '../core/eventBus.js';
import { utils } from '../core/utils.js';

export class ControlsManager {
  constructor() {
    this.progress = document.getElementById('progress-bar');
    this.progressFill = document.getElementById('progress-fill');
    this.timeCurrent = document.getElementById('time-current');
    this.timeTotal = document.getElementById('time-total');
    this.playBtn = document.getElementById('play-btn');
    this.pauseBtn = document.getElementById('pause-btn');
    this.prevBtn = document.getElementById('prev-btn');
    this.nextBtn = document.getElementById('next-btn');
    this.volumeSlider = document.getElementById('volume-slider');
    this.shuffleBtn = document.getElementById('shuffle-btn');
    this.repeatBtn = document.getElementById('repeat-btn');
    this._initAriaAttributes();
    this._initPlayModeButtons();
    this._bind();
  }

  _initAriaAttributes() {
    if (this.progress) {
      this.progress.setAttribute('aria-valuenow', '0');
      this.progress.setAttribute('aria-valuemin', '0');
      this.progress.setAttribute('aria-valuemax', '100');
    }
    if (this.timeCurrent) this.timeCurrent.textContent = '0:00';
    if (this.timeTotal) this.timeTotal.textContent = '0:00';
  }

  _initPlayModeButtons() {
    const isShuffle = localStorage.getItem('shuffle') === 'true';
    const isRepeat = localStorage.getItem('repeat') === 'true';

    if (this.shuffleBtn) {
      this.shuffleBtn.setAttribute('aria-pressed', String(isShuffle));
      this.shuffleBtn.classList.toggle('active', isShuffle);
    }
    if (this.repeatBtn) {
      this.repeatBtn.setAttribute('aria-pressed', String(isRepeat));
      this.repeatBtn.classList.toggle('active', isRepeat);
    }
  }

  _bind() {
    eventBus.on('player:timeupdate', ({ currentTime, duration }) => {
      const pct = duration ? (currentTime / duration) * 100 : 0;
      if (this.progressFill) this.progressFill.style.width = `${pct}%`;
      if (this.timeCurrent) this.timeCurrent.textContent = this._formatTime(currentTime);
      if (this.timeTotal) this.timeTotal.textContent = this._formatTime(duration);

      if (this.progress) {
        try {
          this.progress.setAttribute('aria-valuenow', String(Math.round(pct)));
        } catch (e) {}
      }
    });

    this.shuffleBtn?.addEventListener('click', () => {
      const active = this.shuffleBtn.getAttribute('aria-pressed') === 'true';
      this.shuffleBtn.setAttribute('aria-pressed', String(!active));
      this.shuffleBtn.classList.toggle('active', !active); // 同步样式
      localStorage.setItem('shuffle', String(!active));
      eventBus.emit('ui:mode:shuffle', !active);
    });

    this.repeatBtn?.addEventListener('click', () => {
      const active = this.repeatBtn.getAttribute('aria-pressed') === 'true';
      this.repeatBtn.setAttribute('aria-pressed', String(!active));
      this.repeatBtn.classList.toggle('active', !active); // 同步样式
      localStorage.setItem('repeat', String(!active));
      eventBus.emit('ui:mode:repeat', !active);
    });

    this.playBtn?.addEventListener('click', () => eventBus.emit('ui:play-btn'));
    this.pauseBtn?.addEventListener('click', () => eventBus.emit('ui:pause-btn'));

    this.prevBtn?.addEventListener('click', () => eventBus.emit('ui:prev'));
    this.nextBtn?.addEventListener('click', () => eventBus.emit('ui:next'));

    if (this.progress) {
      this.progress.addEventListener('click', e => {
        const rect = this.progress.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        eventBus.emit('ui:seek', pct);
      });
      this.progress.addEventListener('keydown', e => {
        if (!this.progress) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          eventBus.emit('ui:seek', Math.max(0, (parseFloat(this.progressFill.style.width) / 100 - 0.05)));
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          eventBus.emit('ui:seek', Math.min(1, (parseFloat(this.progressFill.style.width) / 100 + 0.05)));
        } else if (e.key === 'Home') {
          eventBus.emit('ui:seek', 0);
        } else if (e.key === 'End') {
          eventBus.emit('ui:seek', 1);
        }
      });
    }

    this.volumeSlider?.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      eventBus.emit('ui:volume', v);
    });

    this.shuffleBtn?.addEventListener('click', () => {
      const active = this.shuffleBtn.getAttribute('aria-pressed') === 'true';
      this.shuffleBtn.setAttribute('aria-pressed', String(!active));
      localStorage.setItem('shuffle', String(!active));
      eventBus.emit('ui:mode:shuffle', !active);
    });

    this.repeatBtn?.addEventListener('click', () => {
      const active = this.repeatBtn.getAttribute('aria-pressed') === 'true';
      this.repeatBtn.setAttribute('aria-pressed', String(!active));
      localStorage.setItem('repeat', String(!active));
      eventBus.emit('ui:mode:repeat', !active);
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && (document.activeElement === document.body || document.activeElement === this.progress)) {
        e.preventDefault();
        if (this.playBtn && this.playBtn.style.display !== 'none') {
          eventBus.emit('ui:play-btn');
        } else {
          eventBus.emit('ui:pause-btn');
        }
      }
    });
  }

  _formatTime(s = 0) {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }
}