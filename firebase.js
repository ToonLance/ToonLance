// Check if Firebase SDK is loaded
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded. Ensure Firebase CDN scripts are included and loaded before firebase.js.');
    alert('Failed to load Firebase SDK. Please check your network or disable ad blockers.');
    throw new Error('Firebase SDK not loaded');
}

// Firebase Configuration (Replace with your actual Firebase project config from Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyA1YGFbDHDuSQVXFsRO-XD7Usir9dULoEU",
    authDomain: "testing-dba79.firebaseapp.com",
    projectId: "testing-dba79",
    storageBucket: "testing-dba79.firebasestorage.app",
    messagingSenderId: "808371260131",
    appId: "1:808371260131:web:a59f409f532e617cba13d6"
};

// Validate Firebase Config
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const isConfigValid = requiredFields.every(field => 
    firebaseConfig[field] && 
    firebaseConfig[field] !== `your-${field.replace(/([A-Z])/g, '-$1').toLowerCase()}` &&
    typeof firebaseConfig[field] === 'string' &&
    firebaseConfig[field].trim() !== ''
);

if (!isConfigValid) {
    const missingFields = requiredFields.filter(field => 
        !firebaseConfig[field] || 
        firebaseConfig[field] === `your-${field.replace(/([A-Z])/g, '-$1').toLowerCase()}` ||
        typeof firebaseConfig[field] !== 'string' ||
        firebaseConfig[field].trim() === ''
    );
    console.error('Invalid Firebase configuration. Missing or invalid fields:', missingFields.join(', '));
    alert('Firebase configuration is invalid. Please update firebaseConfig with valid credentials from Firebase Console.');
    throw new Error('Invalid Firebase configuration');
}

// Initialize Firebase with error handling
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
    alert('Failed to initialize Firebase: ' + error.message);
    throw error;
}

const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;

// Firebase Auth State Listener
auth.onAuthStateChanged(user => {
    currentUser = user;
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    const profileLink = document.getElementById('profileLink');
    const logoutLink = document.getElementById('logoutLink');
    
    if (user) {
        console.log('User signed in:', user.email);
        if (loginLink) loginLink.style.display = 'none';
        if (signupLink) signupLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'inline';
        if (logoutLink) logoutLink.style.display = 'inline';
        checkUserRole(user);
    } else {
        console.log('No user signed in');
        if (loginLink) loginLink.style.display = 'inline';
        if (signupLink) signupLink.style.display = 'inline';
        if (profileLink) profileLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'none';
    }
});

// Google Sign-In
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => {
            console.log('Sign-in successful, redirecting to profile.html');
            window.location.href = 'profile.html';
        })
        .catch(error => {
            console.error('Sign-in error:', error);
            alert('Error signing in: ' + error.message);
        });
}

// Check User Role
async function checkUserRole(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const roleModal = document.getElementById('roleModal');
        if (!userDoc.exists && roleModal) {
            console.log('No user role found, showing role modal');
            roleModal.style.display = 'flex';
        } else if (userDoc.exists && userDoc.data().role === 'freelancer') {
            console.log('Freelancer role detected, updating profile');
            updateFreelancerProfile(user);
        }
    } catch (error) {
        console.error('Error checking user role:', error);
        alert('Error checking user role: ' + error.message);
    }
}

// Role Selection
async function selectRole(role) {
    if (currentUser) {
        try {
            await db.collection('users').doc(currentUser.uid).set({
                email: currentUser.email,
                name: currentUser.displayName,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            const roleModal = document.getElementById('roleModal');
            if (roleModal) {
                roleModal.style.display = 'none';
            }
            if (role === 'freelancer') {
                console.log('Freelancer role selected, updating profile');
                updateFreelancerProfile(currentUser);
            }
            console.log('Role selected, redirecting to profile.html');
            window.location.href = 'profile.html';
        } catch (error) {
            console.error('Error selecting role:', error);
            alert('Error selecting role: ' + error.message);
        }
    }
}

// Update Freelancer Profile
async function updateFreelancerProfile(user) {
    try {
        await db.collection('freelancers').doc(user.uid).set({
            name: user.displayName,
            email: user.email,
            portfolio: 'https://example.com/portfolio',
            skills: ['2D Animation', 'Motion Graphics'],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log('Freelancer profile updated');
    } catch (error) {
        console.error('Error updating freelancer profile:', error);
        alert('Error updating freelancer profile: ' + error.message);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    const logoutLink = document.getElementById('logoutLink');
    
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Login link clicked');
            signInWithGoogle();
        });
    } else {
        console.warn('Login link element not found');
    }
    
    if (signupLink) {
        signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Sign Up link clicked');
            signInWithGoogle();
        });
    } else {
        console.warn('Sign Up link element not found');
    }
    
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Logout link clicked');
            auth.signOut().then(() => {
                console.log('Sign-out successful, redirecting to index.html');
                window.location.href = 'index.html';
            }).catch(error => {
                console.error('Sign-out error:', error);
                alert('Error signing out: ' + error.message);
            });
        });
    } else {
        console.warn('Logout link element not found');
    }
});