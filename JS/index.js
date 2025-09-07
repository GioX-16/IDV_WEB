const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Opcional: cerrar menú al hacer clic en un enlace
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});


// Animación suave para el scroll
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    });
});

// Efecto de aparición al hacer scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
        }
    });
}, observerOptions);

// Aplicar animación a elementos del hero
document.addEventListener("DOMContentLoaded", () => {
    const heroElements = document.querySelectorAll(
        ".hero-title, .hero-btn, .hero-photo, .church-logo"
    );

    heroElements.forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";
        el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        observer.observe(el);
    });
});

// Efecto hover en el botón del hero
const heroBtn = document.querySelector(".hero-btn");
if (heroBtn) {
    heroBtn.addEventListener("mouseenter", () => {
        heroBtn.style.transform = "translateY(-2px) scale(1.05)";
    });

    heroBtn.addEventListener("mouseleave", () => {
        heroBtn.style.transform = "translateY(0) scale(1)";
    });
}

// Navbar con efecto de transparencia al hacer scroll
window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 100) {
        navbar.style.background = "rgba(255, 255, 255, 0.98)";
        navbar.style.boxShadow = "0 2px 20px rgba(0, 0, 0, 0.1)";
    } else {
        navbar.style.background = "rgba(255, 255, 255, 0.95)";
        navbar.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
    }
});

// MINISTERIOS SECTION

const slides = document.querySelectorAll('.slide');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
const indicatorsContainer = document.querySelector('.indicators');

let index = 0;
let autoPlayInterval;

// Crear indicadores
slides.forEach((_, i) => {
    const btn = document.createElement('button');
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

    indicators.forEach(btn => btn.classList.remove('active'));
    indicators[index].classList.add('active');
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

// AutoPlay
function startAutoPlay() {
    autoPlayInterval = setInterval(nextSlide, 10000);
}

function resetAutoPlay() {
    clearInterval(autoPlayInterval);
    startAutoPlay();
}

updateSlides();
startAutoPlay();

/* Video Section - Mobile Compatibility */

document.addEventListener('DOMContentLoaded', function() {
    const video = document.querySelector('.background-video');
    const videoSection = document.querySelector('.video-section');
    const fallback = document.querySelector('.video-fallback');
    
    if (video) {
        let videoFailed = false;
        let fallbackTimeout;

        // Función para activar el fallback
        function activateFallback() {
            if (!videoFailed) {
                videoFailed = true;
                videoSection.classList.add('video-fallback-active');
                console.log('Activando imagen de respaldo para el video');
            }
        }

        // Detectar si el video no se puede cargar
        video.addEventListener('error', function() {
            console.log('Error al cargar el video, activando fallback');
            activateFallback();
        });

        // Timeout para activar fallback si el video no se carga en 5 segundos
        fallbackTimeout = setTimeout(function() {
            if (video.readyState < 2) { // HAVE_CURRENT_DATA
                console.log('Video no se cargó a tiempo, activando fallback');
                activateFallback();
            }
        }, 5000);

        // Forzar la reproducción en móviles
        video.addEventListener('loadeddata', function() {
            clearTimeout(fallbackTimeout);
            video.play().catch(function(error) {
                console.log('Error al reproducir video automáticamente:', error);
                // Si falla la reproducción automática, intentar con interacción del usuario
                document.addEventListener('touchstart', function() {
                    video.play().catch(function(err) {
                        console.log('Error al reproducir video:', err);
                        activateFallback();
                    });
                }, { once: true });
            });
        });

        // Manejar cambios de visibilidad de la página
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                video.pause();
            } else if (!videoFailed) {
                video.play().catch(function(error) {
                    console.log('Error al reanudar video:', error);
                    activateFallback();
                });
            }
        });

        // Asegurar que el video se reproduzca cuando sea visible
        const videoObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting && !videoFailed) {
                    video.play().catch(function(error) {
                        console.log('Error al reproducir video en viewport:', error);
                        activateFallback();
                    });
                } else if (!videoFailed) {
                    video.pause();
                }
            });
        }, { threshold: 0.5 });

        videoObserver.observe(video);

        // Detectar si el video se puede reproducir después de la carga
        video.addEventListener('canplay', function() {
            clearTimeout(fallbackTimeout);
        });
    }
});

/* Contact Section */

document.getElementById('contactForm').addEventListener('submit', function (e) {
    e.preventDefault();
    alert('¡Mensaje enviado exitosamente!');
    this.reset();
});

document.getElementById('contactForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const form = this;
    const sendBtn = form.querySelector('.send-btn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Enviando...';

    emailjs.sendForm('service_6qmzkop', 'template_oljtbxh', form)
        .then(() => {
            alert('¡Mensaje enviado con éxito!');
            form.reset();
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send Message';
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Hubo un error al enviar el mensaje. Intenta nuevamente.');
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send Message';
        });
});




