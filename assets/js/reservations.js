window.openReservationModal = openReservationModal;

async function openReservationModal(parkId){
  const park = parks.find(p => p.id === Number(parkId));
  if(!park) return;

  document.getElementById('reserve-park-id').value = park.id;
  document.getElementById('reserve-park-name').textContent = park.name;
  
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  const dateInput = document.getElementById('reserve-date');
  if (dateInput) {
    dateInput.value = todayStr;
    dateInput.min = todayStr;
  }

  // Definir min/max dos inputs de hora com base no horário real do parque
  const openTime  = (park.open  || '').substring(0, 5);
  const closeTime = (park.close || '').substring(0, 5);
  const startInput = document.getElementById('reserve-start');
  const endInput   = document.getElementById('reserve-end');
  if (startInput && openTime)  { startInput.min = openTime;  }
  if (startInput && closeTime) { startInput.max = closeTime; }
  if (endInput   && openTime)  { endInput.min   = openTime;  }
  if (endInput   && closeTime) { endInput.max   = closeTime; }

  // Limpar a seleção anterior
  document.getElementById('selected-spot-id').value = '';
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // Apanhar os veiculos do utilizador
  const vehicleSelect = document.getElementById('reserve-vehicle');
  vehicleSelect.innerHTML= `<option value="">A carregar veiculos...</option>`;

  try{
    const vehicleRes = await fetch (`http://localhost:3000/users/me/vehicles`,{
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if(vehicleRes.ok){
      const vehicles = await vehicleRes.json();
      if(vehicles.length > 0){
        vehicleSelect.innerHTML = vehicles.map(v => `<option value="${v.id_vehicle || v.id}">${v.brand} ${v.model} (${v.license_plate})"</option>`).join('');

      }else{
        vehicleSelect.innerHTML = '<option value="none">Nenhum veículo registado</option>';
      }
    }
  }catch(err){
    console.error('Erro ao buscar veículos:', err)
    vehicleSelect.innerHTML = '<option value="none">Erro de ligação</option>';
  }

  // Carregar lugares deste parque especifico para o mapa visual 
  const spotsGrid = document.getElementById('spots-grid');
  spotsGrid.innerHTML = '<div style="grid-column: span 5; text-align: center;">A carregar mapa...</div>';

  try{
    const spotRes = await fetch(`http://localhost:3000/api/parks/${park.id}/spots`);
    if(spotRes.ok){
      const spots = await spotRes.json()
      spotsGrid.innerHTML = '' // Limpar o indicador de loading

      spots.forEach(spot => {
        const cell = document.createElement('div');
        cell.className = `spot-cell ${spot.status !== 'free' ? 'occupied' : ''}`;
        cell.textContent = spot.number;
        cell.dataset.id = spot.id_spot || spot.id;

        // Evento do clique para selecionar o spot
        if(spot.status === 'free'){
          cell.addEventListener('click', () => {
            document.querySelectorAll('.spot-cell.selected').forEach(c=> c.classList.remove('selected')); //Desmarcar o lugar anteriormente selecionado
            // Marcar o novo
            cell.classList.add('selected');

            document.getElementById('selected-spot-id').value = cell.dataset.id;
          });

        }
        spotsGrid.appendChild(cell);
      });
    
    }else{
      spotsGrid.innerHTML = '<div style="grid-column: span 5; text-align: center; color: red;">Erro ao obter lugares.</div>';
    }
  }catch(err){
    console.error('Erro ao buscar lugares:', err);
    spotsGrid.innerHTML = '<div style="grid-column: span 5; text-align: center; color: red;">Erro de rede.</div>';
  }

  // Configurar preço e opções de tarifa no modal
  const hourlyRateEl = document.getElementById('modal-hourly-rate');
  const dailyRateEl = document.getElementById('modal-daily-rate');
  const dailyWrapper = document.getElementById('daily-option-wrapper');
  const pricingContainer = document.getElementById('pricing-options-container');

  if (hourlyRateEl && dailyRateEl && dailyWrapper && pricingContainer) {
    hourlyRateEl.textContent = `€${Number(park.price_per_hour).toFixed(2)}`;
    if (park.daily_ticket_price !== null && park.daily_ticket_price !== undefined) {
      dailyRateEl.textContent = `€${Number(park.daily_ticket_price).toFixed(2)}`;
      dailyWrapper.style.display = 'flex';
    } else {
      dailyWrapper.style.display = 'none';
    }
    pricingContainer.style.display = 'block';
  }

  // Reset para tarifa horária e disparar evento para atualizar campos/preço
  const hourlyRadio = document.getElementById('fare-hourly');
  if (hourlyRadio) {
    hourlyRadio.checked = true;
    hourlyRadio.dispatchEvent(new Event('change'));
  }

  // Reset do método de pagamento para MBWay
  const mbwayCard = document.querySelector('.payment-method-card[data-method="MBWay"]');
  if (mbwayCard) {
    mbwayCard.click();
  }

  document.getElementById('modal-reserve').classList.add('active');

}

let payLater = false;

// Evento de submissão do formulário de reserva com pagamento ou pendente
document.getElementById('reserve-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const token = localStorage.getItem('token');
  const date = document.getElementById('reserve-date').value;
  const start_time = document.getElementById('reserve-start').value;
  const end_time = document.getElementById('reserve-end').value;
  const id_vehicle = document.getElementById('reserve-vehicle').value;
  const id_spot = document.getElementById('selected-spot-id').value; // Usar o ID do lugar selecionado manualmente!
  const payment_method = document.getElementById('payment-method-select').value;
  const is_daily_ticket = document.getElementById('fare-daily')?.checked || false;
  
  if (!date || !start_time || !end_time) {
    View.showToast('Por favor, preencha todos os campos', 'error');
    return;
  }

  // Validação de data e hora passadas no frontend
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (date < todayStr) {
    View.showToast('Não é possível realizar reservas para datas passadas.', 'error');
    return;
  }

  if (date === todayStr) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (is_daily_ticket) {
      const [eh, em] = end_time.split(':').map(Number);
      if (currentHour > eh || (currentHour === eh && currentMinute > em)) {
        View.showToast('O período do bilhete diário para hoje já terminou.', 'error');
        return;
      }
    } else {
      const [sh, sm] = start_time.split(':').map(Number);
      if (currentHour > sh || (currentHour === sh && currentMinute > sm)) {
        View.showToast('Não é possível realizar reservas para um horário que já passou.', 'error');
        return;
      }
    }
  }

  if (!id_vehicle || id_vehicle === 'none' || id_vehicle === 'Nenhum veículo') {
    View.showToast('Por favor, selecione um veículo válido', 'error');
    return;
  }

  if (!id_spot) {
    View.showToast('Por favor, selecione um lugar livre no mapa', 'error');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id_spot,
        id_vehicle,
        date,
        start_time,
        end_time,
        payment_method,
        is_daily_ticket,
        pay_later: payLater
      })
    });

    const data = await res.json();

    if (res.ok) {
      if (payLater) {
        View.showToast('Reserva efetuada! Pagamento pendente.', 'info');
      } else {
        View.showToast('Reserva e pagamento confirmados com sucesso!');
      }
      document.getElementById('modal-reserve').classList.remove('active');
      
      //  Recarregar a página para atualizar o estado dos lugares
      setTimeout(() => { window.location.reload(); }, 1200);
    } else {
      View.showToast(data.error || 'Erro ao criar reserva', 'error');
    }
  } catch (err) {
    View.showToast('Erro ao criar reserva', 'error');
  }
});

// Fechar o modal ao clicar no botão de fechar ou fora dele, e inicializar listeners de pagamentos
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal-reserve');
  if (!modal) return;

  // Lógica dos botões Pagar Agora / Pagar Depois
  document.getElementById('btn-pay-later')?.addEventListener('click', () => {
    payLater = true;
    document.getElementById('reserve-form')?.requestSubmit();
  });

  document.getElementById('btn-pay-now')?.addEventListener('click', () => {
    payLater = false;
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.modal-close')) {
      modal.classList.remove('active');
    }
  });

  // 1. Toggle dos campos de pagamento com suporte para cards premium
  const payMethodSelect = document.getElementById('payment-method-select');
  const fieldMbway = document.getElementById('pay-field-mbway');
  const fieldCartao = document.getElementById('pay-field-cartao');
  const fieldMultibanco = document.getElementById('pay-field-multibanco');

  const updatePaymentFields = (method) => {
    if (fieldMbway) fieldMbway.style.display = method === 'MBWay' ? 'block' : 'none';
    if (fieldCartao) fieldCartao.style.display = method === 'Cartao' ? 'block' : 'none';
    if (fieldMultibanco) fieldMultibanco.style.display = method === 'Multibanco' ? 'block' : 'none';
  };

  payMethodSelect?.addEventListener('change', () => {
    updatePaymentFields(payMethodSelect.value);
  });

  const cards = document.querySelectorAll('.payment-method-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => {
        c.classList.remove('active');
        c.style.borderColor = 'var(--color-border)';
        c.style.background = 'var(--color-surface)';
      });
      card.classList.add('active');
      card.style.borderColor = 'var(--color-accent)';
      card.style.background = 'var(--color-surface-2)';

      if (payMethodSelect) {
        payMethodSelect.value = card.dataset.method;
        payMethodSelect.dispatchEvent(new Event('change'));
      }
    });
  });

  // 2. Toggle dos campos de tempo ao escolher diária
  const fareHourly = document.getElementById('fare-hourly');
  const fareDaily = document.getElementById('fare-daily');
  const endTimeField = document.getElementById('end-time-field');
  const endTimeInput = document.getElementById('reserve-end');
  const startTimeInput = document.getElementById('reserve-start');

  const handleFareTypeChange = () => {
    const isDaily = fareDaily?.checked;
    if (isDaily) {
      if (endTimeField) endTimeField.style.display = 'none';
      if (endTimeInput) {
        endTimeInput.value = '22:00';
        endTimeInput.required = false;
      }
      if (startTimeInput) {
        startTimeInput.value = '07:00';
        startTimeInput.disabled = true;
      }
    } else {
      if (endTimeField) endTimeField.style.display = 'block';
      if (endTimeInput) {
        endTimeInput.required = true;
      }
      if (startTimeInput) {
        startTimeInput.disabled = false;
      }
    }
    updateLivePrice();
  };

  fareHourly?.addEventListener('change', handleFareTypeChange);
  fareDaily?.addEventListener('change', handleFareTypeChange);

  // 3. Atualizar preço ao mudar inputs
  startTimeInput?.addEventListener('input', updateLivePrice);
  endTimeInput?.addEventListener('input', updateLivePrice);

  function updateLivePrice() {
    const parkId = document.getElementById('reserve-park-id')?.value;
    if (!parkId || !parks) return;

    const park = parks.find(p => p.id === Number(parkId));
    if (!park) return;

    const amountEl = document.getElementById('reserve-total-amount');
    if (!amountEl) return;

    const isDaily = fareDaily?.checked;
    if (isDaily && park.daily_ticket_price !== null && park.daily_ticket_price !== undefined) {
      amountEl.textContent = `€${Number(park.daily_ticket_price).toFixed(2)}`;
      return;
    }

    const startVal = startTimeInput?.value;
    const endVal = endTimeInput?.value;

    if (!startVal || !endVal) {
      amountEl.textContent = '€0.00';
      return;
    }

    const [sh, sm] = startVal.split(':').map(Number);
    const [eh, em] = endVal.split(':').map(Number);
    const hours = (eh + em/60) - (sh + sm/60);

    if (hours <= 0) {
      amountEl.textContent = '€0.00';
      return;
    }

    const price = hours * Number(park.price_per_hour || 1.50);
    amountEl.textContent = `€${price.toFixed(2)}`;
  }

  // Expor a função updateLivePrice globalmente
  window.updateLivePrice = updateLivePrice;
});