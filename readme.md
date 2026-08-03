<img width="1600" height="889" alt="IDV" src="https://github.com/user-attachments/assets/c9024f57-998b-4214-9684-a01cc76067fb" />

# Iglesia del Dios Viviente (IDV) — Sitio Web

Sitio web oficial de la **Iglesia del Dios Viviente**, una comunidad cristiana menonita en Managua, Nicaragua. El proyecto está pensado para **compartir la vida de la congregación**, difundir las actividades de la iglesia, mostrar los servicios y horarios, y brindar a los hermanos la **programación semanal** de labores y roles asignados.

---

## ✨ Características

### 🌐 Sitio Público (`index.html`)
- **Diseño 100% responsivo** con enfoque *mobile-first* y soporte de modo claro/oscuro.
- **Secciones principales:**
  - Hero con eslogan y contador del aniversario.
  - Congregación, creencias y video institucional.
  - **Actividades** con sistema de pestañas:
    - *Actividades de la Iglesia* — tabla con los eventos guardados desde el panel admin.
    - *Programación de la Iglesia* — imagen semanal subida por el admin para que los hermanos vean sus labores.
  - Ministerios (carrusel), días de servicio, escuela dominical, células, pastores y ubicación.
- Navegación superior + **barra inferior fija en móvil** con detección de sección activa.
- Botones flotantes: WhatsApp directo y cambio de tema.

### 🔐 Panel de Administración (`admin/`)
- Login simulado con roles (**Administrador**, **Pastor**, **Editor**).
- **Dashboard** con estadísticas resumidas.
- **Actividades**: CRUD completo (crear, editar, eliminar, buscar) de los eventos de la iglesia.
- **Programación Semanal**: subir la imagen que se publica en la sección de Actividades del sitio.
- **Usuarios**: gestión simulada de cuentas.
- Interfaz con sidebar colapsable, modales, toasts y paginación.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | HTML5, CSS3 (variables, Grid/Flexbox, animaciones) |
| **JavaScript** | Vanilla JS (ES6+) — sin frameworks |
| **Persistencia** | `localStorage` (simulación de base de datos) |
| **Librerías CDN** | AOS (animaciones), Font Awesome (iconos), Google Fonts (Playfair Display + Inter) |
| **Imágenes/Media** | SVG optimizado + vídeo institucional |
| **Deploy** | Vercel (config: `vercel.json`) |

> **Nota de arquitectura:** el proyecto corre **100% en el navegador** sin servidor propio. Los datos (actividades, programación, usuarios) se guardan en `localStorage`, por lo que la persistencia es local al dispositivo. Está preparado para migrar a una API/backend real en una siguiente fase.

---

## 📁 Estructura del Proyecto

```
IDV_WEB/
├── index.html              # Sitio público
├── vercel.json             # Configuración de despliegue (Vercel)
├── styles/
│   └── style.css           # Estilos del sitio público
├── js/
│   ├── index.js            # Interacciones generales del sitio
│   └── actividades.js      # Pestañas, tabla de actividades y programación semanal
├── admin/                  # Panel de administración
│   ├── login.html          # Inicio de sesión
│   ├── dashboard.html      # Estadísticas
│   ├── actividades.html    # CRUD de actividades
│   ├── programacion.html   # Subida de imagen semanal
│   ├── usuarios.html       # Gestión de usuarios
│   ├── css/admin.css       # Estilos del panel
│   └── js/                 # Lógica del panel (auth, common, etc.)
├── img/                    # Imágenes y recursos SVG
└── videos/                 # Vídeos institucionales
```

---

## 🚀 Cómo Ejecutarlo Localmente

El proyecto es estático: **no requiere instalación de dependencias ni build**.

```bash
# Opción 1: abrir directamente
#   Simplemente abre index.html en tu navegador.

# Opción 2: servidor local (recomendado para desarrollo)
npx serve .
# Luego visita http://localhost:3000
```

---

## 🔑 Credenciales de Demostración (Admin)

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@idv.org.ni` | `admin123` |
| Pastor | `pastor@idv.org.ni` | `pastor123` |
| Editor | `editor@idv.org.ni` | `editor123` |

> ⚠️ Solo para fines de demostración. El login es simulado (front-end puro).

---

## ☁️ Despliegue

El sitio está configurado para **Vercel**:

```bash
vercel          # Despliegue en ambiente de prueba
vercel --prod   # Despliegue a producción
```

`vercel.json` incluye URLs limpias, cabeceras de seguridad (nosniff, X-Frame-Options) y cacheo inmutable para los recursos estáticos (`/img`, `/videos`, `/styles`, `/js`).

---

## 🔭 Roadmap Sugerido

- [ ] Migrar `localStorage` a un backend real (API REST + base de datos).
- [ ] Autenticación real con sesiones y permisos por rol.
- [ ] Subida de imágenes al servidor en lugar de datos en base64.
- [ ] Notificaciones a los hermanos (WhatsApp / correo) al actualizar la programación semanal.

---

## 📄 Licencia

Uso interno de la Iglesia del Dios Viviente. Todos los derechos reservados.
