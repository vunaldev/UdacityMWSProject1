



self.addEventListener('install', function(event) {

    var urlsToCache =[
        '/',
        'css/styles.css',
        'img/1.jpg',
        'img/2.jpg',
        'img/3.jpg',
        'img/4.jpg',
        'img/5.jpg',
        'img/6.jpg',
        'img/7.jpg',
        'img/8.jpg',
        'img/9.jpg',
        'img/10.jpg'
    ];

    event.waitUntil(
        caches.open('restaurant-static-v1').then(function(cache) {
            return cache.addAll(urlsToCache);

        })
    );

});

self.addEventListener('activate', function(event) {
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.filter(function(cacheName) {
					return cacheName.startsWith('restaurant-') && cacheName != 'restaurant-static-v1';
				}).map(function(cacheName) {
					return caches.delete(cacheName);
				})    
			);
		})
	);
});


self.addEventListener('fetch', function(event) {
    event.respondWith(

        caches.match(event.request).then(response => {
        
            if(response)
            {
                return response;
            }                
           
            return fetch(event.request).then(function(response) {

                if(response.status == 404) {
                    return new Response("Not Found");
                }

                return caches.open('restaurant-static-v1').then(cache => {
                    cache.put(event.request.url, response.clone());
                    
                    return response;
                })

                return response;

            })
        })
    );
});


