const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Add modal styles to <style>
const modalCSSInHead = `
    /* Search Modal Popup Fix (Never visible statically at the bottom) */
    .modal-overlay {
      position: fixed !important;
      inset: 0 !important;
      background: rgba(0, 0, 0, 0.65) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      z-index: 99999 !important;
      display: none !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
    }
    .modal-overlay.open {
      display: flex !important;
    }
    .modal-card {
      background: #FFFFFF !important;
      border: 1px solid var(--border-fine) !important;
      border-radius: 18px !important;
      width: 100% !important;
      max-width: 600px !important;
      max-height: 90vh !important;
      overflow-y: auto !important;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25) !important;
      animation: modalScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    @keyframes modalScaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-header {
      padding: 18px 24px !important;
      border-bottom: 1px solid var(--border-fine) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }
    .modal-close {
      background: none !important;
      border: none !important;
      font-size: 1.5rem !important;
      cursor: pointer !important;
      color: #6B7280 !important;
      line-height: 1 !important;
    }
    .modal-close:hover {
      color: #0A0A0A !important;
    }
    .modal-body {
      padding: 24px !important;
    }
    .admin-only-link {
      display: none !important;
    }
`;

html = html.replace('</style>', modalCSSInHead + '\n  </style>');

// 2. Hide database links by default on storefront
html = html.replace(
    '<li><a href="database.html" style="color: var(--dark-red);"><i data-lucide="shield-check" style="width: 14px; display: inline-block; vertical-align: middle;"></i> DATABASE</a></li>',
    '<li class="admin-only-link" id="nav-db-li" style="display: none !important;"><a href="database.html" style="color: var(--dark-red);"><i data-lucide="shield-check" style="width: 14px; display: inline-block; vertical-align: middle;"></i> DATABASE</a></li>'
);

html = html.replace(
    '<a href="database.html" class="drawer-action-btn">\n        <i data-lucide="shield-check" style="width: 18px; height: 18px;"></i>\n        <span>Database</span>\n      </a>',
    '<a href="database.html" class="drawer-action-btn admin-only-link" id="drawer-db-btn" style="display: none !important;">\n        <i data-lucide="shield-check" style="width: 18px; height: 18px;"></i>\n        <span>Database</span>\n      </a>'
);

html = html.replace(
    '<a href="database.html" class="drawer-link">\n        <div class="drawer-link-left">\n          <span class="drawer-num">05</span>\n          <i data-lucide="database" style="width: 18px; height: 18px; color: var(--dark-red);"></i>\n          <span style="color: var(--dark-red); font-weight: 800;">ADMIN DATABASE</span>\n        </div>\n      </a>',
    '<a href="database.html" class="drawer-link admin-only-link" id="drawer-db-link" style="display: none !important;">\n        <div class="drawer-link-left">\n          <span class="drawer-num">05</span>\n          <i data-lucide="database" style="width: 18px; height: 18px; color: var(--dark-red);"></i>\n          <span style="color: var(--dark-red); font-weight: 800;">ADMIN DATABASE</span>\n        </div>\n      </a>'
);

html = html.replace(
    '<li><a href="database.html" style="color: var(--dark-red); font-weight: 700;">Admin Database</a></li>',
    '<li class="admin-only-link" id="footer-db-link" style="display: none !important;"><a href="database.html" style="color: var(--dark-red); font-weight: 700;">Admin Database</a></li>'
);

// In the empty state where it said "OPEN ADMIN PORTAL", let's make it friendly for public or admin
html = html.replace(
    '<a href="database.html" class="btn-hero-primary" style="font-size: 0.78rem; padding: 12px 24px;">\n              <i data-lucide="plus"></i> OPEN ADMIN PORTAL\n            </a>',
    '<a href="login.html" class="btn-hero-primary" style="font-size: 0.78rem; padding: 12px 24px;">\n              <i data-lucide="log-in"></i> MEMBER / ADMIN SIGN IN\n            </a>'
);

// 3. Add dynamic check in JS on index.html
const checkAdminJS = `
    // Reveal Admin links ONLY if authenticated with pythonstore@gmail.com
    function syncAdminVisibility() {
      const isAuthed = sessionStorage.getItem('python_admin_session') === 'authenticated' ||
                       localStorage.getItem('python_admin_session') === 'authenticated';
      document.querySelectorAll('.admin-only-link').forEach(el => {
        if (isAuthed) {
          el.style.setProperty('display', (el.tagName === 'LI' ? 'inline-block' : 'flex'), 'important');
        } else {
          el.style.setProperty('display', 'none', 'important');
        }
      });
    }
`;

html = html.replace("document.addEventListener('DOMContentLoaded', () => {", checkAdminJS + "\n    document.addEventListener('DOMContentLoaded', () => {\n      syncAdminVisibility();");

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully patched index.html: Search modal error resolved & Admin database links hidden from regular visitors!');
