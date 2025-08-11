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
    autoPlayInterval = setInterval(nextSlide, 4000);
}

function resetAutoPlay() {
    clearInterval(autoPlayInterval);
    startAutoPlay();
}

updateSlides();
startAutoPlay();

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




