import { MusicPlayer } from './player/MusicPlayer.js';
import { MusicManager } from './player/MusicManager.js';
import { UIManager } from './ui/UIManager.js';
import { MobileMenuManager } from './ui/MobileMenuManager.js';
import { ControlsManager } from './ui/ControlsManager.js';
import { eventBus } from './core/eventBus.js';
import { storage } from './core/storage.js';

export function initApp() {
  const player = new MusicPlayer();
  const manager = new MusicManager();
  new UIManager();
  new ControlsManager();
  new MobileMenuManager().init();

  eventBus.on('ui:play', track => player.play(track));

  manager.loadMusicData();

  eventBus.on('ui:next', () => {
    if (manager.filteredList.length === 0) return;
    manager.currentIndex = (manager.currentIndex + 1) % manager.filteredList.length;
    const track = manager.filteredList[manager.currentIndex];
    if (track) eventBus.emit('ui:play', track);
  });

  eventBus.on('ui:prev', () => {
    if (manager.filteredList.length === 0) return;
    manager.currentIndex = (manager.currentIndex - 1 + manager.filteredList.length) % manager.filteredList.length;
    const track = manager.filteredList[manager.currentIndex];
    if (track) eventBus.emit('ui:play', track);
  });

  eventBus.on('player:error', (err) => {
    const status = document.getElementById('status-message');
    if (status) {
      status.textContent = err?.message || '播放出错，请重试';
      status.className = 'status-message status-error';
      status.style.display = 'block';
      setTimeout(() => { 
        status.style.display = 'none'; 
        status.className = 'status-message';
      }, 4000);
    }
    console.error('播放器错误:', err);
  });

  eventBus.on('music:load:error', (err) => {
    const status = document.getElementById('status-message');
    if (status) {
      status.textContent = err?.message || '音乐列表加载失败';
      status.className = 'status-message status-error';
      status.style.display = 'block';
      setTimeout(() => { 
        status.style.display = 'none';
        status.className = 'status-message';
      }, 4000);
    }
  });

  const bindCategoryButtons = () => {
    const buttons = {
      'all-songs-btn-desktop': 'all',
      'recent-btn-desktop': 'recent',
      'favorites-btn-desktop': 'favorites',
      'dj-btn-desktop': 'DJ',
      'new-btn-desktop': 'new'
    };

    Object.entries(buttons).forEach(([btnId, category]) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.action-btn').forEach(b => {
            b.classList.remove('active');
          });
          btn.classList.add('active');
          eventBus.emit('ui:category:switch', { type: category });
        });
      }
    });
  };

  const initRankData = () => {
    const rankEl = document.getElementById('rank-list-desktop');
    const mobileRankEl = document.getElementById('rank-list-mobile');
    
    if (rankEl && mobileRankEl && manager.list.length > 0) {
      const popularTracks = [...manager.list]
        .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        .slice(0, 10);
      
      if (popularTracks.length > 0) {
        rankEl.innerHTML = '';
        mobileRankEl.innerHTML = '';
        
        popularTracks.forEach((track, index) => {
          const item = document.createElement('div');
          item.className = 'rank-item';
          item.setAttribute('role', 'listitem');
          item.tabIndex = 0;
          
          const title = track.name || track.title || '未知标题';
          const artist = track.singer || track.artist || '未知艺术家';
          
          item.innerHTML = `
            <div class="rank-number ${index < 3 ? `top${index + 1}` : ''}">${index + 1}</div>
            <div class="rank-info">
              <div class="music-name">${title}</div>
              <div class="play-count">播放: ${track.playCount || 0}次</div>
            </div>
          `;
          
          item.addEventListener('click', () => {
            eventBus.emit('ui:play', track);
          });
          
          item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              item.click();
            }
          });
          
          const cloneItem = item.cloneNode(true);
          rankEl.appendChild(cloneItem);
          mobileRankEl.appendChild(item);
        });
      } else {
        rankEl.innerHTML = '<div class="loading" role="status">暂无排行榜数据</div>';
        mobileRankEl.innerHTML = '<div class="loading" role="status">暂无排行榜数据</div>';
      }
    } else if (rankEl && mobileRankEl) {
      rankEl.innerHTML = '<div class="loading" role="status"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i> 正在加载排行榜...</div>';
      mobileRankEl.innerHTML = '<div class="loading" role="status"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i> 正在加载排行榜...</div>';
    }
  };

  eventBus.on('music:list:rendered', () => {
    initRankData();
    bindCategoryButtons();
  });

  try {
    const vol = parseFloat(localStorage.getItem('volume'));
    if (!isNaN(vol) && vol >= 0 && vol <= 1) {
      const slider = document.getElementById('volume-slider');
      if (slider) slider.value = String(vol);
      player.audio.volume = vol;
    }
  } catch (e) {
    console.warn('音量初始化失败:', e);
  }

  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const refreshBtn = document.getElementById('refresh-btn');

  if (searchInput && searchBtn) {
    const handleSearch = () => {
      const keyword = searchInput.value.trim();
      eventBus.emit('ui:search', keyword);
      const listTitle = document.getElementById('list-title');
      if (listTitle) {
        listTitle.textContent = keyword ? `搜索: ${keyword}` : '全部音乐';
      }
    };

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      manager.loadMusicData();
      const status = document.getElementById('status-message');
      if (status) {
        status.textContent = '正在刷新列表...';
        status.className = 'status-message status-info';
        status.style.display = 'block';
        setTimeout(() => { 
          status.style.display = 'none';
          status.className = 'status-message';
        }, 1500);
      }
    });
  }

  setTimeout(() => {
    if (manager.list.length === 0) {
      initRankData();
    }
  }, 1000);

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      e.preventDefault();
      if (player.audio.paused) {
        eventBus.emit('ui:play-btn');
      } else {
        eventBus.emit('ui:pause-btn');
      }
    }
    
    if (e.code === 'ArrowRight' && e.ctrlKey) {
      e.preventDefault();
      const currentTime = player.audio.currentTime;
      player.audio.currentTime = Math.min(player.audio.duration, currentTime + 10);
    }
    if (e.code === 'ArrowLeft' && e.ctrlKey) {
      e.preventDefault();
      const currentTime = player.audio.currentTime;
      player.audio.currentTime = Math.max(0, currentTime - 10);
    }
  });

  bindCategoryButtons();
}