const KEY_FAV = 'audio:fav';
const KEY_RECENT = 'audio:recent';

export const storage = {
  getFavorites() {
    return JSON.parse(localStorage.getItem(KEY_FAV) || '[]');
  },

  setFavorites(list) {
    localStorage.setItem(KEY_FAV, JSON.stringify(list));
  },

  getRecent() {
    return JSON.parse(localStorage.getItem(KEY_RECENT) || '[]');
  },

  setRecent(list) {
    localStorage.setItem(KEY_RECENT, JSON.stringify(list.slice(0, 50)));
  }
};