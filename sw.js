const C = 'nova-v3', MAPS = 'nova-maps';
const SHELL = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C && k !== MAPS).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    e.respondWith(fetch(r).then(x => { const cp = x.clone(); caches.open(C).then(c => c.put(r, cp)); return x; }).catch(() => caches.match(r, {ignoreSearch: true})));
  } else if (u.hostname === 'unpkg.com') {
    e.respondWith(caches.open(C).then(async c => { const m = await c.match(r); if (m) return m; const x = await fetch(r); c.put(r, x.clone()); return x; }));
  } else if (u.hostname === 'tiles.openfreemap.org') {
    const isStyle = u.pathname.includes('/styles/');
    e.respondWith(caches.open(MAPS).then(async c => {
      if (!isStyle) { const m = await c.match(r, {ignoreVary: true}); if (m) return m; }
      try { const x = await fetch(r); if (x.ok) c.put(r, x.clone()); return x; }
      catch (err) { const m = await c.match(r, {ignoreVary: true}); if (m) return m; throw err; }
    }));
  }
});
