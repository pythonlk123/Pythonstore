// Firebase Configuration for Python Store (python-store-55bb5)
const firebaseConfig = {
    apiKey: "AIzaSyAxr2ib2zHResZRTpX-ZpSmUDcexGvMrNg",
    authDomain: "python-store-55bb5.firebaseapp.com",
    projectId: "python-store-55bb5",
    storageBucket: "python-store-55bb5.firebasestorage.app",
    messagingSenderId: "780050688191",
    appId: "1:780050688191:web:417284428e433c6e007e0a"
};

// Initialize Firebase App
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully for project: " + firebaseConfig.projectId);
    } catch (e) {
        console.error("Firebase init error:", e);
    }
}

// Services initialization with null-safety
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
const auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;
const storage = (typeof firebase !== 'undefined' && firebase.storage) ? firebase.storage() : null;

// Ensure global window exposure across all scripts and scopes
if (typeof window !== 'undefined') {
    window.db = db;
    window.auth = auth;
    window.storage = storage;
}

// Keep the signed-in Firebase user across page reloads/navigation.
if (auth && firebase.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
    try {
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .catch(err => console.warn('Auth persistence setup skipped:', err && err.code ? err.code : err));
    } catch (e) {
        console.warn('Auth persistence setup failed:', e);
    }
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig, db, auth, storage };
}
