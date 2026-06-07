/**
 * MODEL — Smart Parking
 * Responsável pelos dados e lógica de negócio (frontend mock)
 *
 */

const Model = (() => {

  // ── Mock Data ──────────────────────────────────────────────────────────
  const _data = {
    parks: [
      { id: 1, name: 'Parque das Antas', city: 'Porto', address: 'Avenida dos Aliados, Porto', capacity: 80, available: 32, img: 'https://imobiliario.publico.pt/media/images/CF023_00_ALAMEDA_NOITE_004_RGB.original.jpg', open: '07:00', close: '22:00', lat: 41.163, lng: -8.583 },
      { id: 2, name: 'Parque Centro',    city: 'Porto', address: 'Rua de Santa Catarina, Porto', capacity: 60, available: 27, img: 'https://www.city-guide-porto.com/_bibli/pages_images/28/rue-sainte-catherine-commercante-porto.jpg', open: '07:00', close: '22:00', lat: 41.148, lng: -8.610 },
      { id: 3, name: 'Parque Bairro Alto', city: 'Lisboa', address: 'Rua do Bairro Alto', capacity: 60, available: 6,  img: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0a/dd/9b/18/elevator-da-bica.jpg?w=500&h=500&s=1', open: '07:00', close: '22:00', lat: 41.155, lng: -8.602 },
      { id: 4, name: 'Parque Vila Nova de Gaia', city: 'Porto', address: 'Avenida de Gaia', capacity: 60, available: 42, img: 'https://www.nacionalidadeportuguesa.com.br/wp-content/uploads/2020/09/Capa-Blog-1.jpg', open: '07:00', close: '22:00', lat: 41.128, lng: -8.600 },
      { id: 5, name: 'Parque Boavista', city: 'Porto', address: 'Via Norte, Matosinhos', capacity: 60, available: 27, img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRV1Sq_3Jx27x_jOQl7u4MHaJ32cHm6W_ClIg&s', open: '08:00', close: '23:00', lat: 41.189, lng: -8.697 },
      { id: 6, name: 'Parque NortShopping', city: 'Matosinhos', address: 'NortShopping, Matosinhos', capacity: 60, available: 13, img: 'https://www.nit.pt/wp-content/uploads/2019/06/fc6945645b5ec9a7a2f3abadac824498.jpg', open: '08:00', close: '23:00', lat: 41.193, lng: -8.700 },
    ],

    users: [
      { id: 1, name: 'João Silva',    email: 'joao@email.com',    role: 'user',  status: 'active',   contact: '912000001' },
      { id: 2, name: 'Ana Costa',     email: 'ana@email.com',     role: 'user',  status: 'blocked',  contact: '912000002' },
      { id: 3, name: 'Pedro Lopes',   email: 'pedro@email.com',   role: 'user',  status: 'active',   contact: '912000003' },
      { id: 4, name: 'Maria Ferreira',email: 'maria@email.com',   role: 'admin', status: 'active',   contact: '912000004' },
    ],

    reservations: [
      { id: 1, park: 'Parque NortShopping', spot: 'A06', user: 'João Silva',   date: '2026-04-20', start: '09:00', end: '12:00', status: 'confirmed', amount: 4.50 },
      { id: 2, park: 'Parque das Antas',    spot: 'B03', user: 'Pedro Lopes',  date: '2026-04-20', start: '14:00', end: '16:00', status: 'pending',   amount: 3.00 },
      { id: 3, park: 'Parque Centro',       spot: 'C11', user: 'Ana Costa',    date: '2026-04-19', start: '10:00', end: '11:00', status: 'completed', amount: 1.50 },
      { id: 4, park: 'Parque Bairro Alto',  spot: 'A02', user: 'João Silva',   date: '2026-04-21', start: '08:00', end: '18:00', status: 'confirmed', amount: 15.00 },
    ],

    vehicles: [
      { id: 1, userId: 1, plate: 'AA-00-BB', brand: 'BMW',     model: 'M2',       color: 'Preto',   type: 'Ligeiro' },
      { id: 2, userId: 1, plate: 'CC-11-DD', brand: 'Corvette',model: 'C7',       color: 'Cinzento',type: 'Ligeiro' },
    ],

    stats: {
      totalReservations: 2547,
      totalUsers: 1203,
      activeParks: 6,
      totalRevenue: 8921,
      monthlyGrowth: { reservations: 12, users: 8, revenue: 15 },
    },

    testimonials: [
      { id: 1, name: 'João Silva',    rating: 5, text: 'Muito fácil de usar! Consigo reservar em segundos e saber sempre que tempo é o processo de estacionamento.' },
      { id: 2, name: 'Patrícia Lopes',rating: 5, text: 'Muito fácil de usar! Consigo reservar em segundos e saber sempre que tempo é o processo de estacionamento.' },
      { id: 3, name: 'Catarina Silva',rating: 5, text: 'Muito fácil de usar! Consigo reservar em segundos e saber sempre que tempo é o processo de estacionamento.' },
    ],

    // Auth state (em produção: JWT no localStorage)
    currentUser: null,
  };

  // ── Parks ────────────────────────────────────────────────────────────────
  const getParks = () => [..._data.parks];

  const getParkById = (id) => _data.parks.find(p => p.id === Number(id));

  const searchParks = (query) => {
    const q = query.toLowerCase();
    return _data.parks.filter(p =>
      p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)
    );
  };

  const getParkOccupancy = (park) =>
    Math.round(((park.capacity - park.available) / park.capacity) * 100);

  // ── Users ────────────────────────────────────────────────────────────────
  const getUsers = () => [..._data.users];

  const getUserById = (id) => _data.users.find(u => u.id === Number(id));

  const updateUserStatus = (id, status) => {
    const user = _data.users.find(u => u.id === Number(id));
    if (user) { user.status = status; return true; }
    return false;
  };

  // ── Reservations ─────────────────────────────────────────────────────────
  const getReservations = () => [..._data.reservations];

  const addReservation = (reservation) => {
    const newRes = { id: _data.reservations.length + 1, ...reservation, status: 'pending' };
    _data.reservations.push(newRes);
    return newRes;
  };

  const cancelReservation = (id) => {
    const res = _data.reservations.find(r => r.id === Number(id));
    if (res && res.status !== 'completed') { res.status = 'cancelled'; return true; }
    return false;
  };

  // ── Vehicles ────────────────────────────────────────────────────────────
  const getVehicles = () => [..._data.vehicles];

  const getVehiclesByUser = (userId) =>
    _data.vehicles.filter(v => v.userId === Number(userId));

  const addVehicle = (vehicle) => {
    const newV = { id: _data.vehicles.length + 1, ...vehicle };
    _data.vehicles.push(newV);
    return newV;
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const getStats = () => ({ ..._data.stats });

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = (email, password) => {
    // Mock auth — em produção: POST /api/auth/login
    const user = _data.users.find(u => u.email === email);
    if (user && password.length >= 6) {
      _data.currentUser = { ...user };
      localStorage.setItem('user', JSON.stringify(_data.currentUser));
      return { success: true, user: _data.currentUser };
    }
    return { success: false, error: 'Credenciais inválidas.' };
  };

  const register = (userData) => {
    const exists = _data.users.find(u => u.email === userData.email);
    if (exists) return { success: false, error: 'Email já registado.' };
    const newUser = { id: _data.users.length + 1, role: 'user', status: 'active', ...userData };
    _data.users.push(newUser);
    _data.currentUser = { ...newUser };
    localStorage.setItem('user', JSON.stringify(_data.currentUser));
    return { success: true, user: newUser };
  };

  const logout = () => {
    _data.currentUser = null;
    localStorage.removeItem('user');
  };

  const getCurrentUser = () => {
    if (_data.currentUser) return _data.currentUser;
    const stored = localStorage.getItem('user');
    if (stored) {
      _data.currentUser = JSON.parse(stored);
      return _data.currentUser;
    }
    return null;
  };

  const isAdmin = () => {
    const user = getCurrentUser();
    return user && user.role?.toUpperCase() === 'ADMIN';
  };

  // ── Testimonials ──────────────────────────────────────────────────────────
  const getTestimonials = () => [..._data.testimonials];

  return {
    getParks, getParkById, searchParks, getParkOccupancy,
    getUsers, getUserById, updateUserStatus,
    getReservations, addReservation, cancelReservation,
    getVehicles, getVehiclesByUser, addVehicle,
    getStats,
    login, register, logout, getCurrentUser, isAdmin,
    getTestimonials,
  };

})();

window.Model = Model;