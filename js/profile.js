import { auth, db } from './firebase.js';
import { authService } from './auth.js';

class ProfileManager {
    constructor() {
        this.user = null;
        this.userData = null;
        this.freelancerData = null;
        this.portfolioItems = [];
        this.init();
    }

    async init() {
        this.showLoading(true);
        
        try {
            this.user = auth.currentUser;
            if (!this.user) {
                window.location.href = 'index.html';
                return;
            }

            await this.loadUserData();
            await this.loadFreelancerData();
            await this.loadPortfolioItems();
            
            this.renderProfile();
            this.setupEventListeners();
        } catch (error) {
            console.error("Profile init error:", error);
            this.showError("Failed to load profile data");
        } finally {
            this.showLoading(false);
        }
    }

    async loadUserData() {
        const doc = await db.collection("users").doc(this.user.uid).get();
        if (!doc.exists) throw new Error("User not found");
        this.userData = doc.data();
    }

    async loadFreelancerData() {
        if (this.userData.role === "freelancer") {
            const doc = await db.collection("freelancers").doc(this.user.uid).get();
            this.freelancerData = doc.exists ? doc.data() : null;
        }
    }

    async loadPortfolioItems() {
        if (this.userData.role === "freelancer") {
            const snapshot = await db.collection("portfolio")
                .where("userId", "==", this.user.uid)
                .orderBy("createdAt", "desc")
                .get();
            
            this.portfolioItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
    }

    renderProfile() {
        this.renderBasicInfo();
        
        if (this.userData.role === "freelancer") {
            document.getElementById("freelancerCard").style.display = "block";
            document.getElementById("portfolioCard").style.display = "block";
            this.renderFreelancerInfo();
            this.renderPortfolio();
        }
    }

    renderBasicInfo() {
        const content = `
            <div class="profile-info">
                <div class="avatar-placeholder"></div>
                <h3>${this.user.displayName || "Anonymous User"}</h3>
                <p class="profile-email">${this.user.email}</p>
                <p class="profile-role">Role: ${this.capitalize(this.userData.role)}</p>
            </div>
        `;
        document.getElementById("basicInfoContent").innerHTML = content;
    }

    renderFreelancerInfo() {
        if (!this.freelancerData) return;
        
        const content = `
            <div class="info-row">
                <span class="info-label">Skills:</span>
                <div class="skills-container">
                    ${this.freelancerData.skills?.length 
                        ? this.freelancerData.skills.map(skill => 
                            `<span class="skill-tag">${skill.trim()}</span>`).join('')
                        : '<span class="no-info">Not specified</span>'}
                </div>
            </div>
            <div class="info-row">
                <span class="info-label">Rate:</span>
                <span>${this.freelancerData.rate ? `$${this.freelancerData.rate}/hr` : 'Not set'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Portfolio:</span>
                ${this.freelancerData.portfolio 
                    ? `<a href="${this.ensureHttp(this.freelancerData.portfolio)}" target="_blank">View</a>`
                    : '<span class="no-info">Not provided</span>'}
            </div>
        `;
        document.getElementById("freelancerContent").innerHTML = content;
    }

    renderPortfolio() {
        const portfolioGrid = document.getElementById("portfolioGrid");
        
        if (this.portfolioItems.length === 0) {
            portfolioGrid.innerHTML = `
                <div class="empty-portfolio">
                    <p>No portfolio projects yet. Add your work to showcase your skills!</p>
                </div>
            `;
            return;
        }
        
        portfolioGrid.innerHTML = this.portfolioItems.map(item => `
            <div class="portfolio-item">
                <div class="portfolio-preview"></div>
                <div class="portfolio-details">
                    <h4>${item.title}</h4>
                    <p>${item.description}</p>
                    ${item.link ? `<a href="${this.ensureHttp(item.link)}" target="_blank">View Project</a>` : ''}
                    <button class="btn-delete" data-id="${item.id}">Delete</button>
                </div>
            </div>
        `).join('');
    }

    async updateProfile(data) {
        this.showLoading(true);
        
        try {
            await db.collection("users").doc(this.user.uid).set({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            if (this.userData.role === "freelancer") {
                await this.updateFreelancerProfile(data);
            }
            
            await this.loadUserData();
            await this.loadFreelancerData();
            this.renderProfile();
            
            this.showToast("Profile updated successfully");
            this.closeModal("editProfileModal");
        } catch (error) {
            console.error("Update profile error:", error);
            this.showToast("Failed to update profile", "error");
        } finally {
            this.showLoading(false);
        }
    }

    async updateFreelancerProfile(data) {
        const freelancerData = {
            skills: data.skills ? data.skills.split(",").map(skill => skill.trim()) : [],
            rate: parseFloat(data.rate) || 0,
            portfolio: data.portfolioLink || "",
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection("freelancers").doc(this.user.uid).set(freelancerData, { merge: true });
    }

    async addPortfolioItem(data) {
        this.showLoading(true);
        
        try {
            await db.collection("portfolio").add({
                userId: this.user.uid,
                title: data.title,
                description: data.description,
                link: data.link || "",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            await this.loadPortfolioItems();
            this.renderPortfolio();
            
            this.showToast("Project added to portfolio");
            this.closeModal("addPortfolioModal");
        } catch (error) {
            console.error("Add portfolio error:", error);
            this.showToast("Failed to add project", "error");
        } finally {
            this.showLoading(false);
        }
    }

    async deletePortfolioItem(itemId) {
        if (!confirm("Are you sure you want to delete this project?")) return;
        
        this.showLoading(true);
        
        try {
            await db.collection("portfolio").doc(itemId).delete();
            await this.loadPortfolioItems();
            this.renderPortfolio();
            this.showToast("Project deleted");
        } catch (error) {
            console.error("Delete portfolio error:", error);
            this.showToast("Failed to delete project", "error");
        } finally {
            this.showLoading(false);
        }
    }

    setupEventListeners() {
        // Edit profile button
        document.getElementById("editProfileBtn").addEventListener("click", () => {
            this.openEditModal();
        });
        
        // Profile form submission
        document.getElementById("profileForm").addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleProfileSubmit();
        });
        
        // Add portfolio button
        document.getElementById("addPortfolioBtn").addEventListener("click", () => {
            this.openAddPortfolioModal();
        });
                // Portfolio form submission
                document.getElementById("portfolioForm").addEventListener("submit", (e) => {
                    e.preventDefault();
                    this.handlePortfolioSubmit();
                });
        
                // Delete portfolio item buttons
                document.getElementById("portfolioGrid").addEventListener("click", (e) => {
                    if (e.target.classList.contains("btn-delete")) {
                        this.deletePortfolioItem(e.target.dataset.id);
                    }
                });
            }
        
            openEditModal() {
                // Populate form with current data
                document.getElementById("displayName").value = this.user.displayName || "";
                document.getElementById("bio").value = this.userData.bio || "";
                
                if (this.userData.role === "freelancer") {
                    document.getElementById("freelancerFields").style.display = "block";
                    document.getElementById("skills").value = this.freelancerData?.skills?.join(", ") || "";
                    document.getElementById("rate").value = this.freelancerData?.rate || "";
                    document.getElementById("portfolioLink").value = this.freelancerData?.portfolio || "";
                } else {
                    document.getElementById("freelancerFields").style.display = "none";
                }
                
                this.openModal("editProfileModal");
            }
        
            openAddPortfolioModal() {
                // Reset form
                document.getElementById("portfolioForm").reset();
                this.openModal("addPortfolioModal");
            }
        
            async handleProfileSubmit() {
                const formData = {
                    displayName: document.getElementById("displayName").value,
                    bio: document.getElementById("bio").value
                };
                
                if (this.userData.role === "freelancer") {
                    formData.skills = document.getElementById("skills").value;
                    formData.rate = document.getElementById("rate").value;
                    formData.portfolioLink = document.getElementById("portfolioLink").value;
                }
                
                await this.updateProfile(formData);
                
                // Update auth display name if changed
                if (formData.displayName !== this.user.displayName) {
                    try {
                        await this.user.updateProfile({
                            displayName: formData.displayName
                        });
                    } catch (error) {
                        console.error("Error updating auth profile:", error);
                    }
                }
            }
        
            async handlePortfolioSubmit() {
                const formData = {
                    title: document.getElementById("projectTitle").value,
                    description: document.getElementById("projectDescription").value,
                    link: document.getElementById("projectLink").value
                };
                
                if (!formData.title || !formData.description) {
                    this.showToast("Title and description are required", "error");
                    return;
                }
                
                await this.addPortfolioItem(formData);
            }
        
            // Helper methods
            capitalize(str) {
                return str.charAt(0).toUpperCase() + str.slice(1);
            }
        
            ensureHttp(url) {
                if (!url) return "";
                return url.startsWith("http") ? url : `https://${url}`;
            }
        
            showLoading(show) {
                const loadingElements = document.querySelectorAll(".loading-indicator");
                loadingElements.forEach(el => {
                    el.style.display = show ? "block" : "none";
                });
            }
        
            showToast(message, type = "success") {
                const toast = document.createElement("div");
                toast.className = `toast toast-${type}`;
                toast.textContent = message;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.classList.add("fade-out");
                    setTimeout(() => toast.remove(), 500);
                }, 3000);
            }
        
            openModal(id) {
                document.getElementById(id).style.display = "flex";
            }
        
            closeModal(id) {
                document.getElementById(id).style.display = "none";
            }
        
            showError(message) {
                const errorElement = document.createElement("div");
                errorElement.className = "error-message";
                errorElement.textContent = message;
                
                const main = document.querySelector("main");
                main.insertBefore(errorElement, main.firstChild);
            }
        }
        
        // Initialize ProfileManager when DOM is loaded
        document.addEventListener("DOMContentLoaded", () => {
            auth.onAuthStateChanged(user => {
                if (user) {
                    new ProfileManager();
                } else {
                    window.location.href = "index.html";
                }
            });
        });
        
        // Global modal functions
        window.openModal = function(id) {
            document.getElementById(id).style.display = "flex";
        };
        
        window.closeModal = function(id) {
            document.getElementById(id).style.display = "none";
        };