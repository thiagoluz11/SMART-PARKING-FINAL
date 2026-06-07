/**
 * CONTROLLER — Smart Parking
 * Liga o Model ao View e gere os eventos de cada página
 */

const Controller = (() => {

  // ── Inicialização geral ────────────────────────────────────────────────
  const init = () => {
    const page = document.body.dataset.page;
    _injectLayout();

    switch (page) {
      case 'home':         initHome();         break;
      case 'login':        initLogin();        break;
      case 'register':     initRegister();     break;
      case 'dashboard':    initDashboard();    break;
      case 'reservations': initReservations(); break;
      case 'profile':      initProfile();      break;
      case 'about':        initAbout();        break;
      case 'admin':        initAdmin();        break;
      case 'admin-parks':  initAdminParks();   break;
      case 'admin-users':  initAdminUsers();   break;
      case 'admin-res':    initAdminReservations(); break;
      case 'admin-stats':  initAdminStats();   break;
    }

    _setupLogout();
  };

  // ── Layout Injection ───────────────────────────────────────────────────
  const _injectLayout = () => {
    const user = Model.getCurrentUser();
    const page = document.body.dataset.page;
    const isAuthPage = page === 'login' || page === 'register';

    const navEl = document.getElementById('navbar-placeholder');
    if (navEl) navEl.outerHTML = View.renderNavbar(user, isAuthPage);

    const footerEl = document.getElementById('footer-placeholder');
    if (footerEl) footerEl.outerHTML = View.renderFooter();
  };

  const _setupLogout = () => {
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-logout') {
        Model.logout();
        View.showToast('Sessão terminada.', 'info');
        setTimeout(() => window.location.href = 'index.html', 800);
      }
    });
  };

  // ── Guard: página protegida ────────────────────────────────────────────
  const _requireAuth = (adminOnly = false) => {
    const user = Model.getCurrentUser();
    if (!user) { window.location.href = 'login.html'; return false; }
    if (adminOnly && user.role?.toUpperCase() !== 'ADMIN') {
      View.showToast('Acesso negado.', 'error');
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  };

  // ── HOME PAGE ──────────────────────────────────────────────────────────
  const initHome = () => {
    _renderFeaturedParks();
    _renderTestimonials();
    _setupHeroSearch();
  };

  const _renderFeaturedParks = () => {
    const container = document.getElementById('featured-parks');
    if (!container) return;
    const parks = Model.getParks().slice(0, 3);
    container.innerHTML = parks.map(View.renderParkCard).join('');
    _setupParkCardClicks(container);
  };

  const _renderTestimonials = () => {
    const container = document.getElementById('testimonials');
    if (!container) return;
    container.innerHTML = Model.getTestimonials().map(t => `
      <div class="card">
        <div style="margin-bottom:var(--space-sm)">${View.renderStars(t.rating)}</div>
        <p style="font-size:0.9rem;color:var(--color-text-muted);margin-bottom:var(--space-md)">"${t.text}"</p>
        <div style="display:flex;align-items:center;gap:var(--space-sm)">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--color-surface-3);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700">${t.name.charAt(0)}</div>
          <span style="font-size:0.85rem;font-weight:600">${t.name}</span>
        </div>
      </div>`).join('');
  };

  const _setupHeroSearch = () => {
    const btn = document.getElementById('btn-hero-search');
    if (btn) {
      btn.addEventListener('click', () => {
        const user = Model.getCurrentUser();
        window.location.href = user ? 'dashboard.html' : 'login.html';
      });
    }
  };

  // ── LOGIN ──────────────────────────────────────────────────────────────
  const initLogin = () => {
    const form = document.getElementById('login-form');
    if (!form) return;

    const togglePwd = document.getElementById('toggle-password');
    const pwdInput  = document.getElementById('login-password');

    togglePwd?.addEventListener('click', () => {
      pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
      togglePwd.textContent = pwdInput.type === 'password' ? '👁' : '🙈';
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const result   = Model.login(email, password);

      if (result.success) {
        View.showToast(`Bem-vindo, ${result.user.name}!`, 'success');
        setTimeout(() => {
          window.location.href = result.user.role?.toUpperCase() === 'ADMIN' ? 'admin.html' : 'dashboard.html';
        }, 800);
      } else {
        View.showToast(result.error, 'error');
      }
    });
  };

  // ── REGISTER ──────────────────────────────────────────────────────────
  const initRegister = () => {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name     = document.getElementById('reg-name').value.trim();
      const email    = document.getElementById('reg-email').value.trim();
      const plate    = document.getElementById('reg-plate').value.trim().toUpperCase();
      const contact  = document.getElementById('reg-contact').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm  = document.getElementById('reg-confirm').value;

      if (password !== confirm) {
        View.showToast('As passwords não coincidem.', 'error');
        return;
      }
      if (password.length < 6) {
        View.showToast('A password deve ter pelo menos 6 caracteres.', 'error');
        return;
      }

      const result = Model.register({ name, email, contact, plate });
      if (result.success) {
        View.showToast('Registo bem-sucedido!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 800);
      } else {
        View.showToast(result.error, 'error');
      }
    });
  };

  // ── DASHBOARD ─────────────────────────────────────────────────────────
  const initDashboard = () => {
    if (!_requireAuth()) return;
    const user = Model.getCurrentUser();

    const greeting = document.getElementById('user-greeting');
    if (greeting) greeting.textContent = `Olá, ${user.name.split(' ')[0]}`;

    _renderUserVehicles();
    _renderFavoriteParks();
    _renderAllParks();
    _setupParkSearch();
    _setupReserveModal();
  };

  const _renderUserVehicles = () => {
    const container = document.getElementById('vehicles-list');
    if (!container) return;
    const user = Model.getCurrentUser();
    const vehicles = Model.getVehiclesByUser(user.id);

    container.innerHTML = vehicles.map(v => `
      <div class="card" style="padding:var(--space-md)">
        <div style="font-weight:700;font-size:0.9rem">${v.brand} ${v.model}</div>
        <div style="font-size:0.8rem;color:var(--color-text-muted)">Matrícula: ${v.plate}</div>
      </div>`).join('') +
      `<div class="card" style="padding:var(--space-md);cursor:pointer;border-style:dashed;display:flex;align-items:center;gap:var(--space-sm);color:var(--color-text-muted)" id="btn-add-vehicle">
        <span style="font-size:1.2rem">+</span> <span style="font-size:0.9rem">Adicionar veículo</span>
      </div>`;

    document.getElementById('btn-add-vehicle')?.addEventListener('click', () => {
      View.showToast('Funcionalidade disponível em breve.', 'info');
    });
  };

  const _renderFavoriteParks = () => {
    const container = document.getElementById('favorite-parks');
    if (!container) return;
    const parks = Model.getParks().slice(0, 3);
    container.innerHTML = parks.map(View.renderParkCard).join('');
    _setupParkCardClicks(container);
  };

  const _renderAllParks = (query = '') => {
    const container = document.getElementById('all-parks');
    if (!container) return;
    const parks = query ? Model.searchParks(query) : Model.getParks();
    if (parks.length === 0) {
      container.innerHTML = `<p class="text-muted">Nenhum parque encontrado.</p>`;
      return;
    }
    container.innerHTML = parks.map(View.renderParkCard).join('');
    _setupParkCardClicks(container);
  };

  const _setupParkSearch = () => {
    const input = document.getElementById('park-search');
    if (input) {
      input.addEventListener('input', (e) => _renderAllParks(e.target.value));
    }
  };

  const _setupParkCardClicks = (container) => {
    container.querySelectorAll('.btn-reserve').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        _openReserveModal(id);
      });
    });
  };

  const _setupReserveModal = () => {
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => View.closeModal('modal-reserve'));
    });

    const form = document.getElementById('reserve-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const parkId = document.getElementById('reserve-park-id').value;
      const park   = Model.getParkById(parkId);
      const user   = Model.getCurrentUser();
      const date   = document.getElementById('reserve-date').value;
      const start  = document.getElementById('reserve-start').value;
      const end    = document.getElementById('reserve-end').value;
      const spot   = String.fromCharCode(65 + Math.floor(Math.random() * 6)) + Math.floor(Math.random() * 20 + 1).toString().padStart(2, '0');

      if (!date || !start || !end) {
        View.showToast('Preencha todos os campos.', 'error');
        return;
      }

      const hours = (new Date(`1970-01-01T${end}`) - new Date(`1970-01-01T${start}`)) / 3600000;
      if (hours <= 0) {
        View.showToast('Hora de fim deve ser após hora de início.', 'error');
        return;
      }

      const res = Model.addReservation({
        park: park.name, spot, user: user.name, date, start, end, amount: +(hours * 1.5).toFixed(2),
      });

      View.closeModal('modal-reserve');
      View.showToast(`Reserva no ${park.name} criada com sucesso!`, 'success');
      setTimeout(() => window.location.href = 'reservations.html', 1200);
    });
  };

  const _openReserveModal = (parkId) => {
    const park = Model.getParkById(parkId);
    if (!park) return;

    document.getElementById('reserve-park-name').textContent = park.name;
    document.getElementById('reserve-park-id').value = parkId;
    document.getElementById('reserve-date').value = new Date().toISOString().split('T')[0];

    const user = Model.getCurrentUser();
    const vehicles = Model.getVehiclesByUser(user.id);
    const select = document.getElementById('reserve-vehicle');
    if (select) {
      select.innerHTML = vehicles.map(v => `<option value="${v.id}">${v.brand} ${v.model} (${v.plate})</option>`).join('');
    }

    View.openModal('modal-reserve');
  };

  // ── RESERVATIONS ──────────────────────────────────────────────────────
  const initReservations = () => {
    if (!_requireAuth()) return;
    const user   = Model.getCurrentUser();
    const allRes = Model.getReservations().filter(r => r.user === user.name);
    const tbody  = document.getElementById('reservations-tbody');
    if (!tbody) return;

    tbody.innerHTML = allRes.length > 0
      ? allRes.map(r => View.renderReservationRow(r, true)).join('')
      : `<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);padding:2rem">Nenhuma reserva encontrada.</td></tr>`;

    tbody.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-cancel-res')) {
        const id = e.target.dataset.id;
        Model.cancelReservation(id);
        View.showToast('Reserva cancelada.', 'info');
        initReservations();
      }
    });
  };

  // ── PROFILE ────────────────────────────────────────────────────────────
  const initProfile = () => {
    if (!_requireAuth()) return;
    const user = Model.getCurrentUser();

    const fields = {
      'profile-name':    user.name,
      'profile-email':   user.email,
      'profile-contact': user.contact,
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    });

    _renderUserVehicles();
    _renderUserReservationsSummary();

    document.getElementById('profile-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      View.showToast('Perfil atualizado com sucesso.', 'success');
    });
  };

  const _renderUserReservationsSummary = () => {
    const container = document.getElementById('profile-reservations');
    if (!container) return;
    const user = Model.getCurrentUser();
    const res  = Model.getReservations().filter(r => r.user === user.name).slice(0, 3);
    container.innerHTML = res.map(r => View.renderReservationRow(r, false)).join('');
  };

  // ── ABOUT ──────────────────────────────────────────────────────────────
  const initAbout = () => {};

  // ── ADMIN DASHBOARD ────────────────────────────────────────────────────
  const initAdmin = () => {
    if (!_requireAuth(true)) return;
    _renderAdminStats();
    _renderRecentUsers();
    _renderRecentReservations();
    _renderParkOccupancies();

    document.getElementById('btn-add-park')?.addEventListener('click', () => {
      View.showToast('Funcionalidade disponível em breve.', 'info');
    });
  };

  const _renderAdminStats = () => {
    const stats = Model.getStats();
    const containers = {
      'stat-reservations': [stats.totalReservations.toLocaleString('pt-PT'), `+${stats.monthlyGrowth.reservations}% este mês`, true],
      'stat-users':        [stats.totalUsers.toLocaleString('pt-PT'), `+${stats.monthlyGrowth.users}% este mês`, true],
      'stat-parks':        [stats.activeParks, 'Sem alterações', null],
      'stat-revenue':      [`€${stats.totalRevenue.toLocaleString('pt-PT')}`, `+${stats.monthlyGrowth.revenue}% este mês`, true],
    };
    Object.entries(containers).forEach(([id, [value, change, up]]) => {
      const el = document.getElementById(id);
      if (el) {
        el.querySelector('.stat-value').textContent = value;
        const changeEl = el.querySelector('.stat-change');
        if (changeEl) { changeEl.textContent = change; changeEl.className = `stat-change ${up === true ? 'up' : up === false ? 'down' : ''}`; }
      }
    });
  };

  const _renderRecentUsers = () => {
    const tbody = document.getElementById('recent-users-tbody');
    if (!tbody) return;
    tbody.innerHTML = Model.getUsers().slice(0, 4).map(u => View.renderUserRow(u)).join('');
    _setupUserToggle(tbody);
  };

  const _renderRecentReservations = () => {
    const tbody = document.getElementById('recent-res-tbody');
    if (!tbody) return;
    tbody.innerHTML = Model.getReservations().slice(0, 4).map(r => View.renderReservationRow(r)).join('');
  };

  const _renderParkOccupancies = () => {
    const container = document.getElementById('park-occupancies');
    if (!container) return;
    container.innerHTML = Model.getParks().map(p => View.renderParkOccupancy(p, Model.getParkOccupancy(p))).join('');
  };

  // ── ADMIN PARKS ────────────────────────────────────────────────────────
  const initAdminParks = () => {
    if (!_requireAuth(true)) return;
    const tbody = document.getElementById('parks-tbody');
    if (!tbody) return;
    tbody.innerHTML = Model.getParks().map(p => {
      const occ = Model.getParkOccupancy(p);
      return `
      <tr>
        <td>${p.id}</td>
        <td><strong>${p.name}</strong></td>
        <td>${p.city}</td>
        <td>${p.capacity}</td>
        <td>${p.available}</td>
        <td><span class="badge badge-${occ >= 80 ? 'danger' : occ >= 50 ? 'warning' : 'success'}">${occ}%</span></td>
        <td>${p.open} – ${p.close}</td>
        <td>
          <button class="btn btn-ghost btn-sm">Editar</button>
        </td>
      </tr>`;
    }).join('');
  };

  // ── ADMIN USERS ────────────────────────────────────────────────────────
  const initAdminUsers = () => {
    if (!_requireAuth(true)) return;
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    tbody.innerHTML = Model.getUsers().map(u => View.renderUserRow(u)).join('');
    _setupUserToggle(tbody);
  };

  const _setupUserToggle = (container) => {
    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-toggle-user')) {
        const id     = e.target.dataset.id;
        const status = e.target.dataset.status;
        const newStatus = status === 'active' ? 'blocked' : 'active';
        Model.updateUserStatus(id, newStatus);
        View.showToast(`Utilizador ${newStatus === 'active' ? 'ativado' : 'bloqueado'}.`, 'info');
        // Re-render
        const users = Model.getUsers();
        container.innerHTML = users.map(u => View.renderUserRow(u)).join('');
        _setupUserToggle(container);
      }
    });
  };

  // ── ADMIN RESERVATIONS ────────────────────────────────────────────────
  const initAdminReservations = () => {
    if (!_requireAuth(true)) return;
    const tbody = document.getElementById('admin-res-tbody');
    if (!tbody) return;
    tbody.innerHTML = Model.getReservations().map(r => View.renderReservationRow(r)).join('');
  };

  // ── ADMIN STATS ────────────────────────────────────────────────────────
  const initAdminStats = () => {
    if (!_requireAuth(true)) return;
    _renderAdminStats();
    _renderParkOccupancies();
  };

  return { init };

})();

document.addEventListener('DOMContentLoaded', Controller.init);
window.Controller = Controller;