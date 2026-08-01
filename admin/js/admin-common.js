/* ============================================================
   admin-common.js — Utilidades compartidas del Panel Admin
   ============================================================ */

const APP = window.APP || {};

/* ---------- CONFIG ---------- */
APP.config = {
  siteName: 'IDV Admin',
  logoPath: '../img/logoidv.svg',
  defaultPageSize: 6,
};

/* ---------- SIMULATED CURRENT USER ---------- */
APP.user = null;

(function initApp() {
  const stored = localStorage.getItem('idv_admin_user');
  if (stored) {
    try { APP.user = JSON.parse(stored); } catch (e) { /* ignorar */ }
  }
})();

/* ============================================================
   SIDEBAR
   ============================================================ */
APP.initSidebar = function () {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  const toggleBtn = document.querySelector('.sidebar-toggle');
  const menuTrigger = document.querySelector('.menu-trigger');
  const mainContent = document.querySelector('.main-content');

  if (!sidebar || !mainContent) return;

  const saved = localStorage.getItem('idv_sidebar_collapsed');
  if (saved === 'true') {
    sidebar.classList.add('collapsed');
    mainContent.classList.add('expanded');
  }

  const collapse = () => {
    sidebar.classList.add('collapsed');
    mainContent.classList.add('expanded');
    localStorage.setItem('idv_sidebar_collapsed', 'true');
  };

  const expand = () => {
    sidebar.classList.remove('collapsed');
    mainContent.classList.remove('expanded');
    localStorage.setItem('idv_sidebar_collapsed', 'false');
  };

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.contains('collapsed') ? expand() : collapse();
    });
  }

  if (menuTrigger && overlay) {
    menuTrigger.addEventListener('click', () => {
      sidebar.classList.add('mobile-open');
      overlay.classList.add('show');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('show');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
      sidebar.classList.remove('mobile-open');
      if (overlay) overlay.classList.remove('show');
    }
  });
};

/* ============================================================
   SET ACTIVE NAV ITEM
   ============================================================ */
APP.setActiveNav = function (page) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
};

/* ============================================================
   LOGOUT
   ============================================================ */
APP.setupLogout = function () {
  const logoutBtns = document.querySelectorAll('.nav-logout, #logoutBtn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.removeItem('idv_admin_user');
      window.location.href = 'login.html';
    });
  });
};

/* ============================================================
   MODAL
   ============================================================ */
APP.openModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) firstInput.focus();
  }, 150);
};

APP.closeModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('show');
  document.body.style.overflow = '';
};

APP.setupModalClose = function (modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.querySelectorAll('.modal-close, .btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => APP.closeModal(modalId));
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) APP.closeModal(modalId);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      APP.closeModal(modalId);
    }
  });
};

/* ============================================================
   TOAST
   ============================================================ */
APP.showToast = function (message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info',
  };

  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
};

/* ============================================================
   FORMATTERS
   ============================================================ */
APP.formatDate = function (dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-NI', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

APP.formatTime = function (timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

/* ============================================================
   SEARCH TABLE
   ============================================================ */
APP.setupSearch = function (inputSelector, rowSelector) {
  const input = document.querySelector(inputSelector);
  if (!input) return;

  input.addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();
    document.querySelectorAll(rowSelector).forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  });
};

/* ============================================================
   PAGINATION
   ============================================================ */
APP.initPagination = function ({ rowsSelector, perPage, infoSelector, containerSelector }) {
  const rows = Array.from(document.querySelectorAll(rowsSelector));
  const infoEl = document.querySelector(infoSelector);
  const container = document.querySelector(containerSelector);
  if (!rows.length || !container) return;

  const totalPages = Math.ceil(rows.length / perPage);
  let currentPage = 1;

  const render = () => {
    rows.forEach((row, i) => {
      const start = (currentPage - 1) * perPage;
      const end = start + perPage;
      row.style.display = i >= start && i < end ? '' : 'none';
    });

    if (infoEl) {
      const start = (currentPage - 1) * perPage + 1;
      const end = Math.min(currentPage * perPage, rows.length);
      infoEl.textContent = `Mostrando ${start}-${end} de ${rows.length}`;
    }

    let html = '';
    html += `<button ${currentPage === 1 ? 'disabled' : ''} data-page="prev"><i class="fas fa-chevron-left"></i></button>`;

    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="next"><i class="fas fa-chevron-right"></i></button>`;

    container.innerHTML = html;

    container.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        if (page === 'prev') currentPage = Math.max(1, currentPage - 1);
        else if (page === 'next') currentPage = Math.min(totalPages, currentPage + 1);
        else currentPage = parseInt(page, 10);
        render();
      });
    });
  };

  render();
};

/* ============================================================
   INIT COMMON ON PAGE LOAD
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  APP.initSidebar();
  APP.setupLogout();

  const page = document.body.dataset.page;
  if (page) {
    APP.setActiveNav(page);
    document.querySelector('.topbar-title').textContent =
      document.querySelector(`.nav-item[data-page="${page}"] span`)?.textContent ||
      'Panel Administrativo';
  }
});
