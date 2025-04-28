import { auth, db } from './firebase.js';

class AuthService {
    constructor() {
        this.user = null;
        this.initAuthListener();
    }

    initAuthListener() {
        auth.onAuthStateChanged(async (user) => {
            this.user = user;
            this.updateUI();
            
            if (user) {
                await this.checkUserRole(user.uid);
            }
        });
    }

    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithPopup(provider);
        } catch (error) {
            console.error("Google sign-in error:", error);
            this.showToast("Failed to sign in. Please try again.", "error");
        }
    }

    async signOut() {
        try {
            await auth.signOut();
            window.location.href = "/";
        } catch (error) {
            console.error("Sign out error:", error);
            this.showToast("Failed to sign out", "error");
        }
    }

    async checkUserRole(uid) {
        const doc = await db.collection("users").doc(uid).get();
        if (!doc.exists) {
            this.showRoleModal();
        }
    }

    updateUI() {
        const loginLink = document.getElementById("loginLink");
        const signupLink = document.getElementById("signupLink");
        const profileLink = document.getElementById("profileLink");
        const logoutLink = document.getElementById("logoutLink");

        if (this.user) {
            loginLink.style.display = "none";
            signupLink.style.display = "none";
            profileLink.style.display = "inline-block";
            logoutLink.style.display = "inline-block";
            
            if (this.user.displayName) {
                profileLink.textContent = this.user.displayName;
            }
        } else {
            loginLink.style.display = "inline-block";
            signupLink.style.display = "inline-block";
            profileLink.style.display = "none";
            logoutLink.style.display = "none";
        }
    }

    showRoleModal() {
        const modal = document.getElementById("roleModal");
        if (modal) modal.style.display = "flex";
    }

    async selectRole(role) {
        try {
            if (!this.user) return;
            
            await db.collection("users").doc(this.user.uid).set({
                email: this.user.email,
                displayName: this.user.displayName || "New User",
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            if (role === "freelancer") {
                await this.initFreelancerProfile(this.user.uid);
            }

            window.location.href = "profile.html";
        } catch (error) {
            console.error("Role selection error:", error);
            this.showToast("Failed to save role", "error");
        }
    }

    async initFreelancerProfile(uid) {
        await db.collection("freelancers").doc(uid).set({
            name: this.user.displayName || "Anonymous Animator",
            email: this.user.email,
            skills: [],
            rate: 0,
            rating: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    showToast(message, type = "info") {
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Initialize Auth Service
const authService = new AuthService();

// Global function for role selection
window.selectRole = (role) => authService.selectRole(role);

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("loginLink")?.addEventListener("click", (e) => {
        e.preventDefault();
        authService.signInWithGoogle();
    });

    document.getElementById("signupLink")?.addEventListener("click", (e) => {
        e.preventDefault();
        authService.signInWithGoogle();
    });

    document.getElementById("logoutLink")?.addEventListener("click", (e) => {
        e.preventDefault();
        authService.signOut();
    });
});

export { authService };