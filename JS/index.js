// Funcionalidad del menú hamburguesa
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
});

// Cerrar menú al hacer clic en un enlace
document.querySelectorAll(".nav-link").forEach((n) =>
    n.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
    })
);

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

// Carousel Js Glider

window.addEventListener("load", function () {
	new Glider(document.querySelector(".carousel__lista"), {
		slidesToShow: 1,
		slidesToScroll: 1,
		dots: ".carousel__indicadores",
		arrows: {
			prev: ".carousel__anterior",
			next: ".carousel__siguiente",
		},
		responsive: [
			{
				// screens greater than >= 775px
				breakpoint: 450,
				settings: {
					// Set to `auto` and provide item width to adjust to viewport
					slidesToShow: 2,
					slidesToScroll: 2,
				},
			},
			{
				// screens greater than >= 1024px
				breakpoint: 800,
				settings: {
					slidesToShow: 4,
					slidesToScroll: 4,
				},
			},
		],
	});
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
        sendBtn.textContent = 'Send Message'; });
});




