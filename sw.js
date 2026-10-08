// Service worker: makes the app work offline.
//   App files: network first (so updates arrive), falling back to the cached copy.
//   Audio: cache first. The page's "Download for offline" button fills AUDIO_CACHE in bulk.
const SHELL_CACHE = 'learn-thai-shell-v20';
const AUDIO_CACHE = 'learn-thai-audio-v1';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'app/style.css',
  'app/app.js',
  'app/course.js',
  'app/dialogues.js',
  'app/songs.js',
  'app/audio-manifest.js',
  'app/vendor/qrcode.min.js',
  'app/icons/icon-192.png',
  'app/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  const keep = [SHELL_CACHE, AUDIO_CACHE];
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('learn-thai-') && !keep.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network with a timeout, so a slow connection falls back to the cache quickly.
function fromNetwork(req, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(req).then(r => { clearTimeout(t); resolve(r); }, err => { clearTimeout(t); reject(err); });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // GitHub API etc. go straight to the network

  if (url.pathname.includes('/audio/')) {
    e.respondWith(
      caches.open(AUDIO_CACHE).then(async c => {
        const hit = await c.match(url.href);
        if (hit) return hit;
        const r = await fetch(req);
        if (r.status === 200) c.put(url.href, r.clone());
        return r;
      })
    );
    return;
  }

  e.respondWith(
    fromNetwork(req, 4000)
      .then(r => {
        if (r.status === 200) {
          const copy = r.clone();
          caches.open(SHELL_CACHE).then(c => c.put(req, copy));
        }
        return r;
      })
      .catch(async () =>
        (await caches.match(req, { ignoreSearch: true })) ||
        (req.mode === 'navigate' ? caches.match('./') : Response.error())
      )
  );
});
