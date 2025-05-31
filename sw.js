// sw.js - This file needs to be in the root of the directory to work,
//         so do not move it next to the other scripts

const CACHE_NAME = 'lab-8-starter';
const BASE_URL = 'https://jswuzh.github.io/Lab8_Starter/';
const LOCAL_ASSETS = [
  '/Lab8_Starter/',
  '/Lab8_Starter/index.html',
  '/Lab8_Starter/assets/styles/main.css',
  '/Lab8_Starter/assets/scripts/main.js',
  '/Lab8_Starter/assets/scripts/recipe-card.js',
  '/Lab8_Starter/assets/images/icons/icon_192x192.png'
];
const RECIPE_URLS = [
  'https://adarsh249.github.io/Lab8-Starter/recipes/1_50-thanksgiving-side-dishes.json',
  'https://adarsh249.github.io/Lab8-Starter/recipes/2_roasting-turkey-breast-with-stuffing.json',
  'https://adarsh249.github.io/Lab8-Starter/recipes/3_moms-cornbread-stuffing.json',
  'https://adarsh249.github.io/Lab8-Starter/recipes/4_50-indulgent-thanksgiving-side-dishes-for-any-holiday-gathering.json',
  'https://adarsh249.github.io/Lab8-Starter/recipes/5_healthy-thanksgiving-recipe-crockpot-turkey-breast.json',
  'https://adarsh249.github.io/Lab8-Starter/recipes/6_one-pot-thanksgiving-dinner.json',
];
// Installs the service worker. Feed it some initial URLs to cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(LOCAL_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      const cachePromises = RECIPE_URLS.map(url => 
        fetch(url)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
            return cache.put(url, res);
          })
          .catch(e => console.warn(`[SW] Cache failed for ${url}:`, e))
      );
      return Promise.all(cachePromises);
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
