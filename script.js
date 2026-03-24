document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('[data-nav]');

    if (navToggle && nav) {
        navToggle.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', String(isOpen));
            document.body.classList.toggle('menu-open', isOpen);
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('menu-open');
            });
        });
    }

    document.querySelectorAll('[data-current-year]').forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && reveals.length) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.18 });

        reveals.forEach(el => observer.observe(el));
    } else {
        reveals.forEach(el => el.classList.add('visible'));
    }

    document.querySelectorAll('[data-filter-group]').forEach(group => {
        const buttons = group.querySelectorAll('[data-filter]');
        const targetSelector = group.getAttribute('data-target');
        const items = document.querySelectorAll(targetSelector);

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.dataset.filter;
                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                items.forEach(item => {
                    const tags = item.dataset.category || '';
                    const matches = filter === 'all' || tags.split(' ').includes(filter);
                    item.classList.toggle('hidden', !matches);
                });
            });
        });
    });

    setupFaq();
    setupGalleryModal();
    setupVideoModal();
    setupLightbox();
    setupImageProtection();
});

function setupFaq() {
    document.querySelectorAll('.faq-item').forEach(item => {
        const button = item.querySelector('.faq-question');
        if (!button) return;

        button.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(other => {
                other.classList.remove('open');
                const otherBtn = other.querySelector('.faq-question');
                if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
            });

            if (!isOpen) {
                item.classList.add('open');
                button.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

function setupGalleryModal() {
    const modal = document.querySelector('[data-gallery-modal]');
    if (!modal) return;

    const image = modal.querySelector('[data-gallery-image]');
    const caption = modal.querySelector('[data-gallery-caption]');
    const closeBtn = modal.querySelector('[data-gallery-close]');
    const prevBtn = modal.querySelector('[data-gallery-prev]');
    const nextBtn = modal.querySelector('[data-gallery-next]');
    const items = () => Array.from(document.querySelectorAll('.gallery-item:not(.hidden) [data-gallery-trigger]'));
    let currentIndex = 0;

    const openModal = (index) => {
        const visibleItems = items();
        if (!visibleItems.length) return;
        currentIndex = index;
        const trigger = visibleItems[currentIndex];
        image.src = trigger.dataset.image;
        image.alt = trigger.dataset.alt || '';
        caption.textContent = trigger.dataset.caption || '';
        modal.classList.add('active');
        document.body.classList.add('menu-open');
    };

    document.querySelectorAll('[data-gallery-trigger]').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const visibleItems = items();
            const index = visibleItems.indexOf(trigger);
            openModal(index < 0 ? 0 : index);
        });
    });

    const closeModal = () => {
        modal.classList.remove('active');
        document.body.classList.remove('menu-open');
        image.src = '';
    };

    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', event => {
        if (event.target === modal) closeModal();
    });

    prevBtn?.addEventListener('click', () => {
        const visibleItems = items();
        if (!visibleItems.length) return;
        currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
        openModal(currentIndex);
    });

    nextBtn?.addEventListener('click', () => {
        const visibleItems = items();
        if (!visibleItems.length) return;
        currentIndex = (currentIndex + 1) % visibleItems.length;
        openModal(currentIndex);
    });

    document.addEventListener('keydown', event => {
        if (!modal.classList.contains('active')) return;
        if (event.key === 'Escape') closeModal();
        if (event.key === 'ArrowLeft') prevBtn?.click();
        if (event.key === 'ArrowRight') nextBtn?.click();
    });
}

function setupVideoModal() {
    const modal = document.querySelector('[data-video-modal]');
    if (!modal) return;

    const closeBtn = modal.querySelector('[data-video-close]');
    const title = modal.querySelector('[data-video-title]');
    const meta = modal.querySelector('[data-video-meta]');
    const playerWrap = modal.querySelector('[data-video-player]');

    const closeModal = () => {
        modal.classList.remove('active');
        playerWrap.innerHTML = '';
        title.textContent = '';
        meta.textContent = '';
        document.body.classList.remove('menu-open');
    };

    document.querySelectorAll('[data-video-trigger]').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const source = trigger.dataset.videoSource;
            const videoType = trigger.dataset.videoType;
            const videoTitle = trigger.dataset.videoTitle || 'Vidéo';
            const videoMeta = trigger.dataset.videoMeta || '';
            const poster = trigger.dataset.videoPoster || '';

            title.textContent = videoTitle;
            meta.textContent = videoMeta;
            playerWrap.innerHTML = '';

            if (!source) {
                const emptyState = document.createElement('div');
                emptyState.style.height = '100%';
                emptyState.style.display = 'grid';
                emptyState.style.placeItems = 'center';
                emptyState.style.padding = '2rem';
                emptyState.style.textAlign = 'center';
                emptyState.style.color = 'rgba(245,247,251,0.82)';
                emptyState.innerHTML = '<div><strong style="display:block;font-size:1.15rem;margin-bottom:0.6rem;color:#fff0de;">Vidéo à brancher</strong><span>Ajoute ton fichier vidéo local ou ton lien YouTube dans la carte correspondante pour la rendre lisible ici.</span></div>';
                playerWrap.appendChild(emptyState);
            } else if (videoType === 'youtube') {
                const iframe = document.createElement('iframe');
                iframe.src = source;
                iframe.title = videoTitle;
                iframe.loading = 'lazy';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
                iframe.allowFullscreen = true;
                playerWrap.appendChild(iframe);
            } else {
                const video = document.createElement('video');
                video.controls = true;
                video.preload = 'metadata';
                if (poster) video.poster = poster;

                const src = document.createElement('source');
                src.src = source;
                src.type = 'video/mp4';
                video.appendChild(src);
                playerWrap.appendChild(video);
            }

            modal.classList.add('active');
            document.body.classList.add('menu-open');
        });
    });

    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', event => {
        if (event.target === modal) closeModal();
    });

    document.addEventListener('keydown', event => {
        if (!modal.classList.contains('active')) return;
        if (event.key === 'Escape') closeModal();
    });
}


function setupLightbox(){
    const lb = document.getElementById('lightbox');
    if(!lb) return;

    const img = lb.querySelector('.lb-img');
    const closeBtn = lb.querySelector('.lb-close');
    const inner = lb.querySelector('.lb-inner');

    const open = (src, alt='') => {
        img.src = src;
        img.alt = alt || '';
        lb.classList.add('open');
        lb.setAttribute('aria-hidden','false');
        document.body.classList.add('menu-open');
    };

    const close = () => {
        lb.classList.remove('open');
        lb.setAttribute('aria-hidden','true');
        document.body.classList.remove('menu-open');
        // vider après transition
        img.src = '';
        img.alt = '';
    };

    // boutons / fond
    closeBtn?.addEventListener('click', close);
    lb.addEventListener('click', (e) => {
        // clic hors du bloc central => fermer
        if(e.target === lb) close();
    });

    // déclencheurs : boutons .js-lightbox OU images avec .js-lightbox
    document.querySelectorAll('.js-lightbox').forEach(el => {
        el.addEventListener('click', (e) => {
            // éviter double ouverture si nested
            e.preventDefault();
            const src = el.getAttribute('data-src') || (el.tagName === 'IMG' ? el.getAttribute('src') : null);
            const alt = el.getAttribute('data-alt') || el.getAttribute('alt') || '';
            if(src) open(src, alt);
        });
    });

    document.addEventListener('keydown', (e) => {
        if(!lb.classList.contains('open')) return;
        if(e.key === 'Escape') close();
    });

    // empêcher clic droit dans la lightbox
    inner?.addEventListener('contextmenu', (e) => e.preventDefault());
}

function setupImageProtection(){
    // Dissuasion : bloque clic droit + drag sur les images marquées .protect
    const imgs = document.querySelectorAll('img.protect');
    imgs.forEach(img => {
        img.setAttribute('draggable','false');
        img.addEventListener('dragstart', e => e.preventDefault());
        img.addEventListener('contextmenu', e => e.preventDefault());
    });

    // option : bloque clic droit global sur les sections photos (sans casser le reste)
    document.querySelectorAll('.preview, .hero-image-wrapper, .gallery-grid, [data-gallery-modal]').forEach(zone => {
        zone.addEventListener('contextmenu', e => {
            // si on est sur une image, on bloque
            if(e.target && (e.target.tagName === 'IMG' || e.target.closest('img'))) e.preventDefault();
        });
    });
}
