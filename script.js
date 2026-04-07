// Detect mobile/touch devices
const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768;

const navEl = document.querySelector('.nav-velocity');
const scrollTooltip = document.getElementById('scrollTooltip');
const tooltipBackdrop = document.getElementById('tooltipBackdrop');
let didFirstScroll = false;
const mobilePillLinks = Array.from(document.querySelectorAll('.mobile-pill-nav .pill-link'));

// Custom Cursor - Desktop Only
if (!isMobile) {
    const cursor = document.querySelector('.cursor');
    const cursorDot = document.querySelector('.cursor-dot');
    
    if (cursor && cursorDot) {
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = mouseX - 2 + 'px';
            cursorDot.style.top = mouseY - 2 + 'px';
        });

        // Smooth cursor follow
        function animateCursor() {
            cursorX += (mouseX - 10 - cursorX) * 0.1;
            cursorY += (mouseY - 10 - cursorY) * 0.1;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Hover effects
        const hoverElements = document.querySelectorAll('a, button, .project-card, .service-item, .cta-button');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });
    }
}

// Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

if (menuToggle && mobileMenu) {
    const openMenu = () => {
        menuToggle.classList.add('active');
        mobileMenu.hidden = false;
        mobileMenu.offsetHeight;
        mobileMenu.classList.add('active');
        document.body.classList.add('menu-open');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', 'Close menu');
        const firstLink = mobileMenu.querySelector('.mobile-link');
        if (firstLink) firstLink.focus({ preventScroll: true });
    };

    const closeMenu = () => {
        menuToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open menu');
        window.setTimeout(() => {
            if (!mobileMenu.classList.contains('active')) mobileMenu.hidden = true;
        }, 260);
    };

    menuToggle.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.contains('active');
        if (isOpen) closeMenu();
        else openMenu();
    });

    // Close menu when clicking links
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            closeMenu();
        });
    });

    // Close on ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMenu();
            menuToggle.focus({ preventScroll: true });
        }
    });

    // Click outside panel to close
    mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) closeMenu();
    });
}

// Z-Axis Scroll Implementation - Desktop Only
if (!isMobile && window.innerWidth > 768) {
    const mainContainer = document.getElementById('mainContainer');
    const scrollProgress = document.querySelector('.scroll-progress');
    const totalSections = 5;
    const sectionHeight = window.innerHeight;
    const maxZ = -(totalSections - 1) * sectionHeight;
    
    let targetZ = 0;
    let currentZ = 0;
    const sections = Array.from(document.querySelectorAll('.content-section'));
    const navLinks = Array.from(document.querySelectorAll('.nav-link-custom'));

    // Wheel event with passive: false to allow preventDefault [^10^]
    window.addEventListener('wheel', (e) => {
        e.preventDefault();

        if (!didFirstScroll) {
            didFirstScroll = true;
            if (tooltipBackdrop) tooltipBackdrop.classList.remove('is-active');
            if (scrollTooltip) {
                scrollTooltip.classList.add('teleport');
                // give the teleport a beat, then fade
                window.setTimeout(() => scrollTooltip.classList.add('is-hidden'), 900);
            }
        }
        
        // Smooth scroll accumulation
        targetZ += e.deltaY * 0.8;
        
        // Clamp values
        targetZ = Math.max(maxZ, Math.min(0, targetZ));
        
    }, { passive: false });

    // Touch events for mobile/desktop hybrid
    let touchStartY = 0;
    let touchStartTime = 0;
    
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!touchStartY) return;

        if (!didFirstScroll) {
            didFirstScroll = true;
            if (tooltipBackdrop) tooltipBackdrop.classList.remove('is-active');
            if (scrollTooltip) {
                scrollTooltip.classList.add('teleport');
                window.setTimeout(() => scrollTooltip.classList.add('is-hidden'), 900);
            }
        }
        
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        
        targetZ += deltaY * 2;
        targetZ = Math.max(maxZ, Math.min(0, targetZ));
        
        touchStartY = touchY;
    }, { passive: false });

    window.addEventListener('touchend', () => {
        touchStartY = 0;
    }, { passive: true });

    // Animation loop
    function animate() {
        // Smooth interpolation (lerp)
        currentZ += (targetZ - currentZ) * 0.08;

        const scrollPos = Math.abs(currentZ);

        // Position sections in Z space + fade by depth to avoid overlap
        if (sections.length) {
            sections.forEach((section, i) => {
                const baseZ = -i * sectionHeight;
                const z = baseZ + scrollPos;
                section.style.transform = `translateZ(${z}px)`;

                const depth = Math.abs(z);
                const opacity = Math.max(0, Math.min(1, 1 - depth / (sectionHeight * 0.75)));
                section.style.opacity = String(opacity);
                section.style.pointerEvents = opacity > 0.6 ? 'auto' : 'none';
            });
        }
        
        // Sticky nav state
        if (navEl) {
            const scrolled = scrollPos > 24;
            navEl.classList.toggle('scrolled', scrolled);
        }

        // Active nav link based on section index
        if (sections.length && navLinks.length) {
            const idx = Math.round(scrollPos / sectionHeight);
            navLinks.forEach(a => a.classList.remove('active'));
            const active = navLinks.find(a => a.getAttribute('href') === `#${sections[Math.min(idx, sections.length - 1)]?.id}`);
            if (active) active.classList.add('active');
        }
        
        // Update progress bar
        if (scrollProgress) {
            const progress = scrollPos / Math.abs(maxZ);
            scrollProgress.style.transform = `scaleX(${Math.min(1, progress)})`;
        }
        
        // Parallax for floating shapes
        const shapes = document.querySelectorAll('.floating-shape');
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.3;
            const offset = currentZ * speed * 0.05;
            shape.style.transform = `translateZ(${offset}px) rotate(${Date.now() * 0.001 * (index + 1)}deg)`;
        });
        
        requestAnimationFrame(animate);
    }
    animate();

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const index = Array.from(document.querySelectorAll('.content-section')).indexOf(targetSection);
                targetZ = -index * sectionHeight;
            }
        });
    });
} else {
    // Mobile: Normal scroll behavior
    const scrollProgress = document.querySelector('.scroll-progress');
    const sections = Array.from(document.querySelectorAll('.content-section'));
    const navLinks = Array.from(document.querySelectorAll('.nav-link-custom'));
    
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = winScroll / height;
        
        if (scrollProgress) {
            scrollProgress.style.transform = `scaleX(${scrolled})`;
        }

        if (scrollTooltip && winScroll > 10 && !didFirstScroll) {
            didFirstScroll = true;
            if (tooltipBackdrop) tooltipBackdrop.classList.remove('is-active');
            scrollTooltip.classList.add('teleport');
            window.setTimeout(() => scrollTooltip.classList.add('is-hidden'), 900);
        }

        if (navEl) {
            navEl.classList.toggle('scrolled', winScroll > 10);
        }
    }, { passive: true });

    // Active section highlighting (mobile)
    if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                navLinks.forEach(a => a.classList.remove('active'));
                const active = navLinks.find(a => a.getAttribute('href') === `#${entry.target.id}`);
                if (active) active.classList.add('active');
            });
        }, { root: null, threshold: 0.55 });
        sections.forEach(s => io.observe(s));
    }

    // Bottom pill active section (mobile)
    if (sections.length && mobilePillLinks.length && 'IntersectionObserver' in window) {
        const ioPill = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                mobilePillLinks.forEach(a => a.classList.remove('active'));
                const active = mobilePillLinks.find(a => a.getAttribute('href') === `#${entry.target.id}`);
                if (active) active.classList.add('active');
            });
        }, { root: null, threshold: 0.55 });
        sections.forEach(s => ioPill.observe(s));
    }
}

// Tooltip start state: show backdrop + timed fade if no scroll
if (scrollTooltip && !isMobile) {
    if (tooltipBackdrop) tooltipBackdrop.classList.add('is-active');
    window.setTimeout(() => {
        if (!didFirstScroll) {
            if (tooltipBackdrop) tooltipBackdrop.classList.remove('is-active');
            scrollTooltip.classList.add('is-hidden');
        }
    }, 3000);
}

// Mobile card sheen: set CSS vars on tap/move (very light)
if (isMobile) {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach((card) => {
        const setVars = (clientX, clientY) => {
            const rect = card.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
            card.style.setProperty('--sheen-x', `${Math.round(x * 100)}%`);
            card.style.setProperty('--sheen-y', `${Math.round(y * 100)}%`);
        };

        card.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            if (t) setVars(t.clientX, t.clientY);
        }, { passive: true });

        card.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            if (t) setVars(t.clientX, t.clientY);
        }, { passive: true });
    });
}

// Scroll reveal system
(() => {
    const revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    // Instant reveal for reduced motion users
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
        revealEls.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            }
        });
    }, { root: null, threshold: 0.15 });

    revealEls.forEach(el => io.observe(el));
})();

// Stats Counter Animation
const statNumbers = document.querySelectorAll('.stat-number');
let animated = false;

function animateStats() {
    if (animated) return;
    
    const aboutSection = document.getElementById('about');
    if (!aboutSection) return;
    
    const rect = aboutSection.getBoundingClientRect();
    
    if (rect.top < window.innerHeight && rect.bottom > 0) {
        animated = true;
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const duration = 2000;
            const startTime = performance.now();
            
            function updateCounter(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                const current = Math.floor(easeOutQuart * target);
                
                stat.textContent = current;
                
                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    stat.textContent = target;
                }
            }
            
            requestAnimationFrame(updateCounter);
        });
    }
}

// Trigger on scroll for both desktop and mobile
window.addEventListener('scroll', animateStats, { passive: true });
if (!isMobile) {
    // Also check during Z-scroll animation
    setInterval(animateStats, 100);
}

// Particle System - Desktop Optimized
const canvas = document.getElementById('particle-canvas');
if (canvas && !isMobile) {
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    
    const particles = [];
    const particleCount = isMobile ? 20 : 50;
    
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }

        draw() {
            ctx.fillStyle = `rgba(255, 61, 0, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    let frameCount = 0;
    function animateParticles() {
        // Skip every other frame on mobile for performance
        if (isMobile && frameCount % 2 !== 0) {
            frameCount++;
            requestAnimationFrame(animateParticles);
            return;
        }
        frameCount++;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        // Connect particles (only every 3rd particle for performance)
        if (!isMobile) {
            particles.forEach((a, index) => {
                if (index % 3 !== 0) return;
                
                particles.slice(index + 1).forEach(b => {
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.strokeStyle = `rgba(255, 61, 0, ${0.1 * (1 - distance / 150)})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                });
            });
        }

        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    window.addEventListener('resize', resizeCanvas, { passive: true });
} else if (canvas) {
    // Hide canvas on mobile
    canvas.style.display = 'none';
}

// 3D Tilt Effect for Project Cards - Desktop Only
if (!isMobile) {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(30px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
}

// Glitch Effect Random Trigger
const glitchElements = document.querySelectorAll('.glitch');
if (glitchElements.length > 0) {
    setInterval(() => {
        glitchElements.forEach(glitch => {
            glitch.style.animation = 'none';
            setTimeout(() => {
                glitch.style.animation = '';
            }, 10);
        });
    }, 5000);
}

// Handle resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Reload page if switching between mobile/desktop breakpoints
        const newIsMobile = window.innerWidth <= 768;
        if (newIsMobile !== isMobile) {
            window.location.reload();
        }
    }, 250);
}, { passive: true });

// Prevent default on arrow keys for desktop scroll
if (!isMobile) {
    window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' '].includes(e.key)) {
            e.preventDefault();
            
            const sectionHeight = window.innerHeight;
            if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
                targetZ = Math.max(maxZ, targetZ - sectionHeight * 0.5);
            } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                targetZ = Math.min(0, targetZ + sectionHeight * 0.5);
            }
        }
    });
}

