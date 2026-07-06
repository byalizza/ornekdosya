// ============================================
// FIREBASE INIT - config.js'den okur
// ============================================
// Firebase ayarlarını değiştirmek için
// js/config.js dosyasını düzenleyin.
// ============================================

const firebaseConfig = APP_CONFIG.firebase;

let firebaseApp = null;
let database = null;

function initFirebase() {
  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      firebaseApp = firebase.app();
    }
    database = firebase.database();
    return true;
  } catch (error) {
    console.warn('Firebase başlatılamadı:', error.message);
    return false;
  }
}

function getDatabase() {
  return database;
}