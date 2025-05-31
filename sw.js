// sw.js - This file needs to be in the root of the directory to work,
//         so do not move it next to the other scripts

const CACHE_NAME = 'lab-8-starter';
const BASE_URL = 'https://jswuzh.github.io/Lab8_Starter/';

// Local assets with fallback handling
const LOCAL_ASSETS = [
  {url: BASE_URL, type: 'document'},
  {url: BASE_URL + 'index.html', type: 'document'},
  {url: BASE_URL + 'assets/styles/main.css', type: 'style'},
  {url: BASE_URL + 'assets/scripts/main.js', type: 'script'},
  {url: BASE_URL + 'assets/scripts/RecipeCard.js', type: 'script'},
  {url: BASE_URL + 'assets/images/icons/icon_192x192.png', type: 'image'},
  {url: BASE_URL + 'assets/images/icons/icon_256x256.png', type: 'image'},
  {url: BASE_URL + 'assets/images/icons/icon_384x384.png', type: 'image'},
  {url: BASE_URL + 'assets/images/icons/icon_512x512.png', type: 'image'},
  {url: BASE_URL + 'assets/images/icons/arrow-down.png', type: 'image'},
  {url: BASE_URL + 'assets/images/icons/0-star.svg', type: 'image'},
  {url: BASE_URL + 'assets/images/icons/1-star.svg', type: 'image'},
  {url: BASE_URL + 'assets/images/icons/2-star.svg', type: 'image'},
  {url: BASE_URL + 'assets/images/icons/3-star.svg', type: 'image'},
  {url: BASE_URL + 'assets/images/icons/4-star.svg', type: 'image'},
  {url: BASE_URL + 'assets/images/icons/5-star.svg', type: 'image'}
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
      console.log('[SW] Starting installation');
      
      // Cache local assets with individual error handling
      const cacheResults = await Promise.allSettled(
        LOCAL_ASSETS.map(asset => 
          cache.add(asset.url).catch(e => {
            console.warn(`[SW] Failed to cache ${asset.url}:`, e);
            return null;
          })
        )
      );
      
      // Verify at least the core files were cached
      const criticalAssets = [
        BASE_URL + 'index.html',
        BASE_URL + 'assets/scripts/main.js',
        BASE_URL + 'assets/styles/main.css'
      ];
      
      const hasCriticalAssets = criticalAssets.every(url => 
        cacheResults.some((result, i) => 
          result.status === 'fulfilled' && LOCAL_ASSETS[i].url === url
        )
      );
      
      if (!hasCriticalAssets) {
        throw new Error('Failed to cache critical assets');
      }
      
      // Cache recipes separately
      console.log('[SW] Caching recipe data');
      await Promise.all(
        RECIPE_URLS.map(url => 
          fetch(url, {mode: 'cors'})
            .then(res => res.ok ? cache.put(url, res) : Promise.reject())
            .catch(e => console.warn(`[SW] Failed to cache recipe ${url}:`, e))
      );
    })
    .then(() => self.skipWaiting())
    .catch(err => {
      console.error('[SW] Installation failed:', err);
      throw err;
    })
  );
});

// Activates the service worker
self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension requests
  if (request.url.startsWith('chrome-extension://')) return;
  
  // Skip VSCode Live Server requests
  if (request.url.includes('live-web')) return;
  
  event.respondWith(
    (async () => {
      // Try cache first
      const cached = await caches.match(request, {ignoreSearch: true});
      
      // For recipe API calls
      if (RECIPE_URLS.includes(request.url)) {
        try {
          const networkRes = await fetch(request, {
            cache: 'no-store',
            mode: 'cors'
          });
          
          // Update cache in background
          if (networkRes.ok) {
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, networkRes.clone()))
              .catch(console.warn);
          }
          
          return networkRes;
        } catch (e) {
          return cached || new Response(
            JSON.stringify({error: "Offline mode"}),
            {headers: {'Content-Type': 'application/json'}}
          );
        }
      }
      
      // For all other requests
      return cached || fetch(request);
    })()
  );
});
