/**
 * adminPanel.js — Painel Admin Smart Parking
 */

const API = 'http://localhost:3000';

const getToken = () => localStorage.getItem('token');
const getUser  = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

const requireAdmin = () => {
    const user = getUser();
    if (!user || user.role?.toUpperCase() !== 'ADMIN') {
        window.location.href = 'login.html';
        return false;
    }
    return true;
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────
const initAdminDashboard = async () => {
    if (!requireAdmin()) return;

    try {
        const res  = await fetch(`${API}/admin/stats`, { headers: authHeaders() });
        const data = await res.json();
        document.querySelector('#stat-reservations .stat-value').textContent = data.totalReservations ?? '—';
        document.querySelector('#stat-users .stat-value').textContent        = data.totalUsers ?? '—';
        document.querySelector('#stat-parks .stat-value').textContent        = data.totalParks ?? '—';
        document.querySelector('#stat-revenue .stat-value').textContent      = data.totalRevenue ? `€${Number(data.totalRevenue).toFixed(2)}` : '€0';
    } catch (err) { console.error('Stats:', err); }

    try {
        const res   = await fetch(`${API}/admin/users`, { headers: authHeaders() });
        const users = await res.json();
        const tbody = document.getElementById('recent-users-tbody');
        if (tbody && Array.isArray(users)) {
            tbody.innerHTML = users.slice(0, 5).map(u => `
                <tr>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td><span class="badge badge-${u.account_status === 'ACTIVE' ? 'success' : 'danger'}">${u.account_status}</span></td>
                </tr>`).join('');
        }
    } catch (err) { console.error('Users:', err); }

    try {
        const res   = await fetch(`${API}/admin/reservations`, { headers: authHeaders() });
        const json  = await res.json();
        const data  = Array.isArray(json) ? json : [];
        const tbody = document.getElementById('recent-res-tbody');
        if (tbody) {
            tbody.innerHTML = data.slice(0, 5).map(r => `
                <tr>
                    <td>${r.ParkingSpot?.ParkingPark?.name ?? '—'}</td>
                    <td>${r.ParkingSpot?.number ?? '—'}</td>
                    <td>${r.date}</td>
                    <td>${r.start_time} – ${r.end_time}</td>
                    <td><span class="badge badge-${r.status === 'active' ? 'success' : 'warning'}">${r.status}</span></td>
                    <td>—</td>
                </tr>`).join('');
        }
    } catch (err) { console.error('Reservations:', err); }

    try {
        const res       = await fetch(`${API}/admin/parks`, { headers: authHeaders() });
        const parks     = await res.json();
        const container = document.getElementById('park-occupancies');
        if (container && Array.isArray(parks)) {
            container.innerHTML = parks.map(p => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-sm) 0;border-bottom:1px solid var(--color-border)">
                    <span style="font-size:0.9rem">${p.name} <span style="color:var(--color-text-muted);font-size:0.8rem">${p.city}</span></span>
                    <span style="font-size:0.85rem;color:var(--color-text-muted)">${p.total_capacity} lugares</span>
                </div>`).join('');
        }
    } catch (err) { console.error('Parks:', err); }
};

// ── UTILIZADORES ──────────────────────────────────────────────────────────
const initAdminUsers = async () => {
    if (!requireAdmin()) return;

    let allUsers = [];

    const renderUsers = (users) => {
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted)">Nenhum utilizador encontrado</td></tr>';
            return;
        }
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.id_user}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><span class="badge badge-${u.account_status === 'ACTIVE' ? 'success' : 'danger'}">${u.account_status}</span></td>
                <td>
                    <button class="btn btn-ghost btn-sm btn-toggle-status"
                        data-id="${u.id_user}"
                        data-status="${u.account_status}">
                        ${u.account_status === 'ACTIVE' ? 'Bloquear' : 'Ativar'}
                    </button>
                </td>
            </tr>`).join('');

        tbody.querySelectorAll('.btn-toggle-status').forEach(btn => {
            btn.addEventListener('click', async () => {
                const newStatus = btn.dataset.status === 'ACTIVE' ? 'BLOCK' : 'ACTIVE';
                await fetch(`${API}/admin/users/${btn.dataset.id}/status`, {
                    method: 'PUT',
                    headers: authHeaders(),
                    body: JSON.stringify({ account_status: newStatus })
                });
                loadUsers();
            });
        });
    };

    const applyFilters = () => {
        const search = document.getElementById('filter-search')?.value.toLowerCase() || '';
        const estado = document.getElementById('filter-status')?.value || '';
        const papel  = document.getElementById('filter-role')?.value || '';
        const filtered = allUsers.filter(u => {
            const matchSearch = !search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
            const matchStatus = !estado || u.account_status === estado;
            const matchRole   = !papel  || u.role === papel;
            return matchSearch && matchStatus && matchRole;
        });
        renderUsers(filtered);
    };

    const loadUsers = async () => {
        try {
            const res  = await fetch(`${API}/admin/users`, { headers: authHeaders() });
            const json = await res.json();
            allUsers   = Array.isArray(json) ? json : [];
            const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
            setEl('count-total',   allUsers.length);
            setEl('count-active',  allUsers.filter(u => u.account_status === 'ACTIVE').length);
            setEl('count-blocked', allUsers.filter(u => u.account_status !== 'ACTIVE').length);
            setEl('count-admins',  allUsers.filter(u => u.role === 'ADMIN').length);
            applyFilters();
        } catch (err) { console.error('Users:', err); }
    };

    document.getElementById('filter-search')?.addEventListener('input', applyFilters);
    document.getElementById('filter-status')?.addEventListener('change', applyFilters);
    document.getElementById('filter-role')?.addEventListener('change', applyFilters);

    loadUsers();
};

// ── PARQUES ───────────────────────────────────────────────────────────────
const initAdminParks = async () => {
    if (!requireAdmin()) return;

    let allParks = [];

    const modalEl    = document.getElementById('modal-park');
    const modalTitle = document.getElementById('modal-park-title');
    const parkForm   = document.getElementById('park-form');

    const openModal = (data) => {
        data = data || {};
        const isEdit = !!data.id;
        if (modalTitle) modalTitle.textContent = isEdit ? 'Editar Parque' : 'Adicionar Parque';
        document.getElementById('park-id').value       = data.id       || '';
        document.getElementById('park-name').value     = data.name     || '';
        document.getElementById('park-city').value     = data.city     || '';
        document.getElementById('park-address').value  = data.address  || '';
        document.getElementById('park-capacity').value = data.capacity || '';
        document.getElementById('park-open').value     = (data.open  || '').substring(0, 5);
        document.getElementById('park-close').value    = (data.close || '').substring(0, 5);
        const latEl = document.getElementById('park-lat'); if (latEl) latEl.value = data.lat || '';
        const lngEl = document.getElementById('park-lng'); if (lngEl) lngEl.value = data.lng || '';
        const imgEl = document.getElementById('park-img'); if (imgEl) imgEl.value = data.img || '';
        const phEl  = document.getElementById('park-price-hour');  if (phEl)  phEl.value  = data.pricehour  || data.price_per_hour  || '';
        const pdEl  = document.getElementById('park-price-daily'); if (pdEl)  pdEl.value  = data.pricedaily || data.daily_ticket_price || '';
        if (modalEl) modalEl.style.cssText = 'display:flex !important;opacity:1 !important;pointer-events:all !important;';
    };

    const closeModal = () => {
        if (modalEl) modalEl.style.cssText = 'display:none !important;';
        if (parkForm) parkForm.reset();
    };

    document.getElementById('btn-add-park')?.addEventListener('click', () => openModal());
    document.querySelector('#modal-park .modal-close')?.addEventListener('click', closeModal);
    modalEl?.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });

    parkForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id      = document.getElementById('park-id').value;
        const payload = {
            name:           document.getElementById('park-name').value,
            city:           document.getElementById('park-city').value,
            address:        document.getElementById('park-address').value,
            total_capacity: Number(document.getElementById('park-capacity').value),
            opening_time:   document.getElementById('park-open').value,
            closing_time:   document.getElementById('park-close').value,
            lat:              document.getElementById('park-lat')?.value || null,
            lng:              document.getElementById('park-lng')?.value || null,
            img:              document.getElementById('park-img')?.value || null,
            price_per_hour:   document.getElementById('park-price-hour')?.value  || null,
            daily_ticket_price: document.getElementById('park-price-daily')?.value || null,
        };
        const url    = id ? `${API}/admin/parks/${id}` : `${API}/admin/parks`;
        const method = id ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
            if (res.ok) { closeModal(); loadParks(); }
            else { const err = await res.json(); alert('Erro: ' + (err.error || res.status)); }
        } catch (err) { alert('Erro de ligação ao servidor'); }
    });

    const renderParks = (parks) => {
        const tbody = document.getElementById('parks-tbody');
        if (!tbody) return;
        if (parks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted)">Nenhum parque encontrado</td></tr>';
            return;
        }
        tbody.innerHTML = parks.map(p => `
            <tr>
                <td>${p.id_park}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.city}</td>
                <td>${p.address || '—'}</td>
                <td>${p.total_capacity}</td>
                <td>${p.opening_time} – ${p.closing_time}</td>
                <td>
                    <button class="btn btn-ghost btn-sm btn-edit-park"
                        data-id="${p.id_park}"
                        data-name="${p.name}"
                        data-city="${p.city}"
                        data-capacity="${p.total_capacity}"
                        data-open="${p.opening_time}"
                        data-close="${p.closing_time}"
                        data-address="${p.address || ''}"
                        data-lat="${p.lat || ''}"
                        data-lng="${p.lng || ''}"
                        data-img="${p.img || ''}"
                        data-pricehour="${p.price_per_hour || ''}"
                        data-pricedaily="${p.daily_ticket_price || ''}">Editar</button>
                    <button class="btn btn-ghost btn-sm btn-delete-park"
                        data-parkid="${p.id_park}"
                        data-name="${p.name}"
                        style="color:var(--color-danger);margin-left:4px">Apagar</button>
                </td>
            </tr>`).join('');

        tbody.querySelectorAll('.btn-edit-park').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.dataset));
        });

        tbody.querySelectorAll('.btn-delete-park').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm(`Apagar o parque "${btn.dataset.name}"? Esta ação apaga também todos os seus lugares.`)) return;
                try {
                    const res = await fetch(`${API}/admin/parks/${btn.dataset.parkid}`, {
                        method: 'DELETE', headers: authHeaders()
                    });
                    if (res.ok) loadParks();
                    else alert('Erro ao apagar o parque.');
                } catch { alert('Erro de ligação ao servidor.'); }
            });
        });
    };

    const applyFilters = () => {
        const search = document.getElementById('park-search')?.value.toLowerCase() || '';
        const cidade = document.getElementById('park-city-filter')?.value || '';
        const filtered = allParks.filter(p => {
            const matchSearch = !search || p.name.toLowerCase().includes(search);
            const matchCity   = !cidade || cidade === 'Todas as cidades' || p.city === cidade;
            return matchSearch && matchCity;
        });
        renderParks(filtered);
    };

    const loadParks = async () => {
        try {
            const res  = await fetch(`${API}/admin/parks`, { headers: authHeaders() });
            const json = await res.json();
            allParks   = Array.isArray(json) ? json : [];
            applyFilters();
        } catch (err) { console.error('Parks:', err); }
    };

    document.getElementById('park-search')?.addEventListener('input', applyFilters);
    document.getElementById('park-city-filter')?.addEventListener('change', applyFilters);

    loadParks();
};

// ── RESERVAS ──────────────────────────────────────────────────────────────
const initAdminReservations = async () => {
    if (!requireAdmin()) return;

    let allReservations = [];

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    const renderReservations = (data) => {
        const tbody = document.getElementById('admin-res-tbody');
        if (!tbody) return;
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--color-text-muted)">Nenhuma reserva encontrada</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(r => `
            <tr>
                <td>${r.id_reservation}</td>
                <td>${r.ParkingSpot?.ParkingPark?.name ?? '—'}</td>
                <td>${r.ParkingSpot?.number ?? '—'}</td>
                <td>${r.Vehicle?.User?.name ?? '—'}</td>
                <td>${r.date}</td>
                <td>${r.start_time} – ${r.end_time}</td>
                <td><span class="badge badge-${r.status === 'active' || r.status === 'confirmed' ? 'warning' : r.status === 'completed' ? 'success' : 'danger'}">${r.status}</span></td>
                <td>${r.status === 'active' || r.status === 'confirmed' ? '<button class="btn btn-ghost btn-sm btn-cancel-res" data-id="' + r.id_reservation + '">Cancelar</button>' : '—'}</td>
            </tr>`).join('');

        tbody.querySelectorAll('.btn-cancel-res').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Cancelar esta reserva?')) return;
                await fetch(`${API}/admin/reservations/${btn.dataset.id}/status`, {
                    method: 'PUT',
                    headers: authHeaders(),
                    body: JSON.stringify({ status: 'cancelled' })
                });
                loadReservations();
            });
        });
    };

    const applyFilters = () => {
        const search = document.getElementById('res-search')?.value.toLowerCase() || '';
        const status = document.getElementById('res-filter-status')?.value || '';
        const date   = document.getElementById('res-filter-date')?.value || '';
        const park   = document.getElementById('res-filter-park')?.value || '';
        const filtered = allReservations.filter(r => {
            const userName = r.Vehicle?.User?.name?.toLowerCase() || '';
            const parkName = r.ParkingSpot?.ParkingPark?.name || '';
            const matchSearch = !search || userName.includes(search) || parkName.toLowerCase().includes(search);
            const matchStatus = !status || r.status === status;
            const matchDate   = !date   || r.date === date;
            const matchPark   = !park   || parkName === park;
            return matchSearch && matchStatus && matchDate && matchPark;
        });
        renderReservations(filtered);
    };

    const loadReservations = async () => {
        const tbody = document.getElementById('admin-res-tbody');
        try {
            const res = await fetch(`${API}/admin/reservations`, { headers: authHeaders() });
            if (!res.ok) {
                if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--color-danger)">Erro ao carregar reservas (' + res.status + ')</td></tr>';
                return;
            }
            const json = await res.json();
            allReservations = Array.isArray(json) ? json : [];

            setEl('res-count-total',     allReservations.length);
            setEl('res-count-active',    allReservations.filter(r => r.status === 'active').length);
            setEl('res-count-completed', allReservations.filter(r => r.status === 'completed').length);
            setEl('res-count-cancelled', allReservations.filter(r => r.status === 'cancelled').length);

            const parkSelect = document.getElementById('res-filter-park');
            if (parkSelect) {
                const parks   = [...new Set(allReservations.map(r => r.ParkingSpot?.ParkingPark?.name).filter(Boolean))];
                const current = parkSelect.value;
                parkSelect.innerHTML = '<option value="">Todos os parques</option>' +
                    parks.map(p => '<option value="' + p + '"' + (p === current ? ' selected' : '') + '>' + p + '</option>').join('');
            }

            applyFilters();
        } catch (err) {
            console.error('Reservations:', err);
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--color-danger)">Erro de ligação ao servidor</td></tr>';
        }
    };

    document.getElementById('res-search')?.addEventListener('input', applyFilters);
    document.getElementById('res-filter-status')?.addEventListener('change', applyFilters);
    document.getElementById('res-filter-date')?.addEventListener('change', applyFilters);
    document.getElementById('res-filter-park')?.addEventListener('change', applyFilters);

    loadReservations();
};

// ── ESTATÍSTICAS ──────────────────────────────────────────────────────────
const initAdminStats = async () => {
    if (!requireAdmin()) return;

    try {
        const res  = await fetch(`${API}/admin/stats`, { headers: authHeaders() });
        const data = await res.json();
        document.querySelector('#stat-reservations .stat-value').textContent = data.totalReservations ?? '—';
        document.querySelector('#stat-users .stat-value').textContent        = data.totalUsers ?? '—';
        document.querySelector('#stat-parks .stat-value').textContent        = data.totalParks ?? '—';
        document.querySelector('#stat-revenue .stat-value').textContent      = data.totalRevenue ? '€' + Number(data.totalRevenue).toFixed(2) : '€0';
    } catch (err) { console.error(err); }

    try {
        const res       = await fetch(`${API}/admin/parks`, { headers: authHeaders() });
        const parks     = await res.json();
        const container = document.getElementById('park-occupancies');
        if (container && Array.isArray(parks)) {
            container.innerHTML = parks.map(p =>
                '<div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-sm) 0;border-bottom:1px solid var(--color-border)">' +
                '<span>' + p.name + '</span>' +
                '<span style="color:var(--color-text-muted)">' + p.city + ' · ' + p.total_capacity + ' lugares</span>' +
                '</div>'
            ).join('');
        }
    } catch (err) { console.error(err); }
};