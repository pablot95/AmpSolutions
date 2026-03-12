// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDhFvAlpbqV7DohauB_jUDUwQPtCA7601s",
    authDomain: "ampsolutions-6e7d9.firebaseapp.com",
    projectId: "ampsolutions-6e7d9",
    storageBucket: "ampsolutions-6e7d9.firebasestorage.app",
    messagingSenderId: "720023114936",
    appId: "1:720023114936:web:ac4cb319882a3ec185d04d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// === STATE ===
let currentDeleteAction = null;

// === DOM ELEMENTS ===
const loginScreen = document.getElementById('login-screen');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const btnLogout = document.getElementById('btn-logout');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const navItems = document.querySelectorAll('.nav-item');
const sectionTitle = document.getElementById('section-title');

// === AUTH (preset credentials) ===
const ADMIN_USER = 'Ampsolutions';
const ADMIN_PASS = 'Ampsolutions1';

function checkSession() {
    if (sessionStorage.getItem('amp_admin_logged') === 'true') {
        loginScreen.style.display = 'none';
        adminPanel.style.display = 'flex';
        document.getElementById('admin-user-email').textContent = ADMIN_USER;
        loadProjects();
        loadImages();
    } else {
        loginScreen.style.display = 'flex';
        adminPanel.style.display = 'none';
    }
}

loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const password = document.getElementById('login-password').value;
    loginError.textContent = '';

    if (user === ADMIN_USER && password === ADMIN_PASS) {
        sessionStorage.setItem('amp_admin_logged', 'true');
        checkSession();
    } else {
        loginError.textContent = 'Credenciales incorrectas. Intente nuevamente.';
    }
});

btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('amp_admin_logged');
    checkSession();
});

// === SIDEBAR NAVIGATION ===
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

navItems.forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        const section = item.dataset.section;

        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`section-${section}`).classList.add('active');

        sectionTitle.textContent = item.textContent.trim();
        sidebar.classList.remove('open');
    });
});

// === MODAL MANAGEMENT ===
document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.dataset.close;
        document.getElementById(modalId).classList.remove('active');
    });
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('active');
    });
});

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// === TOAST ===
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// === PROJECTS ===
const projectsList = document.getElementById('projects-list');
const projectForm = document.getElementById('project-form');
const btnAddProject = document.getElementById('btn-add-project');
const metaFields = document.getElementById('meta-fields');
const btnAddMeta = document.getElementById('btn-add-meta');
const imageUrlsContainer = document.getElementById('project-image-urls');
const btnAddImageUrl = document.getElementById('btn-add-image-url');
const projectImagesInput = document.getElementById('project-images-input');
const projectImagesPreview = document.getElementById('project-images-preview');
let pendingImageFiles = []; // Accumulated files across multiple selections

// Add Project Button
btnAddProject.addEventListener('click', () => {
    resetProjectForm();
    document.getElementById('modal-title').textContent = 'Nuevo Proyecto';
    openModal('project-modal');
});

// Add Meta Field
btnAddMeta.addEventListener('click', () => {
    addMetaField('', '');
});

// Add Image URL
btnAddImageUrl.addEventListener('click', () => {
    addImageUrlField('');
});

// Accumulate selected image files
projectImagesInput.addEventListener('change', () => {
    const files = Array.from(projectImagesInput.files);
    for (const file of files) {
        pendingImageFiles.push(file);
        addFilePreview(file);
    }
    projectImagesInput.value = ''; // Reset input so same files can be re-selected
});

function addMetaField(label, value) {
    const row = document.createElement('div');
    row.className = 'dynamic-field-row';
    row.innerHTML = `
        <input type="text" placeholder="Etiqueta (ej: Cliente)" value="${escapeAttr(label)}">
        <input type="text" placeholder="Valor (ej: Farmacity S.A.)" value="${escapeAttr(value)}">
        <button type="button" class="btn-remove-field" title="Eliminar"><i class="fa-solid fa-xmark"></i></button>
    `;
    row.querySelector('.btn-remove-field').addEventListener('click', () => row.remove());
    metaFields.appendChild(row);
}

function addImageUrlField(url) {
    const row = document.createElement('div');
    row.className = 'dynamic-field-row';
    row.innerHTML = `
        <input type="url" placeholder="URL de la imagen" value="${escapeAttr(url)}">
        <button type="button" class="btn-remove-field" title="Eliminar"><i class="fa-solid fa-xmark"></i></button>
    `;
    row.querySelector('.btn-remove-field').addEventListener('click', () => row.remove());
    imageUrlsContainer.appendChild(row);
}

function resetProjectForm() {
    projectForm.reset();
    document.getElementById('project-id').value = '';
    document.getElementById('project-orden').value = '0';
    metaFields.innerHTML = '';
    imageUrlsContainer.innerHTML = '';
    projectImagesPreview.innerHTML = '';
    pendingImageFiles = [];
}

// Save Project
projectForm.addEventListener('submit', async e => {
    e.preventDefault();

    const id = document.getElementById('project-id').value;
    const titulo = document.getElementById('project-titulo').value.trim();
    const badge = document.getElementById('project-badge').value.trim();
    const orden = parseInt(document.getElementById('project-orden').value) || 0;
    const descripcion = document.getElementById('project-descripcion').value.trim();
    const specsRaw = document.getElementById('project-specs').value.trim();
    const specs = specsRaw ? specsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    // Gather meta
    const meta = [];
    metaFields.querySelectorAll('.dynamic-field-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        const label = inputs[0].value.trim();
        const value = inputs[1].value.trim();
        if (label && value) meta.push({ label, value });
    });

    // Gather image URLs
    const imagenes = [];
    imageUrlsContainer.querySelectorAll('.dynamic-field-row input').forEach(input => {
        const url = input.value.trim();
        if (url) imagenes.push(url);
    });

    // Upload accumulated files
    if (pendingImageFiles.length > 0) {
        for (const file of pendingImageFiles) {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const ref = storage.ref(`proyectos/${Date.now()}_${safeName}`);
            const snapshot = await ref.put(file);
            const url = await snapshot.ref.getDownloadURL();
            imagenes.push(url);
        }
    }

    const projectData = { titulo, badge, orden, descripcion, specs, meta, imagenes, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };

    try {
        if (id) {
            await db.collection('proyectos').doc(id).update(projectData);
            showToast('Proyecto actualizado correctamente');
        } else {
            projectData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('proyectos').add(projectData);
            showToast('Proyecto creado correctamente');
        }
        closeModal('project-modal');
        loadProjects();
    } catch (err) {
        showToast('Error al guardar el proyecto', 'error');
    }
});

// Load Projects
async function loadProjects() {
    projectsList.innerHTML = '<div class="loading">Cargando proyectos...</div>';

    try {
        const snapshot = await db.collection('proyectos').get();

        if (snapshot.empty) {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-folder-open"></i>
                    <p>No hay proyectos aún. Cree el primero.</p>
                </div>`;
            return;
        }

        // Sort locally to avoid index requirement
        const docs = [];
        snapshot.forEach(doc => docs.push({ id: doc.id, data: doc.data() }));
        docs.sort((a, b) => (a.data.orden || 0) - (b.data.orden || 0));

        projectsList.innerHTML = '';
        docs.forEach(({ id, data: p }) => {
            const card = document.createElement('div');
            card.className = 'project-card';

            const firstImage = (p.imagenes && p.imagenes.length > 0) ? p.imagenes[0] : '';

            card.innerHTML = `
                <div class="project-card-image">
                    ${firstImage
                        ? `<img src="${escapeAttr(firstImage)}" alt="${escapeAttr(p.titulo)}">`
                        : '<i class="fa-solid fa-image no-image"></i>'}
                </div>
                <div class="project-card-body">
                    <h4>${escapeHtml(p.titulo || 'Sin título')}</h4>
                    ${p.badge ? `<span class="card-badge">${escapeHtml(p.badge)}</span>` : ''}
                    <p>${escapeHtml((p.descripcion || '').substring(0, 150))}...</p>
                </div>
                <div class="project-card-actions">
                    <button class="btn-icon edit" title="Editar" data-id="${id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon delete" title="Eliminar" data-id="${id}"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            card.querySelector('.edit').addEventListener('click', () => editProject(id, p));
            card.querySelector('.delete').addEventListener('click', () => confirmDeleteProject(id));

            projectsList.appendChild(card);
        });
    } catch (err) {
        console.error('Error cargando proyectos:', err);
        projectsList.innerHTML = `<div class="empty-state"><p>Error al cargar proyectos: ${escapeHtml(err.message)}</p></div>`;
    }
}

// Edit Project
function editProject(id, p) {
    resetProjectForm();
    document.getElementById('modal-title').textContent = 'Editar Proyecto';
    document.getElementById('project-id').value = id;
    document.getElementById('project-titulo').value = p.titulo || '';
    document.getElementById('project-badge').value = p.badge || '';
    document.getElementById('project-orden').value = p.orden || 0;
    document.getElementById('project-descripcion').value = p.descripcion || '';
    document.getElementById('project-specs').value = (p.specs || []).join(', ');

    if (p.meta && Array.isArray(p.meta)) {
        p.meta.forEach(m => addMetaField(m.label, m.value));
    }

    if (p.imagenes && Array.isArray(p.imagenes)) {
        p.imagenes.forEach(url => {
            addImageUrlField(url);
            addImagePreview(url);
        });
    }

    openModal('project-modal');
}

function addImagePreview(url) {
    const item = document.createElement('div');
    item.className = 'preview-item';
    item.innerHTML = `
        <img src="${escapeAttr(url)}" alt="Preview">
        <button type="button" class="remove-preview" title="Quitar"><i class="fa-solid fa-xmark"></i></button>
    `;
    item.querySelector('.remove-preview').addEventListener('click', () => item.remove());
    projectImagesPreview.appendChild(item);
}

function addFilePreview(file) {
    const item = document.createElement('div');
    item.className = 'preview-item';
    const objectUrl = URL.createObjectURL(file);
    item.innerHTML = `
        <img src="${objectUrl}" alt="${escapeAttr(file.name)}">
        <span class="preview-name">${escapeHtml(file.name)}</span>
        <button type="button" class="remove-preview" title="Quitar"><i class="fa-solid fa-xmark"></i></button>
    `;
    item.querySelector('.remove-preview').addEventListener('click', () => {
        const idx = pendingImageFiles.indexOf(file);
        if (idx > -1) pendingImageFiles.splice(idx, 1);
        URL.revokeObjectURL(objectUrl);
        item.remove();
    });
    projectImagesPreview.appendChild(item);
}

// Delete Project
function confirmDeleteProject(id) {
    currentDeleteAction = async () => {
        try {
            await db.collection('proyectos').doc(id).delete();
            showToast('Proyecto eliminado');
            loadProjects();
        } catch {
            showToast('Error al eliminar', 'error');
        }
    };
    openModal('delete-modal');
}

document.getElementById('btn-confirm-delete').addEventListener('click', () => {
    if (currentDeleteAction) {
        currentDeleteAction();
        currentDeleteAction = null;
    }
    closeModal('delete-modal');
});

// === IMAGES ===
const imagesList = document.getElementById('images-list');
const btnUploadImage = document.getElementById('btn-upload-image');
const imageUploadInput = document.getElementById('image-upload-input');

// === SEED INITIAL PROJECTS ===
const btnSeedProjects = document.getElementById('btn-seed-projects');

btnSeedProjects.addEventListener('click', async () => {
    if (!confirm('¿Cargar los 3 proyectos iniciales en Firebase? Esto subirá las imágenes a Storage y creará los proyectos en Firestore. Esto NO eliminará proyectos existentes.')) return;

    btnSeedProjects.disabled = true;
    btnSeedProjects.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo imágenes y datos...';

    const seedProjects = [
        {
            titulo: 'CPF (Central Processing Facilities) - La Calera, Neuquén',
            badge: 'Cuenca Vaca Muerta',
            orden: 1,
            descripcion: 'Se realizaron tareas de campo y adecuaciones (desvíos - red lines) al proyecto ejecutivo original de redes y líneas de servicio. Las actividades fueron desarrolladas por un equipo técnico liderado por el Director Operacional in situ para TECHINT, con un total de 1120 horas-hombre de ingeniería aplicadas al proyecto.\n\nEl alcance de los trabajos comprendió la ingeniería y montaje de la Red Contra Incendio (RCI), incluyendo: sistemas hidráulicos húmedos y secos con espuma AFFF, sistemas de extinción por gas Novec 1230, sistemas Fire & Gas (F&G), sistemas de detección y alarma de incendios convencionales, incluyendo detección lineal Protectowire.',
            meta: [
                { label: 'Sub-contrato', value: 'Líder externo de Ingeniería de Campo' },
                { label: 'Cliente de Subcontrato', value: 'Prosegur S.A.' },
                { label: 'Contrato', value: 'TECHINT E&C' },
                { label: 'Operador', value: 'Pluspetrol S.A.' },
                { label: 'Especialidad', value: 'F&G (Fire and Gas) / RCI - FPS (Fire Protection Systems)' }
            ],
            specs: ['Norma NFPA', 'Ley Nacional 17319', 'Piping Class Pluspetrol', 'Piping Class Techint E&C', '+25 km de tuberías'],
            localImages: [
                '../images/4.1fire-gas.png',
                '../images/4.1aplicacion-norma-nfpa.png',
                '../images/4.1proteccion-tanques1.png',
                '../images/4.1proteccion-tanques2.png',
                '../images/4.1puestos-de-incendios.png',
                '../images/4.1distribucion-tuberias.png'
            ]
        },
        {
            titulo: 'Plant Side - Energía Sustentable Eólica - Plantas Gasíferas',
            badge: 'Tierra del Fuego',
            orden: 2,
            descripcion: 'El proyecto consistió en realizar una obra civil, una obra mecánica de piping, un sistema F&G, un sistema complementario de la RCI existente, dos bancos de 4 baterías con control satelital y una conectividad inter-plantas a través de una sala eléctrica inteligente con instalaciones de Transformador de 20 KVA a 6,6 KVA y Transformadores de servicios.\n\nTodo el proyecto se integra a un sistema de generación eólica y a un tendido interplanta de cable de potencia y fibra óptica de 24 km. El objetivo es la reducción de emisiones de gases asociadas a la generación eléctrica, estimándose una disminución de entre un 35% y un 40% cuando el sistema opera a plena carga.',
            meta: [
                { label: 'Prestación', value: 'Senior Facilities Manager - Ingeniero de Campo' },
                { label: 'Director de Operaciones', value: 'Ing. Edgardo Ibáñez' },
                { label: 'Duración', value: '13 meses - Régimen 21 x 7' },
                { label: 'Horas-Hombre', value: '106.000 hs/H' },
                { label: 'Grúas', value: '+200 hs con portes de 35 / 70 & 120 T' }
            ],
            specs: ['Sala eléctrica de 220 m²', '+45 T de hierros', '+450 m³ de H°A° H40', '24 km fibra óptica', 'Hibridización energética'],
            localImages: [
                '../images/4.2elproyecto-consistio-en.png',
                '../images/4.2160000hs.png',
                '../images/4.2logisticaymontajesalaelectrica1.png',
                '../images/4.2logisticaymontajesalaelectrica2.png',
                '../images/4.2masde45tdehierros.png'
            ]
        },
        {
            titulo: 'Obras de Retail',
            badge: 'Farmacity S.A.',
            orden: 3,
            descripcion: 'Servicios integrales de mantenimiento y remodelación para la cadena de locales Farmacity, abarcando fabricación de tabiques de durlock, pintura de fachadas e impermeabilización de terrazas en múltiples sucursales.',
            meta: [
                { label: 'Cliente', value: 'Farmacity S.A.' },
                { label: 'Prestación', value: 'Servicios de Mantenimiento y reforma en locales comerciales' }
            ],
            specs: [],
            localImages: [
                '../images/4.3local162.png',
                '../images/4.3local106.png',
                '../images/4.3local63.png'
            ]
        }
    ];

    try {
        let totalImages = seedProjects.reduce((sum, p) => sum + p.localImages.length, 0);
        let uploadedCount = 0;

        for (const project of seedProjects) {
            const imagenes = [];

            // Upload each local image to Firebase Storage
            for (const localPath of project.localImages) {
                try {
                    const response = await fetch(localPath);
                    if (!response.ok) throw new Error('No se pudo cargar ' + localPath);
                    const blob = await response.blob();

                    const fileName = localPath.split('/').pop();
                    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
                    const ref = storage.ref(`proyectos/${safeName}`);
                    const snapshot = await ref.put(blob);
                    const downloadURL = await snapshot.ref.getDownloadURL();
                    imagenes.push(downloadURL);

                    uploadedCount++;
                    btnSeedProjects.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Subiendo ${uploadedCount}/${totalImages}...`;
                } catch (imgErr) {
                    console.warn('Error subiendo imagen:', localPath, imgErr);
                }
            }

            // Save project to Firestore with Storage URLs
            const projectData = {
                titulo: project.titulo,
                badge: project.badge,
                orden: project.orden,
                descripcion: project.descripcion,
                meta: project.meta,
                specs: project.specs,
                imagenes: imagenes,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('proyectos').add(projectData);
        }

        showToast(`3 proyectos cargados con ${uploadedCount} imágenes subidas a Storage`);
        loadProjects();
    } catch (err) {
        showToast('Error al cargar proyectos: ' + err.message, 'error');
    }

    btnSeedProjects.disabled = false;
    btnSeedProjects.innerHTML = '<i class="fa-solid fa-database"></i> Cargar Datos Iniciales';
});

btnUploadImage.addEventListener('click', () => {
    imageUploadInput.click();
});

imageUploadInput.addEventListener('change', async () => {
    const files = imageUploadInput.files;
    if (files.length === 0) return;

    showToast('Subiendo imágenes...', 'info');

    for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const ref = storage.ref(`galeria/${Date.now()}_${safeName}`);
        try {
            const snapshot = await ref.put(file);
            const url = await snapshot.ref.getDownloadURL();
            await db.collection('imagenes').add({
                nombre: file.name,
                url: url,
                path: ref.fullPath,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch {
            showToast(`Error al subir ${file.name}`, 'error');
        }
    }

    showToast('Imágenes subidas correctamente');
    imageUploadInput.value = '';
    loadImages();
});

async function loadImages() {
    imagesList.innerHTML = '<div class="loading">Cargando imágenes</div>';

    try {
        const snapshot = await db.collection('imagenes').orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            imagesList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-images"></i>
                    <p>No hay imágenes subidas aún.</p>
                </div>`;
            return;
        }

        imagesList.innerHTML = '';
        snapshot.forEach(doc => {
            const img = doc.data();
            const card = document.createElement('div');
            card.className = 'image-card';
            card.innerHTML = `
                <img src="${escapeAttr(img.url)}" alt="${escapeAttr(img.nombre)}" loading="lazy">
                <div class="image-card-info" title="${escapeAttr(img.nombre)}">${escapeHtml(img.nombre)}</div>
                <div class="image-card-actions">
                    <button class="copy-url" title="Copiar URL"><i class="fa-solid fa-copy"></i></button>
                    <button class="delete-img" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            card.querySelector('.copy-url').addEventListener('click', () => {
                navigator.clipboard.writeText(img.url).then(() => {
                    showToast('URL copiada al portapapeles');
                });
            });

            card.querySelector('.delete-img').addEventListener('click', () => {
                currentDeleteAction = async () => {
                    try {
                        if (img.path) {
                            await storage.ref(img.path).delete();
                        }
                        await db.collection('imagenes').doc(doc.id).delete();
                        showToast('Imagen eliminada');
                        loadImages();
                    } catch {
                        showToast('Error al eliminar imagen', 'error');
                    }
                };
                openModal('delete-modal');
            });

            imagesList.appendChild(card);
        });
    } catch {
        imagesList.innerHTML = '<div class="empty-state"><p>Error al cargar imágenes.</p></div>';
    }
}

// === UTILITIES ===
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Initialize session AFTER all variables are declared
checkSession();
