// ============================================================
// Service Worker — Edunet / UOB
// Développeur : Roland Myaka
// ============================================================

const CACHE_NAME = 'edunet-uob-v1';
const ASSETS_TO_CACHE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(r => r || fetch(event.request)));
});

// ── Notifications Push ──────────────────────────────────────
self.addEventListener('push', event => {
  let data = { title: 'Edunet', body: 'Vous avez une nouvelle notification.', url: '/' };
  try { if (event.data) data = event.data.json(); } catch { data.body = event.data?.text() || data.body; }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo-uob.png',
      badge: '/logo-uob.png',
      vibrate: [200, 100, 200],
      tag: `edunet-${data.url || 'default'}`,
      renotify: true,
      data: { url: data.url || '/' },
      actions: [{ action: 'open', title: 'Voir' }],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus().then(w => w.navigate(url));
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
