import { initApp } from './app.js';

async function load(id, file) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = await fetch(`partials/${file}`).then(r => r.text());
}

(async () => {
  await Promise.all([
    load('header', 'header.html'),
    load('sidebar', 'sidebar.html'),
    load('main-player', 'player.html'),
    load('rank', 'rank.html'),
    load('controls', 'controls.html')
  ]);

  initApp();
})();