// ============================================
// IDV_WEB - Professional Interactions
// Iglesia del Dios Viviente
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    // ----- THEME TOGGLE -----
    const html = document.documentElement;
    const themeBtn = document.getElementById('fabTheme');
    const savedTheme = localStorage.getItem('idv-theme');

    if (savedTheme === 'light') {
        html.classList.add('light-mode');
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            html.classList.toggle('light-mode');
            const isLight = html.classList.contains('light-mode');
            localStorage.setItem('idv-theme', isLight ? 'light' : 'dark');
        });
    }

    // ----- WHATSAPP FLOATING BUTTON -----
    const fabWhatsapp = document.getElementById('fabWhatsapp');
    if (fabWhatsapp) {
        fabWhatsapp.addEventListener('click', () => {
            window.open('https://wa.me/50589952187?text=Hola%20Dios%20les%20bendiga!', '_blank');
        });
    }

    // ----- NAV CONTACT BUTTON -> WHATSAPP -----
    const navContactBtn = document.getElementById('navContactBtn');
    if (navContactBtn) {
        navContactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('https://wa.me/50589952187?text=Hola%20Dios%20les%20bendiga!', '_blank');
        });
    }

    // ----- FOOTER CONTACT LINK -> WHATSAPP -----
    document.querySelectorAll('.footer-contact-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('https://wa.me/50589952187?text=Hola%20Dios%20les%20bendiga!', '_blank');
        });
    });

    // ----- NAVBAR: Hamburger Menu -----
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // ----- NAVBAR: Scroll Effect -----
    const navbar = document.querySelector('.navbar');
    const navHeight = navbar.offsetHeight;

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > navHeight * 0.5) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    });

    // ----- SMOOTH SCROLL -----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ----- HERO SCROLL INDICATOR HIDE -----
    const scrollIndicator = document.querySelector('.hero-scroll-indicator');
    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > window.innerHeight * 0.3) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.pointerEvents = 'none';
            } else {
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.pointerEvents = 'auto';
            }
        }, { passive: true });
    }

    // ----- FLOATING COUNTDOWN TIMER (51 ANIVERSARIO: Sep 14, 2026) -----
    const fechaEvento = new Date('Sep 14, 2026 18:00:00').getTime();
    const diasEl = document.getElementById('dias');
    const horasEl = document.getElementById('horas');
    const minutosEl = document.getElementById('minutos');
    const segundosEl = document.getElementById('segundos');
    const floatingCounter = document.getElementById('floatingCounter');

    const modalDiasEl = document.getElementById('modal-dias');
    const modalHorasEl = document.getElementById('modal-horas');
    const modalMinutosEl = document.getElementById('modal-minutos');
    const modalSegundosEl = document.getElementById('modal-segundos');

    if (diasEl && horasEl && minutosEl && segundosEl) {
        const timer = setInterval(() => {
            const ahora = new Date().getTime();
            const distancia = fechaEvento - ahora;

            if (distancia < 0) {
                clearInterval(timer);
                if (floatingCounter) {
                    floatingCounter.querySelector('.fc-inner').innerHTML = `
                        <span class="fc-label" style="font-size:1rem;color:var(--gold)">¡El aniversario ha comenzado!</span>
                    `;
                }
                return;
            }

            const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
            const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
            const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

            const val = String(dias).padStart(2, '0');
            diasEl.textContent = val;
            if (modalDiasEl) modalDiasEl.textContent = val;

            const valH = String(horas).padStart(2, '0');
            horasEl.textContent = valH;
            if (modalHorasEl) modalHorasEl.textContent = valH;

            const valM = String(minutos).padStart(2, '0');
            minutosEl.textContent = valM;
            if (modalMinutosEl) modalMinutosEl.textContent = valM;

            const valS = String(segundos).padStart(2, '0');
            segundosEl.textContent = valS;
            if (modalSegundosEl) modalSegundosEl.textContent = valS;
        }, 1000);

        // Hide floating counter when scrolled to footer
        const footer = document.querySelector('.footer');
        if (footer && floatingCounter) {
            window.addEventListener('scroll', () => {
                const footerTop = footer.getBoundingClientRect().top;
                if (footerTop < window.innerHeight + 100) {
                    floatingCounter.classList.add('collapsed');
                } else {
                    floatingCounter.classList.remove('collapsed');
                }
            }, { passive: true });
        }
    }

    // ----- COUNTER MODAL (click to open/close) -----
    const counterModal = document.getElementById('counterModal');
    const counterModalClose = document.getElementById('counterModalClose');

    if (floatingCounter && counterModal) {
        floatingCounter.style.cursor = 'pointer';
        floatingCounter.addEventListener('click', () => {
            counterModal.classList.add('open');
        });
    }

    if (counterModalClose && counterModal) {
        counterModalClose.addEventListener('click', () => {
            counterModal.classList.remove('open');
        });
        counterModal.addEventListener('click', (e) => {
            if (e.target === counterModal) counterModal.classList.remove('open');
        });
    }

    // ----- MINISTERIOS CAROUSEL (con touch swipe) -----
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    const indicatorsContainer = document.querySelector('.indicators');
    const carousel = document.querySelector('.carousel');

    if (slides.length && prevBtn && nextBtn && indicatorsContainer) {
        let index = 0;
        let autoPlayInterval;
        let touchStartX = 0;
        let touchEndX = 0;

        slides.forEach((_, i) => {
            const btn = document.createElement('button');
            btn.setAttribute('aria-label', `Ir al slide ${i + 1}`);
            if (i === 0) btn.classList.add('active');
            btn.addEventListener('click', () => goToSlide(i));
            indicatorsContainer.appendChild(btn);
        });

        const indicators = indicatorsContainer.querySelectorAll('button');

        function updateSlides() {
            slides.forEach((slide, i) => {
                slide.classList.remove('active', 'left', 'right');
                if (i === index) {
                    slide.classList.add('active');
                } else if (i === (index - 1 + slides.length) % slides.length) {
                    slide.classList.add('left');
                } else if (i === (index + 1) % slides.length) {
                    slide.classList.add('right');
                }
            });
            indicators.forEach((btn, i) => btn.classList.toggle('active', i === index));
        }

        function goToSlide(i) {
            index = i;
            updateSlides();
            resetAutoPlay();
        }

        function nextSlide() {
            index = (index + 1) % slides.length;
            updateSlides();
        }

        function prevSlideFunc() {
            index = (index - 1 + slides.length) % slides.length;
            updateSlides();
        }

        prevBtn.addEventListener('click', prevSlideFunc);
        nextBtn.addEventListener('click', nextSlide);

        // Touch swipe support
        if (carousel) {
            carousel.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            carousel.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const diff = touchStartX - touchEndX;
                if (Math.abs(diff) > 50) {
                    if (diff > 0) nextSlide();
                    else prevSlideFunc();
                    resetAutoPlay();
                }
            }, { passive: true });
        }

        function startAutoPlay() {
            autoPlayInterval = setInterval(nextSlide, 7000);
        }

        function resetAutoPlay() {
            clearInterval(autoPlayInterval);
            startAutoPlay();
        }

        updateSlides();
        startAutoPlay();

        // Pause autoplay on hover/touch
        const carouselWrapper = document.querySelector('.carousel-wrapper');
        if (carouselWrapper) {
            carouselWrapper.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
            carouselWrapper.addEventListener('mouseleave', startAutoPlay);
            carouselWrapper.addEventListener('touchstart', () => clearInterval(autoPlayInterval), { passive: true });
            carouselWrapper.addEventListener('touchend', startAutoPlay, { passive: true });
        }
    }

    // ----- VIDEO PLAYBACK -----
    const video = document.querySelector('.background-video');
    if (video) {
        video.play().catch(() => {
            // Autoplay not supported, add play button?
        });
    }

    // ----- CONTACT FORM (EmailJS) -----
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const sendBtn = this.querySelector('.send-btn');
            const originalText = sendBtn.innerHTML;
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            emailjs.sendForm('service_6qmzkop', 'template_oljtbxh', this)
                .then(() => {
                    showToast('¡Mensaje enviado con éxito!', 'success');
                    this.reset();
                })
                .catch((error) => {
                    console.error('EmailJS Error:', error);
                    showToast('Hubo un error al enviar el mensaje. Intenta nuevamente.', 'error');
                })
                .finally(() => {
                    sendBtn.disabled = false;
                    sendBtn.innerHTML = originalText;
                });
        });
    }

    // ----- TOAST NOTIFICATION -----
    function showToast(message, type = 'success') {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="toast-icon">${type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>'}</div>
            <span>${message}</span>
        `;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
            font-weight: 500;
            z-index: 9999;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: 400px;
        `;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    // ----- INTERSECTION OBSERVER FOR HERO ELEMENTS -----
    const heroElements = document.querySelectorAll('.hero-title, .hero-btn, .hero-photo, .church-seal, .hero-subtitle');
    if (heroElements.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        heroElements.forEach((el) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

});