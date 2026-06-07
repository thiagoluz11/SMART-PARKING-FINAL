/**
 * VIEW — Smart Parking
 * Responsável por renderizar HTML a partir de dados
 */

const View = (() => {

  // ── SVG Icons for Popup ───────────────────────────────────────────────
  const popupIcons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>`,
  };

  // ── Popup (replaces native alert) ─────────────────────────────────────
  const showPopup = ({ title = '', message = '', type = 'info', buttonText = 'OK', onClose = null, redirect = null } = {}) => {
    // Remove any existing popup
    document.querySelector('.popup-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.innerHTML = `
      <div class="popup-box ${type}">
        <div class="popup-icon ${type}">${popupIcons[type] || popupIcons.info}</div>
        <div class="popup-title">${title}</div>
        <div class="popup-message">${message}</div>
        <div class="popup-actions">
          <button class="popup-btn popup-btn-primary" id="popup-ok-btn">${buttonText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Animate in on next frame
    requestAnimationFrame(() => overlay.classList.add('active'));

    const close = () => {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
        if (onClose) onClose();
        if (redirect) window.location.href = redirect;
      }, 250);
    };

    overlay.querySelector('#popup-ok-btn').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  };

  // ── Confirm Popup (replaces native confirm) ──────────────────────────
  const showConfirm = ({ title = 'Confirmação', message = '', type = 'warning', confirmText = 'Confirmar', cancelText = 'Cancelar' } = {}) => {
    return new Promise((resolve) => {
      // Remove any existing popup
      document.querySelector('.popup-overlay')?.remove();

      const overlay = document.createElement('div');
      overlay.className = 'popup-overlay';
      overlay.innerHTML = `
        <div class="popup-box ${type}">
          <div class="popup-icon ${type}">${popupIcons[type] || popupIcons.warning}</div>
          <div class="popup-title">${title}</div>
          <div class="popup-message">${message}</div>
          <div class="popup-actions">
            <button class="popup-btn popup-btn-cancel" id="popup-cancel-btn">${cancelText}</button>
            <button class="popup-btn popup-btn-primary" id="popup-confirm-btn">${confirmText}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('active'));

      const close = (result) => {
        overlay.classList.remove('active');
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 250);
      };

      overlay.querySelector('#popup-confirm-btn').addEventListener('click', () => close(true));
      overlay.querySelector('#popup-cancel-btn').addEventListener('click', () => close(false));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(false);
      });

      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          close(false);
          document.removeEventListener('keydown', handleEsc);
        }
      };
      document.addEventListener('keydown', handleEsc);
    });
  };

  // ── Navbar ─────────────────────────────────────────────────────────────
  const renderNavbar = (user, isAuthPage = false) => {
    const isLoggedIn = !!user;
    const isAdmin = user && user.role?.toUpperCase() === 'ADMIN';

    if (isAuthPage) {
      return `
      <nav class="navbar">
        <div class="navbar-inner">
          <a href="index.html" class="navbar-logo"><span class="text-accent">Smart</span> Parking</a>
          <div class="navbar-nav">
            <a href="index.html#sobre" class="nav-link">Sobre nós</a>
            <a href="register.html" class="nav-link">Registo</a>
            <a href="login.html" class="nav-link highlight">Login</a>
          </div>
        </div>
      </nav>`;
    }

    if (!isLoggedIn) {
      return `
      <nav class="navbar">
        <div class="navbar-inner">
          <a href="index.html" class="navbar-logo"><span class="text-accent">Smart</span> Parking</a>
          <div class="navbar-nav">
            <a href="index.html#sobre" class="nav-link">Sobre nós</a>
            <a href="register.html" class="nav-link">Registo</a>
            <a href="login.html" class="nav-link highlight">Login</a>
          </div>
          <div class="navbar-actions">
            <a href="login.html" class="btn btn-primary btn-sm">Entrar</a>
          </div>
        </div>
      </nav>`;
    }

    if (isAdmin) {
      return `
      <nav class="navbar">
        <div class="navbar-inner">
          <a href="index.html" class="navbar-logo"><span class="text-accent">Smart</span> Parking</a>
          <div class="navbar-nav" id="navbar-nav">
            <a href="admin.html" class="nav-link">Dashboard</a>
            <a href="admin-parks.html" class="nav-link">Parques</a>
            <a href="admin-users.html" class="nav-link">Utilizadores</a>
            <a href="admin-reservations.html" class="nav-link">Reservas</a>
            <a href="admin-stats.html" class="nav-link">Estatísticas</a>
          </div>
          <div class="navbar-actions">
            <span class="text-muted navbar-username" style="font-size:0.85rem">${user.name}</span>
            <button class="btn btn-ghost btn-sm" id="btn-logout">Sair</button>
            <button class="navbar-hamburger" id="navbar-hamburger" aria-label="Menu">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>`;
    }

    return `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="index.html" class="navbar-logo"><span class="text-accent">Smart</span> Parking</a>
        <div class="navbar-nav" id="navbar-nav">
          <a href="dashboard.html" class="nav-link">Início</a>
          <div class="nav-search-wrapper">
            <input type="text" class="form-input" placeholder="Procurar Parques..." id="nav-search">
            <div class="nav-search-dropdown" id="nav-search-dropdown"></div>
          </div>
          <a href="reservations.html" class="nav-link">Minhas reservas</a>
          <a href="profile.html" class="nav-link text-accent">Meu Perfil</a>
        </div>
        <div class="navbar-actions">
          <button class="btn btn-ghost btn-sm" id="btn-logout">Sair</button>
          <button class="navbar-hamburger" id="navbar-hamburger" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>`;
  };


  // ── Hamburger Menu ────────────────────────────────────────────────────
  const initHamburger = () => {
    const btn = document.getElementById('navbar-hamburger');
    const nav = document.getElementById('navbar-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('mobile-open');
      btn.classList.toggle('active', open);
    });
    // fechar ao clicar num link
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('mobile-open');
        btn.classList.remove('active');
      });
    });
  };
  document.addEventListener('DOMContentLoaded', initHamburger);

  // ── Init Nav Search (call after parks are loaded) ─────────────────────
  const initNavSearch = (parks, onParkSelect) => {
    const input = document.getElementById('nav-search');
    const dropdown = document.getElementById('nav-search-dropdown');
    if (!input || !dropdown) return;

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();

      if (query.length < 1) {
        dropdown.classList.remove('visible');
        return;
      }

      const filtered = parks.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query) ||
        (p.address && p.address.toLowerCase().includes(query))
      ).slice(0, 6);

      if (filtered.length === 0) {
        dropdown.innerHTML = `<div class="nav-search-empty">Nenhum parque encontrado para "<strong>${query}</strong>"</div>`;
      } else {
        dropdown.innerHTML = filtered.map(p => {
          const hasSpots = p.available > 0;
          const badgeCls = hasSpots ? 'available' : 'full';
          const badgeText = hasSpots ? `${p.available} livres` : 'Lotado';
          return `
            <div class="nav-search-item" data-park-id="${p.id}">
              <div class="nav-search-item-icon">🅿️</div>
              <div class="nav-search-item-info">
                <div class="nav-search-item-name">${p.name}</div>
                <div class="nav-search-item-meta">📍 ${p.city}</div>
              </div>
              <span class="availability-badge ${badgeCls}">${badgeText}</span>
            </div>`;
        }).join('');
      }

      dropdown.classList.add('visible');

      // Bind clicks on results
      dropdown.querySelectorAll('.nav-search-item').forEach(item => {
        item.addEventListener('click', () => {
          const parkId = Number(item.dataset.parkId);
          dropdown.classList.remove('visible');
          input.value = '';
          if (onParkSelect) {
            onParkSelect(parkId);
          } else {
            localStorage.setItem('selectedParkId', parkId);
            window.location.href = 'dashboard.html';
          }
        });
      });
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-search-wrapper')) {
        dropdown.classList.remove('visible');
      }
    });

    // Sync with dashboard park-search if on same page
    input.addEventListener('input', () => {
      const dashSearch = document.getElementById('park-search');
      if (dashSearch && dashSearch !== input) {
        dashSearch.value = input.value;
        dashSearch.dispatchEvent(new Event('input'));
      }
    });
  };

  // ── Footer ─────────────────────────────────────────────────────────────
  const renderFooter = () => `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="footer-logo"><span class="text-accent">Smart</span> Parking</div>
            <p class="footer-tagline">Estacionamento inteligente, rápido e sem complicações.</p>
            <p class="footer-tagline">Contacto: smartparking@email.com | +351 912 345 678</p>
          </div>
          <div>
            <div class="footer-heading">Navegação</div>
            <div class="footer-links">
              <a href="index.html">Início</a>
              <a href="about.html">Sobre Nós</a>
              <a href="register.html">Registo</a>
              <a href="login.html">Login</a>
            </div>
          </div>
          <div>
            <div class="footer-heading">Serviços</div>
            <div class="footer-links">
              <a href="dashboard.html">Parques</a>
              <a href="reservations.html">Reservas</a>
              <a href="profile.html">Perfil</a>
            </div>
          </div>
          <div>
            <div class="footer-heading">Legal</div>
            <div class="footer-links">
              <a href="#">Privacidade</a>
              <a href="#">Termos de Uso</a>
              <a href="#">RGPD</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 Smart Parking. Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>`;

  // ── Park Card ──────────────────────────────────────────────────────────
  const renderParkCard = (park, isFavorite = false) => {
    const occupancy = Math.round(((park.capacity - park.available) / park.capacity) * 100);
    return `
    <div class="park-card" data-park-id="${park.id}">
      <img class="park-card-img" src="${park.img}" alt="${park.name}" loading="lazy">
      <div class="park-card-body">
        <div class="park-card-name">${park.name}</div>
        <div class="park-card-info">📍 ${park.city}</div>
        <div class="park-card-spots">${park.available} lugares disponíveis</div>
      </div>
      <div class="park-card-footer" style="display:flex; justify-content:space-between; align-items:center; width:100%">
        <button class="btn-favorite ${isFavorite ? 'active' : ''}" data-id="${park.id}" title="${isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
          ${isFavorite ? '★' : '☆'}
        </button>
        <button class="btn btn-primary btn-sm btn-reserve" data-id="${park.id}">Agendar</button>
      </div>
    </div>`;
  };

  // ── Reservation Row ────────────────────────────────────────────────────
  const renderReservationRow = (r, showActions = false) => {
    const statusMap = {
      confirmed:  { label: 'Confirmada', cls: 'warning' },
      pending:    { label: 'Pendente',   cls: 'info' },
      completed:  { label: 'Concluída',  cls: 'neutral' },
      cancelled:  { label: 'Cancelada',  cls: 'danger' },
    };
    const s = statusMap[r.status] || statusMap.pending;
    return `
    <tr>
      <td>${r.park}</td>
      <td>${r.spot}</td>
      <td>${r.date}</td>
      <td>${r.start} – ${r.end}</td>
      <td><span class="badge badge-${s.cls}">${s.label}</span></td>
      <td>€${r.amount?.toFixed(2) ?? '-'}</td>
      ${showActions ? `<td>
        ${r.status === 'pending' || r.status === 'confirmed'
          ? `<button class="btn btn-danger btn-sm btn-cancel-res" data-id="${r.id}">Cancelar</button>`
          : `<span class="text-muted" style="font-size:0.8rem">—</span>`}
      </td>` : ''}
    </tr>`;
  };

  // ── User Row ───────────────────────────────────────────────────────────
  const renderUserRow = (u) => {
    const statusCls = u.status === 'active' ? 'success' : 'danger';
    const statusLabel = u.status === 'active' ? 'Ativo' : 'Bloqueado';
    return `
    <tr>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td><span class="badge badge-${statusCls}">${statusLabel}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm btn-toggle-user" data-id="${u.id}" data-status="${u.status}">
          ${u.status === 'active' ? 'Bloquear' : 'Ativar'}
        </button>
      </td>
    </tr>`;
  };

  // ── Stars ──────────────────────────────────────────────────────────────
  const renderStars = (n) =>
    Array.from({length: 5}, (_, i) =>
      `<span style="color:${i < n ? 'var(--color-accent)' : 'var(--color-surface-3)'}">★</span>`
    ).join('');

  // ── Toast ──────────────────────────────────────────────────────────────
  const showToast = (message, type = 'info') => {
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const container = document.getElementById('toast-container') ||
      (() => {
        const el = document.createElement('div');
        el.id = 'toast-container';
        document.body.appendChild(el);
        return el;
      })();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || icons.info}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  };

  // ── Modal Helpers ──────────────────────────────────────────────────────
  const openModal = (id) => {
    document.getElementById(id)?.classList.add('active');
  };

  const closeModal = (id) => {
    document.getElementById(id)?.classList.remove('active');
  };

  // ── Stat Card ──────────────────────────────────────────────────────────
  const renderStatCard = (label, value, change, up = true) => `
    <div class="stat-card">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      ${change ? `<div class="stat-change ${up ? 'up' : 'down'}">${up ? '↑' : '↓'} ${change}</div>` : ''}
    </div>`;

  // ── Park Occupancy Row ─────────────────────────────────────────────────
  const renderParkOccupancy = (park, occupancy) => {
    const cls = occupancy >= 80 ? 'high' : occupancy >= 50 ? 'medium' : 'low';
    return `
    <div style="padding: var(--space-md) 0; border-bottom: 1px solid var(--color-border)">
      <div class="flex-between">
        <div>
          <div style="font-weight:600;font-size:0.9rem">${park.name}</div>
          <div style="font-size:0.8rem;color:var(--color-text-muted)">${park.city}</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:var(--font-display);font-size:1.3rem;font-weight:800;color:var(--color-accent)">${occupancy}%</div>
          <div style="font-size:0.75rem;color:var(--color-text-muted)">${park.capacity - park.available}/${park.capacity} lugares</div>
        </div>
      </div>
      <div class="progress-bar" style="margin-top:var(--space-sm)">
        <div class="progress-fill ${cls}" style="width:${occupancy}%"></div>
      </div>
    </div>`;
  };

  return {
    renderNavbar,
    renderFooter,
    renderParkCard,
    renderReservationRow,
    renderUserRow,
    renderStars,
    showToast,
    showPopup,
    showConfirm,
    initNavSearch,
    openModal,
    closeModal,
    renderStatCard,
    renderParkOccupancy,
  };

})();

window.View = View;