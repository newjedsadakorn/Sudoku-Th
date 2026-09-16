/* service worker
   เอกสารหลัก (index.html) : ลองเน็ตก่อน ได้ของใหม่เสมอเมื่อออนไลน์
                             ไม่มีเน็ตหรือช้าเกิน 3.5 วิ ค่อยใช้ของในเครื่อง
   ไอคอน / manifest / ฟอนต์ : ใช้ของในเครื่องก่อน เพราะแทบไม่เคยเปลี่ยน

   เลื่อนเลข VERSION เมื่อแก้ไฟล์อื่นที่ไม่ใช่ index.html
   (ตัว index.html ไม่ต้องเลื่อนแล้ว เพราะดึงสดทุกครั้งที่ออนไลน์) */
const VERSION = 'sudoku-v9';
const DOC = './index.html';
const FILES = [
  './',
  DOC,
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './fonts/ibm-plex-mono-latin-400-normal.woff2',
  './fonts/ibm-plex-mono-latin-500-normal.woff2',
  './fonts/ibm-plex-sans-thai-latin-300-normal.woff2',
  './fonts/ibm-plex-sans-thai-latin-400-normal.woff2',
  './fonts/ibm-plex-sans-thai-latin-500-normal.woff2',
  './fonts/ibm-plex-sans-thai-thai-300-normal.woff2',
  './fonts/ibm-plex-sans-thai-thai-400-normal.woff2',
  './fonts/ibm-plex-sans-thai-thai-500-normal.woff2'
];
const TIMEOUT = 3500;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function freshFirst(req){
  const cache = await caches.open(VERSION);
  try{
    const res = await Promise.race([
      fetch(req, {cache: 'no-store'}),
      new Promise((_, rej) => setTimeout(() => rej(new Error('เน็ตช้าเกินรอ')), TIMEOUT))
    ]);
    if(res && res.ok) cache.put(DOC, res.clone());
    return res;
  }catch(err){
    return (await cache.match(DOC)) || (await cache.match('./')) || Response.error();
  }
}

async function cacheFirst(req){
  const hit = await caches.match(req);
  if(hit) return hit;
  try{
    const res = await fetch(req);
    return res;
  }catch(err){
    return (await caches.match(DOC)) || Response.error();
  }
}

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const isDoc = e.request.mode === 'navigate' || e.request.destination === 'document';
  e.respondWith(isDoc ? freshFirst(e.request) : cacheFirst(e.request));
});
