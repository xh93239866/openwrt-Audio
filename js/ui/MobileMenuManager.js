import { eventBus } from '../core/eventBus.js';

export class MobileMenuManager {
  init() {
    const toggleBtn = document.getElementById('navToggle');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const drawerOverlay = document.getElementById('drawerOverlay');

    if (!toggleBtn || !mobileDrawer || !drawerOverlay) return;

    const toggleMenu = () => {
      mobileDrawer.classList.toggle('active');
      drawerOverlay.classList.toggle('active');
      const isOpen = mobileDrawer.classList.contains('active');
      toggleBtn.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
      toggleBtn.innerHTML = isOpen ? '<i class="fas fa-times" aria-hidden="true"></i>' : '<i class="fas fa-bars" aria-hidden="true"></i>';
    };

    toggleBtn.addEventListener('click', toggleMenu);
    drawerOverlay.addEventListener('click', toggleMenu);

    const allSongsBtn = document.getElementById('all-songs-btn');
    const recentBtn = document.getElementById('recent-btn');
    if (allSongsBtn && recentBtn) {
      allSongsBtn.addEventListener('click', () => {
        this._switchCategory('all');
        allSongsBtn.classList.add('active');
        recentBtn.classList.remove('active');
        allSongsBtn.setAttribute('aria-pressed', 'true');
        recentBtn.setAttribute('aria-pressed', 'false');
      });

      recentBtn.addEventListener('click', () => {
        this._switchCategory('recent');
        recentBtn.classList.add('active');
        allSongsBtn.classList.remove('active');
        recentBtn.setAttribute('aria-pressed', 'true');
        allSongsBtn.setAttribute('aria-pressed', 'false');
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('active')) {
        toggleMenu();
      }
    });
  }

  _switchCategory(type) {
    eventBus.emit('ui:category:switch', { type });
  }
}