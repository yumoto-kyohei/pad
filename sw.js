// Service worker: caches the app shell so the practice board (which needs
// no network at all once loaded) works offline / installed as a PWA. The
// live ranking pages still need the network to fetch the Google Sheet —
// that request is always passed straight through, never cached.
//
// Bump CACHE_NAME whenever APP_SHELL's contents change (a file added/
// removed, or one of the ?vN cache-busters elsewhere bumped) so old
// clients pick up the new list instead of being stuck on a stale one.
var CACHE_NAME = 'puzzle-practice-v3';

var APP_SHELL = [
	'./',
	'index.html',
	'rankings.html',
	'speedrun.html',
	'manifest.json',
	'pad.css?v9',
	'menu.css?v3',
	'rankings.css?v4',
	'pad.js?v8',
	'menu.js?v1',
	'sheetData.js?v1',
	'rankings.js?v6',
	'speedrun.js?v7',
	'pwa.js?v1',
	'jquery.ui.touch-punch.min.js',
	'favicon.ico',
	'img/icon-192.png',
	'img/icon-512.png',
	'img/icon-maskable-512.png',
	'img/apple-touch-icon.png',
	'img/bg1.png',
	'img/bg2.png',
	'img/Red.png',
	'img/Blue.png',
	'img/Green.png',
	'img/Light.png',
	'img/Dark.png',
	'img/Heart.png',
	'img/Jammer.png',
	'img/Poison.png',
	'img/gear.png',
	'img/clock.svg',
	'img/atk.svg',
	'img/minus.png',
	'img/plus.png'
];

self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open(CACHE_NAME).then(function (cache) {
			// add one at a time (not addAll) so one missing/renamed file
			// doesn't abort caching everything else
			return Promise.all(APP_SHELL.map(function (url) {
				return cache.add(url).catch(function () {});
			}));
		}).then(function () { return self.skipWaiting(); })
	);
});

self.addEventListener('activate', function (event) {
	event.waitUntil(
		caches.keys().then(function (keys) {
			return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
		}).then(function () { return self.clients.claim(); })
	);
});

self.addEventListener('fetch', function (event) {
	var url = event.request.url;
	// never intercept the live spreadsheet fetch — it must always hit the network
	if (url.indexOf('docs.google.com') !== -1) return;
	if (event.request.method !== 'GET') return;

	event.respondWith(
		caches.match(event.request).then(function (cached) {
			var networkFetch = fetch(event.request).then(function (response) {
				// cache same-origin successes and opaque cross-origin responses
				// (e.g. the jQuery CDN scripts) so they're available offline next time
				if (response.ok || response.type === 'opaque') {
					var clone = response.clone();
					caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, clone); });
				}
				return response;
			}).catch(function () { return cached; });
			// prefer a cached hit immediately (fast + works offline), but still
			// refresh the cache in the background when online
			return cached || networkFetch;
		})
	);
});
