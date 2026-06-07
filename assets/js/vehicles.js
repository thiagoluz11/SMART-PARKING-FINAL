function renderVehicleCard(V, token) {
  const card = document.createElement('div');
  card.className = 'vehicle-card';
  card.innerHTML = `
    <div style="font-weight:700">${V.brand} ${V.model}</div>
    <div>${V.license_plate}</div>
    <div>${V.color} · ${V.vehicle_type}</div>
    <button class="btn-delete-vehicle" title="Apagar Veículo">🗑️</button>
  `;

  const deleteBtn = card.querySelector('.btn-delete-vehicle');
  deleteBtn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = await View.showConfirm({
      title: 'Apagar Veículo',
      message: `Tem a certeza que deseja apagar o veículo ${V.brand} ${V.model} (${V.license_plate})?`,
      type: 'danger',
      confirmText: 'Apagar',
      cancelText: 'Cancelar'
    });
    if (confirmed) {
      try {
        const res = await fetch(`http://localhost:3000/users/me/vehicles/${V.id_vehicle}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          View.showToast('Veículo apagado com sucesso!', 'success');
          loadVehicles(token);
        } else {
          View.showPopup({
            title: 'Erro',
            message: data.error || 'Erro ao apagar veículo.',
            type: 'danger'
          });
        }
      } catch (err) {
        View.showToast('Erro ao ligar ao servidor.', 'danger');
      }
    }
  };

  return card;
}

async function loadVehicles(token) {
  const grid = document.getElementById('vehicles-list');
  grid.innerHTML = '';
  try {
    const res = await fetch('http://localhost:3000/users/me/vehicles', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const vehicles = await res.json();
    if (vehicles.length === 0) {
      grid.textContent = 'Nenhum veículo registado.';
      return;
    }
    vehicles.forEach(V => grid.appendChild(renderVehicleCard(V, token)));
  } catch (err) {
    grid.textContent = 'Erro ao ligar ao servidor.';
  }
}

function initVehicleModal(token) {
  const modal = document.getElementById('vehicle-modal');
  if (!modal) return;

  const btnAdd = document.getElementById('btn-add-vehicle');
  if (btnAdd) btnAdd.onclick = () => modal.classList.add('open');

  const btnClose = document.getElementById('btn-close-modal');
  if (btnClose) btnClose.onclick = () => modal.classList.remove('open');

  const btnCancel = document.getElementById('btn-cancel-vehicle');
  if (btnCancel) btnCancel.onclick = () => modal.classList.remove('open');

  modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('open'); };

  document.getElementById('vehicle-form').onsubmit = async (e) => {
    e.preventDefault();
    const msgEl = document.getElementById('vehicle-msg');
    msgEl.textContent = '';

    const body = {
      license_plate: document.getElementById('v-plate').value.trim(),
      brand:         document.getElementById('v-brand').value.trim(),
      model:         document.getElementById('v-model').value.trim(),
      color:         document.getElementById('v-color').value.trim() || 'Não definido',
      vehicle_type:  document.getElementById('v-type').value
    };

    try {
      const res = await fetch('http://localhost:3000/users/me/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        modal.classList.remove('open');
        document.getElementById('vehicle-form').reset();
        loadVehicles(token);
      } else {
        msgEl.style.color = 'var(--color-danger)';
        msgEl.textContent = data.error || 'Erro ao guardar.';
      }
    } catch (err) {
      msgEl.style.color = 'var(--color-danger)';
      msgEl.textContent = 'Erro ao ligar ao servidor.';
    }
  };
}