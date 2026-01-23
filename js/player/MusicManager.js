import { eventBus } from '../core/eventBus.js';
import { storage } from '../core/storage.js';
import { utils } from '../core/utils.js';

export class MusicManager {
  constructor() {
    this.list = []; 
    this.filteredList = []; 
    this.currentIndex = -1;
    this.currentCategory = 'all'; 
    this._bindEvents();
  }

  _bindEvents() {
    eventBus.on('ui:category:switch', ({ type }) => {
      this.currentCategory = type;
      this._filterList();
      this.render(this.filteredList);
    });

    eventBus.on('ui:search', (keyword) => {
      this._filterList(keyword);
      this.render(this.filteredList);
    });

    eventBus.on('track:play', (track) => {
      const recentList = storage.getRecent();
      const newRecent = recentList.filter(item => item.id !== track.id);
      newRecent.unshift(track);
      storage.setRecent(newRecent);
    });
  }

  async loadMusicData() {
    try {
      const res = await fetch('music.json');
      if (!res.ok) throw new Error(`加载音乐列表失败：${res.status}`);
      this.list = await res.json();
      this._initTrackFavStatus();
      this._filterList(); 
      this.render(this.filteredList);
    } catch (e) {
      eventBus.emit('music:load:error', { message: e.message || '加载失败' });
      this.list = [];
      this.filteredList = [];
      this.render([]);
    }
  }

  _initTrackFavStatus() {
    const favIds = storage.getFavorites().map(item => item.id);
    this.list.forEach(track => {
      track.isFav = favIds.includes(track.id);
    });
  }

  _filterList(searchKeyword = '') {
    let list = [...this.list];

    switch (this.currentCategory) {
      case 'recent':
        const recentIds = storage.getRecent().map(item => item.id);
        list = list.filter(track => recentIds.includes(track.id));
        break;
      case 'favorites':
        const favIds = storage.getFavorites().map(item => item.id);
        list = list.filter(track => favIds.includes(track.id));
        break;
      case 'DJ':
        list = list.filter(track => track.category === 'DJ');
        break;
      case 'new':
        list = list.filter(track => track.category === '新歌榜');
        break;
      case 'all':
      default:
        break;
    }

    if (searchKeyword) {
      const keyword = utils.sanitize(searchKeyword).toLowerCase();
      list = list.filter(track => 
        (track.name && track.name.toLowerCase().includes(keyword)) ||
        (track.title && track.title.toLowerCase().includes(keyword)) ||
        (track.singer && track.singer.toLowerCase().includes(keyword)) ||
        (track.artist && track.artist.toLowerCase().includes(keyword))
      );
    }

    this.filteredList = list;
  }

  render(list) {
    const el = document.getElementById('music-list');
    const countEl = document.getElementById('list-count');
    if (!el) return;

    el.innerHTML = '';

    if (list.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'loading';
      emptyEl.textContent = this.currentCategory === 'recent' 
        ? '暂无最近播放记录' 
        : this.currentCategory === 'favorites'
          ? '暂无收藏歌曲'
          : this.currentCategory === 'DJ'
          ? '暂无DJ音乐'
          : '暂无歌曲数据';
      el.appendChild(emptyEl);
      if (countEl) countEl.textContent = '0 首歌曲';
      return;
    }

    list.forEach((track, idx) => {
      const item = document.createElement('div');
      item.className = 'music-item';
      item.tabIndex = 0;

      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = track.name;

      const artist = document.createElement('div');
      artist.className = 'artist';
      artist.textContent = track.artist;

      const favBtn = document.createElement('button');
      favBtn.className = 'fav-btn';
      favBtn.textContent = track.isFav ? '★' : '☆';

      item.appendChild(title);
      item.appendChild(artist);
      item.appendChild(favBtn);

      item.addEventListener('click', () => {
        eventBus.emit('ui:play', track);
        this.currentIndex = idx;
      });

      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });

      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleFavorite(track);
      });

      el.appendChild(item);
    });

    if (countEl) {
      countEl.textContent = `${list.length} 首歌曲`;
    }

    eventBus.emit('music:list:rendered');
  }

  _toggleFavorite(track) {
    const favList = storage.getFavorites();
    const isFav = favList.some(item => item.id !== track.id);
    
    if (isFav) {
      storage.setFavorites(favList.filter(item => item.id !== track.id));
    } else {
      favList.push(track);
      storage.setFavorites(favList);
    }

    track.isFav = !isFav;
    this._filterList();
    this.render(this.filteredList);
  }
}