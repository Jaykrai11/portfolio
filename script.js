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
    const pdfjsCdn = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    const pdfjsWorkerCdn = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    let pdfJsPromise = null;

    function isMobileCertificateView() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    function loadPdfJs() {
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerCdn;
            return Promise.resolve(window.pdfjsLib);
        }

        if (!pdfJsPromise) {
            pdfJsPromise = new Promise((resolve, reject) => {
                const existingScript = document.querySelector('script[data-pdfjs="true"]');
                if (existingScript && window.pdfjsLib) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerCdn;
                    resolve(window.pdfjsLib);
                    return;
                }

                const script = document.createElement('script');
                script.src = pdfjsCdn;
                script.async = true;
                script.dataset.pdfjs = 'true';
                script.onload = () => {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerCdn;
                    resolve(window.pdfjsLib);
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        return pdfJsPromise;
    }

    async function renderPdfPreview(src, canvas, targetWidth, targetHeight, mode = 'contain') {
        const pdfjsLib = await loadPdfJs();
        const loadingTask = pdfjsLib.getDocument({ url: src });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const baseViewport = page.getViewport({ scale: 1 });
        const fitScale = mode === 'cover'
            ? Math.max(targetWidth / baseViewport.width, targetHeight / baseViewport.height)
            : Math.min(targetWidth / baseViewport.width, targetHeight / baseViewport.height);
        const scale = Math.max(fitScale, 0.1);
        const viewport = page.getViewport({ scale });

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const context = canvas.getContext('2d');
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        await page.render({
            canvasContext: context,
            viewport,
        }).promise;
    }

    function buildCertificatePreview(card) {
        const src = card.getAttribute('data-src') || '';
        const wrapper = document.createElement('div');
        wrapper.className = 'cert-mobile-preview';
        const canvas = document.createElement('canvas');
        canvas.className = 'cert-mobile-canvas';
        canvas.dataset.src = src;
        wrapper.appendChild(canvas);
        return wrapper;
    }

    function scheduleMobilePreviewRender(card, previewWrapper) {
        const canvas = previewWrapper.querySelector('canvas');
        if (!canvas) return;

        const src = card.getAttribute('data-src') || canvas.dataset.src || '';
        const mediaBox = card.firstElementChild;
        if (!mediaBox) return;

        const width = Math.max(mediaBox.clientWidth - 2, 280);
        const height = Math.max(mediaBox.clientHeight - 2, 180);

        renderPdfPreview(src, canvas, width, height, 'cover').catch(() => {
            previewWrapper.classList.add('cert-mobile-preview-error');
        });
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
                        const previewWrapper = buildCertificatePreview(card);
                        cardMedia.appendChild(previewWrapper);
                        requestAnimationFrame(() => scheduleMobilePreviewRender(card, previewWrapper));
                    }
                } else {
                    requestAnimationFrame(() => scheduleMobilePreviewRender(card, existingFallback));
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
            const wrapper = document.createElement('div');
            wrapper.className = 'cert-modal-preview';
            const canvas = document.createElement('canvas');
            canvas.className = 'cert-modal-canvas';
            wrapper.appendChild(canvas);
            certModalBody.appendChild(wrapper);

            requestAnimationFrame(() => {
                const width = Math.max(certModalBody.clientWidth - 2, 320);
                const height = Math.max(certModalBody.clientHeight - 2, 420);
                renderPdfPreview(src, canvas, width, height, 'contain').catch(() => {
                    wrapper.classList.add('cert-modal-preview-error');
                });
            });
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
