document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-list li a');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navList.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navList.classList.remove('active');
        });
    });

    // Smooth Scrolling for Anchor Links (Optional, CSS scroll-behavior usually handles this but JS is safer for formatting)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Adjust for fixed header
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Simple scroll animation for navbar shadow
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
        } else {
            header.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
        }
    });

    // Exuberant Entrance Animations Setup
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Run once
            }
        });
    }, observerOptions);

    // Select elements to animate and add initial reveal class if they need it
    // We add the class via JS to ensure content is visible if JS is disabled/fails (progressive enhancement approach)
    // or we can select elements that already have the class from HTML.
    // Let's programmatically add animation classes to major sections for that "exuberant" feel without cluttering HTML too much.
    
    // Main Section Headers
    document.querySelectorAll('.section-header').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });

    // Service Blocks - Alternating slide in
    document.querySelectorAll('.service-block').forEach((el, index) => {
        if (index % 2 === 0) {
            el.classList.add('reveal-left');
        } else {
            el.classList.add('reveal-right');
        }
        observer.observe(el);
    });

    // Value Cards (Nosotros)
    document.querySelectorAll('.value-card').forEach((el, index) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${index * 0.1}s`; // Staggered
        observer.observe(el);
    });
    
    // About Text
    const aboutText = document.querySelector('.about-text');
    if (aboutText) {
        aboutText.classList.add('reveal-left');
        observer.observe(aboutText);
    }

    // Project Cards
    document.querySelectorAll('.project-card').forEach((el, index) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });

});
