/**
 * SHAWN BELLAZAN PORTFOLIO - MAIN JAVASCRIPT
 * Version: 2.0 (PMCR-O Optimized)
 * Architecture: Vanilla JS, Event-Driven, Performance-Optimized
 */

(function() {
    'use strict';

    // If site-wide core is present (site.js), avoid duplicating nav/theme behaviors.
    const hasSiteCore = typeof window !== 'undefined' && !!window.__pmcroSiteInitialized;

    // ==================== UTILITY FUNCTIONS ====================
    
    /**
     * Debounce function for performance optimization
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    function debounce(func, wait = 100) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function for scroll performance
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    function throttle(func, limit = 100) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ==================== MOBILE MENU ====================
    
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (!hasSiteCore && mobileToggle && navMenu) {
        // Toggle mobile menu
        mobileToggle.addEventListener('click', () => {
            const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
            
            // Toggle menu visibility
            navMenu.classList.toggle('active');
            
            // Update ARIA attribute
            mobileToggle.setAttribute('aria-expanded', !isExpanded);
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = !isExpanded ? 'hidden' : '';
        });

        // Close menu when clicking a link
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });

        // Handle escape key to close menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
                mobileToggle.focus(); // Return focus to toggle button
            }
        });
    }

    // ==================== NAVBAR SCROLL EFFECT ====================
    
    const navbar = document.querySelector('nav');
    
    if (!hasSiteCore && navbar) {
        const handleScroll = throttle(() => {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, 100);

        window.addEventListener('scroll', handleScroll);
    }

    // ==================== SMOOTH SCROLL TO SECTIONS ====================
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Ignore empty or placeholder anchors
            if (href === '#' || href === '#!') return;
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            // Only prevent default and scroll if target exists on the page
            if (targetElement) {
                e.preventDefault();
                
                const navHeight = navbar ? navbar.offsetHeight : 70;
                const targetPosition = targetElement.offsetTop - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update focus for accessibility
                targetElement.focus({ preventScroll: true });
            }
        });
    });

    // ==================== INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS ====================
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observerCallback = (entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Stagger animations for visual effect
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
                
                // Stop observing once animation is triggered
                observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // ==================== ACTIVE NAV LINK HIGHLIGHTING ====================
    
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

    if (sections.length && navLinks.length) {
        const highlightNav = throttle(() => {
            let currentSection = '';
            const navHeight = navbar ? navbar.offsetHeight : 70;
            const scrollPosition = window.pageYOffset;

            // Find which section is currently in view
            sections.forEach(section => {
                const sectionTop = section.offsetTop - navHeight - 100;
                const sectionHeight = section.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    currentSection = section.getAttribute('id');
                }
            });

            // Update active nav link
            navLinks.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href');
                
                if (href === `#${currentSection}`) {
                    link.classList.add('active');
                }
            });
        }, 100);

        window.addEventListener('scroll', highlightNav);
        
        // Run once on page load
        highlightNav();
    }

    // ==================== 3D CARD HOVER EFFECT (Desktop Only) ====================
    
    if (window.innerWidth > 768) {
        const cards = document.querySelectorAll('.work-card, .philosophy-card, .skill-category, .achievement-card');
        
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Calculate rotation based on mouse position
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    // ==================== PERFORMANCE: LAZY LOAD IMAGES ====================
    
    if ('loading' in HTMLImageElement.prototype) {
        // Native lazy loading supported
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // Fallback for browsers that don't support native lazy loading
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        const lazyImageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    lazyImageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => lazyImageObserver.observe(img));
    }

    // ==================== ACCESSIBILITY: FOCUS TRAP FOR MOBILE MENU ====================
    
    if (!hasSiteCore && navMenu) {
        const focusableElements = navMenu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        document.addEventListener('keydown', (e) => {
            if (!navMenu.classList.contains('active')) return;

            if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else { // Tab
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
    }

    // ==================== PERFORMANCE: PRELOAD CRITICAL RESOURCES ====================
    
    function preloadCriticalAssets() {
        // Preload fonts if needed
        const fonts = [
            // Add any custom font URLs here if applicable
        ];

        fonts.forEach(font => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'font';
            link.type = 'font/woff2';
            link.href = font;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    // ==================== ANALYTICS: TRACK KEY INTERACTIONS ====================
    
    function trackInteraction(action, label) {
        // Placeholder for analytics tracking
        // Replace with your analytics service (Google Analytics, Plausible, etc.)
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': 'User Interaction',
                'event_label': label
            });
        }
        
        console.log(`Tracked: ${action} - ${label}`);
    }

    // Track CTA button clicks
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', () => {
            trackInteraction('CTA Click', btn.textContent.trim());
        });
    });

    // Track work project link clicks
    document.querySelectorAll('.work-link').forEach(link => {
        link.addEventListener('click', () => {
            trackInteraction('Project Link Click', link.textContent.trim());
        });
    });

    // ==================== ERROR HANDLING: GRACEFUL DEGRADATION ====================
    
    window.addEventListener('error', (e) => {
        console.error('Runtime error:', e.message);
        // Optionally send error to logging service
    });

    // ==================== INITIALIZATION ====================
    
    function init() {
        console.log('🚀 Shawn Bellazan Portfolio - Initialized');
        console.log('💡 PMCR-O Framework v2.0');
        console.log('🔗 GitHub: https://github.com/shawndelainebellazancom-ui');
        
        // Preload critical assets
        preloadCriticalAssets();
        
        // Add loaded class to body for CSS hooks
        document.body.classList.add('loaded');
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ==================== PAGE VISIBILITY API: PAUSE ANIMATIONS ====================
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause animations when page is not visible
            document.body.classList.add('page-hidden');
        } else {
            document.body.classList.remove('page-hidden');
        }
    });

    // ==================== REDUCE MOTION: ACCESSIBILITY ====================
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
        // Disable animations for users who prefer reduced motion
        document.documentElement.style.setProperty('--transition-base', '0s');
        document.documentElement.style.setProperty('--transition-fast', '0s');
        document.documentElement.style.setProperty('--transition-slow', '0s');
    }

})();