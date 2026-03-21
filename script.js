document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       Dark/Light Theme Toggle
       ========================================== */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('ion-icon');
    const htmlElement = document.documentElement;

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateIcon(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        let currentTheme = htmlElement.getAttribute('data-theme');
        let newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);
    });

    function updateIcon(theme) {
        if (theme === 'dark') {
            themeIcon.setAttribute('name', 'sunny-outline');
        } else {
            themeIcon.setAttribute('name', 'moon-outline');
        }
    }

    /* ==========================================
       Sticky Navbar Effect
       ========================================== */
    const header = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    /* ==========================================
       Mobile Hamburger Menu
       ========================================== */
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close menu when a link is clicked
    document.querySelectorAll('.nav-links li a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    /* ==========================================
       Certificate Popup Modal
       ========================================== */
    const certModal = document.getElementById('cert-modal');
    const certModalTitle = document.getElementById('cert-modal-title');
    const certModalBody = document.getElementById('cert-modal-body');
    const certModalClose = document.getElementById('cert-modal-close');
    const certificateCards = document.querySelectorAll('.cert-card');

    function isMobileCertificateView() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    function getCertificateLink(card) {
        return card.getAttribute('data-src') || '';
    }

    function buildCertificateFallback(card) {
        const title = card.getAttribute('data-title') || 'Certificate';
        const src = getCertificateLink(card);
        const wrapper = document.createElement('div');
        wrapper.className = 'cert-mobile-preview';
        wrapper.innerHTML = `
            <div class="cert-mobile-icon">
                <ion-icon name="document-text-outline"></ion-icon>
            </div>
            <div class="cert-mobile-text">${title}</div>
            <a class="cert-mobile-open" href="${src}" target="_blank" rel="noopener noreferrer">Open</a>
        `;
        return wrapper;
    }

    function syncCertificateCardPreviews() {
        certificateCards.forEach(card => {
            const preview = card.querySelector('.cert-preview');
            const existingFallback = card.querySelector('.cert-mobile-preview');
            const cardMedia = card.firstElementChild;

            if (isMobileCertificateView()) {
                if (preview) {
                    card.setAttribute('data-preview-src', preview.getAttribute('src') || '');
                    preview.remove();
                }
                if (!existingFallback) {
                    if (cardMedia) {
                        cardMedia.appendChild(buildCertificateFallback(card));
                    }
                }
            } else {
                if (existingFallback) existingFallback.remove();

                if (!preview && cardMedia) {
                    const previewSrc = card.getAttribute('data-preview-src');
                    if (previewSrc) {
                        const restoredPreview = document.createElement('iframe');
                        restoredPreview.className = 'cert-preview';
                        restoredPreview.src = previewSrc;
                        restoredPreview.setAttribute('frameborder', '0');
                        restoredPreview.setAttribute('scrolling', 'no');
                        cardMedia.appendChild(restoredPreview);
                    }
                }
            }
        });
    }

    function openModal(src, title, type = 'pdf') {
        certModalTitle.textContent = title || 'Document';
        certModalBody.innerHTML = '';

        if (type === 'img') {
            const img = document.createElement('img');
            img.src = src;
            img.alt = title;
            certModalBody.appendChild(img);
        } else if (isMobileCertificateView()) {
            const fallback = document.createElement('div');
            fallback.className = 'cert-modal-fallback';
            fallback.innerHTML = `
                <ion-icon name="document-text-outline"></ion-icon>
                <p>PDF preview is limited on smaller screens.</p>
                <a class="cert-modal-open" href="${src}" target="_blank" rel="noopener noreferrer">Open Certificate</a>
            `;
            certModalBody.appendChild(fallback);
        } else {
            const frame = document.createElement('iframe');
            frame.src = src;
            frame.setAttribute('frameborder', '0');
            certModalBody.appendChild(frame);
        }

        certModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Modal behavior for Resume button
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            openModal(resumeBtn.getAttribute('data-src'), resumeBtn.getAttribute('data-title'), 'pdf');
        });
    }

    // Modal behavior for Cert cards
    document.querySelectorAll('.cert-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            openModal(card.getAttribute('data-src'), card.getAttribute('data-title'), card.getAttribute('data-type'));
        });
    });

    syncCertificateCardPreviews();
    window.addEventListener('resize', () => {
        syncCertificateCardPreviews();
    });

    function closeCertModal() {
        certModal.classList.remove('active');
        certModalBody.innerHTML = ''; 
        document.body.style.overflow = '';
    }

    certModalClose.addEventListener('click', closeCertModal);

    certModal.addEventListener('click', (e) => {
        if (e.target === certModal) closeCertModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeCertModal();
    });

    /* ==========================================
       Smooth Scrolling for Anchor Links
       ========================================== */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Ignore if it's just "#"
            if(this.getAttribute('href') !== '#') {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if(targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Adjust for sticky header
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    /* ==========================================
       Projects View More Logic
       ========================================== */
    const viewMoreBtn = document.getElementById('view-more-btn');
    const moreProjectsGrid = document.getElementById('more-projects-grid');

    if (viewMoreBtn && moreProjectsGrid) {
        viewMoreBtn.addEventListener('click', () => {
            if (moreProjectsGrid.style.display === 'none') {
                moreProjectsGrid.style.display = 'grid';
                viewMoreBtn.innerHTML = 'Show Less Projects <ion-icon name="chevron-up-outline" style="margin-left: 0.5rem;"></ion-icon>';
                
                // Optional: Smooth scroll slightly to show new expanded projects
                setTimeout(() => {
                    const y = moreProjectsGrid.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({top: y, behavior: 'smooth'});
                }, 50);
            } else {
                moreProjectsGrid.style.display = 'none';
                viewMoreBtn.innerHTML = 'View More Projects <ion-icon name="chevron-down-outline" style="margin-left: 0.5rem;"></ion-icon>';
            }
        });
    }

    /* ==========================================
       Certificates View More Logic
       ========================================== */
    const viewMoreCertsBtn = document.getElementById('view-more-certs-btn');
    const moreCertsGrid = document.getElementById('more-certs-grid');

    if (viewMoreCertsBtn && moreCertsGrid) {
        viewMoreCertsBtn.addEventListener('click', () => {
            if (moreCertsGrid.style.display === 'none') {
                moreCertsGrid.style.display = 'grid';
                viewMoreCertsBtn.innerHTML = 'Show Less <ion-icon name="chevron-up-outline" style="margin-left: 0.5rem;"></ion-icon>';
                setTimeout(() => {
                    const y = moreCertsGrid.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({top: y, behavior: 'smooth'});
                }, 50);
            } else {
                moreCertsGrid.style.display = 'none';
                viewMoreCertsBtn.innerHTML = 'View More Certificates <ion-icon name="chevron-down-outline" style="margin-left: 0.5rem;"></ion-icon>';
            }
        });
    }
});
