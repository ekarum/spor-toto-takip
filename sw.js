const CACHE_VERSION='karum-toto-v20.0.1';
const APP_SHELL=[
  './',
  './index.html',
  './styles.css?v=20.0.1',
  './app.js?v=20.0.1',
  './initial-data.js?v=20.0.1',
  './manifest.webmanifest?v=20.0.1',
  './apple-touch-icon.png?v=20.0.1',
  './karum-logo-192.png',
  './karum-logo-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_VERSION).then(cache=>cache.addAll(APP_SHELL)));
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE_VERSION).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request){
  const cache=await caches.open(CACHE_VERSION);
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response?.ok) await cache.put(request,response.clone());
    return response;
  }catch(error){
    return (await cache.match(request)) || (await cache.match('./index.html')) || Response.error();
  }
}

async function staleWhileRevalidate(request){
  const cache=await caches.open(CACHE_VERSION);
  const cached=await cache.match(request);
  const network=fetch(request).then(response=>{
    if(response?.ok) cache.put(request,response.clone());
    return response;
  }).catch(()=>null);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;
  if(request.mode==='navigate' || request.destination==='document'){
    event.respondWith(networkFirst(request));
    return;
  }
  if(['script','style','manifest'].includes(request.destination)){
    event.respondWith(networkFirst(request));
    return;
  }
  if(request.destination==='image' || request.destination==='font'){
    event.respondWith(staleWhileRevalidate(request));
  }
});
