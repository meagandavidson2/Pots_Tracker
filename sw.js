// Service worker for offline use of the POTS & ME/CFS Tracker
const CACHE = 'pots-tracker-v2';
const ASSETS = ['./', './symptom-tracker.html'];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;

    // Page loads: try network first (so updates show), fall back to cache when offline
    if (req.mode === 'navigate') {
        e.respondWith(
            fetch(req)
                .then(resp => {
                    const copy = resp.clone();
                    caches.open(CACHE).then(c => c.put(req, copy));
                    return resp;
                })
                .catch(() => caches.match(req).then(r => r || caches.match('./symptom-tracker.html')))
        );
        return;
    }

    // Everything else: cache first, then network
    e.respondWith(caches.match(req).then(c => c || fetch(req)));
});
