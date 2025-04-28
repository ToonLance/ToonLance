// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1YGFbDHDuSQVXFsRO-XD7Usir9dULoEU",
  authDomain: "testing-dba79.firebaseapp.com",
  projectId: "testing-dba79",
  storageBucket: "testing-dba79.firebasestorage.app",
  messagingSenderId: "808371260131",
  appId: "1:808371260131:web:a59f409f532e617cba13d6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
.catch((err) => {
    console.error("Firebase persistence error:", err);
});

// Export services
export { firebase, auth, db };