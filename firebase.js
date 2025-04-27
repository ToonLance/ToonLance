// firebase.js - Enhanced Authentication System
class ToonLanceAuth {
  constructor() {
    this.user = null;
    this.auth = null;
    this.db = null;
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      // Check if Firebase is loaded
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded. Please check your network connection.');
      }

      // Initialize Firebase
      const firebaseConfig = {
        apiKey: "AIzaSyA1YGFbDHDuSQVXFsRO-XD7Usir9dULoEU",
        authDomain: "testing-dba79.firebaseapp.com",
        projectId: "testing-dba79",
        storageBucket: "testing-dba79.firebasestorage.app",
        messagingSenderId: "808371260131",
        appId: "1:808371260131:web:a59f409f532e617cba13d6"
      };

      firebase.initializeApp(firebaseConfig);
      this.auth = firebase.auth();
      this.db = firebase.firestore();
      this.isInitialized = true;

      // Set up auth state listener
      this.auth.onAuthStateChanged(async (user) => {
        this.user = user;
        this.updateAuthUI();
        if (user) await this.handleUserRole(user);
      });

    } catch (error) {
      console.error('Initialization error:', error);
      this.showToast('Failed to initialize authentication. Please refresh the page.', 'error');
    }
  }

  // Enhanced Google Sign-In with multiple fallbacks
  async signInWithGoogle() {
    if (!this.isInitialized) {
      this.showToast('Authentication system is still loading. Please wait...', 'warning');
      return;
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({ prompt: 'select_account' });

      // Try popup first, fall back to redirect if needed
      let result;
      try {
        result = await this.auth.signInWithPopup(provider);
      } catch (popupError) {
        console.warn('Popup failed, trying redirect:', popupError);
        await this.auth.signInWithRedirect(provider);
        return;
      }

      // Successful popup sign-in
      this.user = result.user;
      this.showToast(`Welcome ${this.user.displayName || ''}!`, 'success');
      return this.user;

    } catch (error) {
      console.error('Google Sign-In Error:', error);
      this.handleAuthError(error);
      throw error;
    }
  }

  // Comprehensive error handling
  handleAuthError(error) {
    let message = 'Failed to sign in. Please try again.';
    
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        message = 'Sign-in window was closed. Please try again.';
        break;
      case 'auth/account-exists-with-different-credential':
        message = 'An account already exists with this email. Try a different sign-in method.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your internet connection.';
        break;
      case 'auth/operation-not-allowed':
        message = 'Google sign-in is not enabled. Please contact support.';
        break;
      case 'auth/cancelled-popup-request':
      case 'auth/popup-blocked':
        message = 'Sign-in popup was blocked. Please allow popups for this site.';
        break;
    }

    this.showToast(message, 'error');
  }

  // Role management
  async handleUserRole(user) {
    try {
      const userDoc = await this.db.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        this.showRoleModal();
      } else if (userDoc.data().role === 'freelancer') {
        await this.ensureFreelancerProfile(user);
      }
    } catch (error) {
      console.error('Role handling error:', error);
      this.showToast('Error loading your profile data', 'error');
    }
  }

  async ensureFreelancerProfile(user) {
    try {
      await this.db.collection('freelancers').doc(user.uid).set({
        name: user.displayName || 'Anonymous Animator',
        email: user.email,
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Freelancer profile error:', error);
    }
  }

  // UI Updates
  updateAuthUI() {
    const authLinks = {
      loginLink: !this.user,
      signupLink: !this.user,
      profileLink: !!this.user,
      logoutLink: !!this.user
    };

    Object.entries(authLinks).forEach(([id, shouldShow]) => {
      const element = document.getElementById(id);
      if (element) element.style.display = shouldShow ? 'inline-block' : 'none';
    });

    if (this.user && this.user.displayName) {
      const profileLink = document.getElementById('profileLink');
      if (profileLink) {
        profileLink.textContent = this.user.displayName;
        profileLink.title = `Logged in as ${this.user.displayName}`;
      }
    }
  }

  showRoleModal() {
    const modal = document.getElementById('roleModal');
    if (modal) modal.style.display = 'flex';
  }

  // Toast notification system
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `auth-toast auth-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 5000);
  }

  // Sign out
  async signOut() {
    try {
      await this.auth.signOut();
      this.showToast('You have been signed out', 'success');
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Sign out error:', error);
      this.showToast('Failed to sign out. Please try again.', 'error');
    }
  }

  // Role selection
  async selectRole(role) {
    try {
      if (!this.user) throw new Error('No authenticated user');
      
      await this.db.collection('users').doc(this.user.uid).set({
        email: this.user.email,
        name: this.user.displayName || 'New User',
        role: role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      if (role === 'freelancer') {
        await this.ensureFreelancerProfile(this.user);
      }

      window.location.href = 'profile.html';
    } catch (error) {
      console.error('Role selection error:', error);
      this.showToast('Failed to save your role selection', 'error');
    }
  }
}

// Initialize and expose the auth system
const toonLanceAuth = new ToonLanceAuth();

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Auth link handlers
  const handleAuthClick = async (e) => {
    e.preventDefault();
    try {
      await toonLanceAuth.signInWithGoogle();
    } catch (error) {
      // Errors already handled by the auth system
    }
  };

  document.getElementById('loginLink')?.addEventListener('click', handleAuthClick);
  document.getElementById('signupLink')?.addEventListener('click', handleAuthClick);
  
  document.getElementById('logoutLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    toonLanceAuth.signOut();
  });
});

// Global access for role selection
window.selectRole = (role) => toonLanceAuth.selectRole(role);