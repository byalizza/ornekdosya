// ============================================
// YAPILANDIRMA DOSYASI - "Bu Aşk Bitmez"
// ============================================
//
// Bu dosyadaki değerleri değiştirerek uygulamayı
// kendi ilişkinize göre özelleştirebilirsiniz.
//
// ============================================

const APP_CONFIG = {

  // -------------------------------------------
  // 1. UYGULAMA ADI
  // -------------------------------------------
  // Tarayıcı sekmesinde ve başlıklarda görünür.
  appName: 'Bu Aşk Bitmez',
  appTitle: 'Efe ❤️ Ela',

  // -------------------------------------------
  // 2. GİTHUB REPO YOLU
  // -------------------------------------------
  // GitHub Pages'de yayınlarken repo adınız neyse
  // onu yazın. Örn: "benim-repo-adim"
  // https://kullaniciadi.github.io/REPO_ADI/
  repoPath: '-bu-kalp-senden',

  // -------------------------------------------
  // 3. GİRİŞ ŞİFRESİ (Özel Tarih)
  // -------------------------------------------
  // Uygulamaya girmek için istenen tarih.
  // GG/AA/YYYY formatında kendi özel tarihinizi girin.
  secretDate: {
    day: 18,
    month: 4,
    year: 2025
  },

  // -------------------------------------------
  // 4. İLİŞKİ BAŞLANGIÇ TARİHİ (Sayaç)
  // -------------------------------------------
  // "Senle geçen her saniyem bir ömür" sayacının
  // başlangıç noktası.
  relationshipStart: {
    day: 19,
    month: 3,
    year: 2025,
    hour: 15,
    minute: 30
  },

  // -------------------------------------------
  // 5. KULLANICI İSİMLERİ
  // -------------------------------------------
  // İki kullanıcının adı, emojisi ve rengi.
  users: {
    efe: { name: 'Efe', emoji: '💪', color: '#4a90d9' },
    ela: { name: 'Ela', emoji: '🌸', color: '#ff6b6b' }
  },

  // Hoş geldin mesajında görünecek isim
  welcomeName: 'Ela',

  // -------------------------------------------
  // 6. TEMA RENKLERİ
  // -------------------------------------------
  // Uygulamanın ana renk paleti.
  // İstersen CSS'deki :root değişkenlerini de güncelle.
  theme: {
    primary: '#ff4757',
    secondary: '#4a90d9',
    background: '#07070d',
    card: '#1a1a2e',
    text: '#ffffff',
    textMuted: '#888'
  },

  // -------------------------------------------
  // 7. ARKA PLAN GÖRSELLERİ
  // -------------------------------------------
  // Splash, kullanıcı seçim ve giriş ekranlarındaki
  // arka plan resimleri. assets/ klasörüne koyup
  // yolunu buraya yazın.
  backgroundImages: {
    splash: '',
    select: '',
    login: ''
  },

  // -------------------------------------------
  // 8. SUNUCU BAĞLANTISI
  // -------------------------------------------
  // Render'da yayına aldığınız backend'in URL'sini yazın.
  // Örn: "https="//sizin-app.onrender.com"
  // Lokalde test için: "http://localhost:3001"
  serverUrl: 'https://bukalp-senden-api.onrender.com',

  // -------------------------------------------
  // 9. VERİ DOSYALARI (değiştirmeyin)
  // -------------------------------------------
  localDataPaths: {
    kalbim: 'data/kalbim.json',
    memories: 'data/memories.json'
  },

  // -------------------------------------------
  // 10. MÜZİK ÇALMA LİSTESİ
  // -------------------------------------------
  // MP3 dosyalarını assets/sounds/ klasörüne atın.
  // İsimler BÜYÜK/KÜÇÜK harf dahil TAM EŞLEŞMELİ.
  playlist: [],

  // -------------------------------------------
  // 11. KEDİ MESAJLARI
  // -------------------------------------------
  petMessages: [
    'Seni çok seviyorum! 💕',
    'Seni çok özledim! 😊',
    'Karnım acıktı, beni doyur! 🐾',
    'Hadi oyun oynayalım! 🎾',
    'Seninle olmak çok güzel! ✨',
    'Dünyanın en tatlı insanısın! 🌟',
    'Sarıl bana lütfen! 🤗',
    'Bugün harika görünüyorsun! 💫',
    'Seni düşünüyorum hep... 💭',
    'Beraber çok mutluyum! 🥰',
    'Şanslı bir maskotum seninle! 🍀',
    'Hiç bıkmam senden! 💖',
    'Gülüşün dünyayı aydınlatıyor! ☀️',
    'Bir öpücük alabilir miyim? 😘',
    'Sen benim her şeyimsin! 💝'
  ],

  // -------------------------------------------
  // 12. SOHBET YANITLARI
  // -------------------------------------------
  chatResponses: [
    { keywords: ['aşk', 'sevgi', 'love'], response: 'Seni sonsuza kadar seveceğim! 💕' },
    { keywords: ['özledim', 'miss', 'hasret'], response: 'Ben de seni çok özledim! Ne zaman geleceksin? 😊' },
    { keywords: ['nasılsın', 'naber', 'hello', 'merhaba'], response: 'Harikayım! Seni gördüğüm için çok mutluyum! 🥰' },
    { keywords: ['iyi', 'güzel', 'mutlu'], response: 'İyi olman beni de mutlu ediyor! Hep böyle mutlu ol! ✨' },
    { keywords: ['üzgün', 'kötü', 'mutsuz', 'ağlıyor'], response: 'Üzülme, ben buradayım! Seni her zaman neşelendiririm! 🤗' },
    { keywords: ['öp', 'öpticik', 'öpücük'], response: 'Öptüm! Bir tane daha ister misin? 😘😘' },
    { keywords: ['sarıl', 'hug', 'sarılmak'], response: 'Kocaman sarıldım! Sıcacık oldum! 🤗💕' },
    { keywords: ['acık', 'yemek', 'mama'], response: 'Yaşasın yemek! Ama önce seninle oynamak istiyorum! 🐾' },
    { keywords: ['uyku', 'uyu', 'yorgun'], response: 'Uykun mu geldi? Masallar anlatırım sana, uyku masalı... 🌙' },
    { keywords: ['dans', 'oyna', 'şarkı', 'müzik'], response: 'Müzik mi? Hadi dans edelim! 🎵💃' }
  ],

  // -------------------------------------------
  // 13. BİLDİRİM AYARI (değiştirmeyin)
  // -------------------------------------------
  notificationInterval: 60 * 60 * 1000

};

// ============================================
// KURULUM NOTLARI:
// ============================================
// 1. Bu dosyadaki değerleri kendi bilgilerinle değiştir.
// 2. sw.js dosyasının tepesindeki importScripts yolunu
//    kendi repo adına göre güncelle.
// 3. manifest.json dosyasındaki start_url ve scope
//    değerlerini kendi repo adına göre güncelle.
// 4. index.html'deki <title> ve <meta> etiketlerini
//    kendi isimlerinle değiştir.
// 5. MP3 dosyalarını assets/sounds/ klasörüne yükle.
// 6. Arka plan resimlerini assets/ klasörüne yükle.
// 7. Sunucuyu başlatmak için: cd server && npm install && npm start
//    Render'a deploy etmek için server/ klasörünü kullan.
// ============================================
