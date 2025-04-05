<script>
// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const links = document.querySelectorAll('.nav-links a');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close menu when clicking a link
links.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar') && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// Video Player Functionality
document.querySelectorAll('.video-player').forEach(player => {
    const video = player.querySelector('video');
    const playOverlay = player.querySelector('.play-overlay');
    const playIcon = player.querySelector('.play-icon i');
    
    // Click to play/pause
    player.addEventListener('click', () => {
        if (video.paused) {
            video.play();
            playOverlay.style.opacity = '0';
            playOverlay.style.pointerEvents = 'none';
            playIcon.classList.replace('fa-play', 'fa-pause');
        } else {
            video.pause();
            playOverlay.style.opacity = '1';
            playOverlay.style.pointerEvents = 'auto';
            playIcon.classList.replace('fa-pause', 'fa-play');
        }
    });
    
    // Show overlay when video ends
    video.addEventListener('ended', () => {
        playOverlay.style.opacity = '1';
        playOverlay.style.pointerEvents = 'auto';
        playIcon.classList.replace('fa-pause', 'fa-play');
    });
});

// Contact Modal Functionality
const modal = document.querySelector('.contact-modal');
const openModalBtn = document.querySelector('.open-modal-btn');
const closeModalBtn = document.querySelector('.close-modal');

openModalBtn.addEventListener('click', () => {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
});

closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Form Submission
const form = document.querySelector('.contact-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        const response = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            alert('Thank you! Your message has been sent. I will get back to you soon.');
            form.reset();
            modal.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            throw new Error('Form submission failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error sending your message. Please try again or contact me directly at mishrakartikey805@gmail.com');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});
</script>