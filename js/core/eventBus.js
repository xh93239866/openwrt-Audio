export const eventBus = {
  events: Object.create(null),

  on(event, handler) {
    (this.events[event] ||= []).push(handler);
  },

  emit(event, data) {
    (this.events[event] || []).forEach(fn => fn(data));
  },

  off(event, handler) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(fn => fn !== handler);
  }
};