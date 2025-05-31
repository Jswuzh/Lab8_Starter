// sw.js - This file needs to be in the root of the directory to work,
//         so do not move it next to the other scripts

const CACHE_NAME = 'lab-8-starter';
const RECIPE_URLS = [
  'https://adarsh249.github.io/Lab8-Starter/recipes/1_50-thanksgiving-side-dishes.json',
  'https://adarsh249.github.io/Lab8-Starter/recipes/2_roasting-turkey-breast-with-stuffing.json',
  'https://adarsh249.github.io/Lab8-Starter/recipes/3_moms-cornbread-stuffing.json',
  'https://adarsh249.github.io/Lab8-Starter/recipes/4_50-indulgent-thanksgiving-side-dishes-for-any-holiday-gathering.json',
  'https://adarsh249.github.io/Lab8-Starter/recipes/5_healthy-thanksgiving-recipe-crockpot-turkey-breast.json',
  'https://adarsh249.github.io/Lab8-Starter/recipes/6_one-pot-thanksgiving-dinner.json',
];
// Installs the service worker. Feed it some initial URLs to cache
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/assets/styles/main.css',
        '/assets/scripts/main.js',
        '/assets/scripts/recipe-card.js',
        '/assets/images/icons/icon_192x192.png'
      ]).then(() => {
        return Promise.all(
          RECIPE_URLS.map(url => 
            fetch(url, { mode: 'cors' })
              .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return cache.put(url, res);
              })
              .catch(e => console.warn(`Failed to cache ${url}:`, e))
          )
        );
      });
    })
  );
});

// Activates the service worker
self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  const request = event.request;
  
  if (request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(request).then(cached => {
      if (RECIPE_URLS.some(url => request.url === url)) {
        return fetch(request, { cache: 'no-store' })
          .then(networkRes => {
            caches.open(CACHE_NAME).then(cache => 
              cache.put(request, networkRes.clone())
            );
            return networkRes;
          })
          .catch(() => cached || new Response('{ "error": "Offline" }', {
            headers: { 'Content-Type': 'application/json' }
          }));
      }

      return cached || fetch(request);
    })
  );
});
