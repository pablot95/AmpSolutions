// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDhFvAlpbqV7DohauB_jUDUwQPtCA7601s",
    authDomain: "ampsolutions-6e7d9.firebaseapp.com",
    projectId: "ampsolutions-6e7d9",
    storageBucket: "ampsolutions-6e7d9.firebasestorage.app",
    messagingSenderId: "720023114936",
    appId: "1:720023114936:web:ac4cb319882a3ec185d04d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

document.addEventListener('DOMContentLoaded', () => {

    // === Mobile Navigation ===
    const hamburger = document.querySelector('.hamburger');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-list li a');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navList.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navList.classList.remove('active');
        });
    });

    // === Smooth Scrolling ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        });
    });

    // === Header Shadow on Scroll ===
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
        } else {
            header.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
        }
    });

    // === Scroll Animations ===
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section-header').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });

    document.querySelectorAll('.service-hero-card').forEach((el, index) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });

    document.querySelectorAll('.service-detail-content').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });

    document.querySelectorAll('.service-feature-card, .epc-step, .supply-item, .cyber-benefit').forEach((el, index) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${(index % 4) * 0.1}s`;
        observer.observe(el);
    });

    document.querySelectorAll('.value-card').forEach((el, index) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });

    const aboutText = document.querySelector('.about-text');
    if (aboutText) {
        aboutText.classList.add('reveal-left');
        observer.observe(aboutText);
    }

    document.querySelectorAll('.project-detail').forEach((el, index) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${index * 0.15}s`;
        observer.observe(el);
    });

    document.querySelectorAll('.staff-card').forEach((el, index) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${index * 0.05}s`;
        observer.observe(el);
    });

    // === Image Lightbox ===
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox-overlay';
    lightbox.innerHTML = '<img src="" alt="Vista ampliada">';
    document.body.appendChild(lightbox);

    document.querySelectorAll('.project-gallery img').forEach(img => {
        img.addEventListener('click', () => {
            lightbox.querySelector('img').src = img.src;
            lightbox.classList.add('active');
        });
    });

    lightbox.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    // === Load Projects from Firebase ===
    loadProjectsFromFirebase();

});

// Load projects from Firebase
function loadProjectsFromFirebase() {
    const container = document.getElementById('proyectos-container');
    if (!container) return;

    db.collection('proyectos').orderBy('orden', 'asc').get()
        .then(snapshot => {
            container.innerHTML = '';

            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,0.6);">Próximamente se publicarán nuestros proyectos destacados.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const p = doc.data();
                const projectEl = createProjectElement(p);
                container.appendChild(projectEl);
            });

            // Attach lightbox and scroll animations to new elements
            const lightbox = document.querySelector('.lightbox-overlay');
            container.querySelectorAll('.project-gallery img').forEach(img => {
                img.addEventListener('click', () => {
                    lightbox.querySelector('img').src = img.src;
                    lightbox.classList.add('active');
                });
            });

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15 });

            container.querySelectorAll('.project-detail').forEach((el, index) => {
                el.classList.add('reveal');
                el.style.transitionDelay = `${index * 0.15}s`;
                observer.observe(el);
            });
        })
        .catch(() => {
            container.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,0.6);">Error al cargar proyectos. Intente recargar la página.</p>';
        });
}

function createProjectElement(p) {
    const div = document.createElement('div');
    div.className = 'project-detail';
    div.setAttribute('data-project', p.id || '');

    let metaHTML = '';
    if (p.meta && Array.isArray(p.meta)) {
        metaHTML = p.meta.map(m =>
            `<div class="meta-item"><strong>${escapeHtml(m.label)}:</strong> ${escapeHtml(m.value)}</div>`
        ).join('');
    }

    let specsHTML = '';
    if (p.specs && Array.isArray(p.specs)) {
        specsHTML = p.specs.map(s =>
            `<span class="spec-tag">${escapeHtml(s)}</span>`
        ).join('');
    }

    let galleryHTML = '';
    if (p.imagenes && Array.isArray(p.imagenes)) {
        galleryHTML = p.imagenes.map(img =>
            `<img src="${escapeHtml(img)}" alt="${escapeHtml(p.titulo || '')}" loading="lazy">`
        ).join('');
    }

    const descriptionHTML = (p.descripcion || '').split('\n').filter(Boolean).map(para =>
        `<p>${escapeHtml(para)}</p>`
    ).join('');

    div.innerHTML = `
        <div class="project-detail-header">
            <h3>${escapeHtml(p.titulo || '')}</h3>
            ${p.badge ? `<span class="project-badge">${escapeHtml(p.badge)}</span>` : ''}
        </div>
        ${metaHTML ? `<div class="project-meta">${metaHTML}</div>` : ''}
        <div class="project-description">
            ${descriptionHTML}
        </div>
        ${specsHTML ? `<div class="project-specs">${specsHTML}</div>` : ''}
        ${galleryHTML ? `<div class="project-gallery">${galleryHTML}</div>` : ''}
    `;

    return div;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

