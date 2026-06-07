const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../controllers/usercontroller');
const { User, Vehicle, Reservation, ParkingPark, ParkingSpot, Payment } = require('../models');

// Middleware: só ADMIN
const adminOnly = (req, res, next) => {
    if (req.userRole?.toUpperCase() !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
};

// GET /admin/stats
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { sequelize } = require('../models');
        const { QueryTypes } = require('sequelize');

        const totalUsers        = await User.count();
        const totalReservations = await Reservation.count();
        const totalParks        = await ParkingPark.count();
        const totalRevenue      = await Payment.sum('amount') || 0;

        const reservationsByMonth = await sequelize.query(`
            SELECT DATE_FORMAT(date, '%Y-%m') as month, COUNT(*) as total
            FROM reservations
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 MONTH)
            GROUP BY month ORDER BY month ASC
        `, { type: QueryTypes.SELECT });

        const revenueByMonth = await sequelize.query(`
            SELECT DATE_FORMAT(r.date, '%Y-%m') as month, COALESCE(SUM(p.amount), 0) as total
            FROM reservations r
            LEFT JOIN payments p ON p.id_reservation = r.id_reservation
            WHERE r.date >= DATE_SUB(CURDATE(), INTERVAL 7 MONTH)
            GROUP BY month ORDER BY month ASC
        `, { type: QueryTypes.SELECT });

        const parkOccupancy = await sequelize.query(`
            SELECT pp.id_park, pp.name, pp.city, pp.total_capacity,
                   COUNT(CASE WHEN ps.status = 'occupied' THEN 1 END) as occupied
            FROM parking_parks pp
            LEFT JOIN parking_spots ps ON ps.id_park = pp.id_park
            GROUP BY pp.id_park
        `, { type: QueryTypes.SELECT });

        res.json({ totalUsers, totalReservations, totalParks, totalRevenue, reservationsByMonth, revenueByMonth, parkOccupancy });
    } catch (err) {
        console.error('ADMIN /stats:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /admin/users
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id_user', 'name', 'email', 'contact', 'role', 'account_status', 'createdAt']
        });
        res.json(users);
    } catch (err) {
        console.error('ADMIN /users:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /admin/users/:id/status
router.put('/users/:id/status', authMiddleware, adminOnly, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
        await user.update({ account_status: req.body.account_status });
        res.json({ message: 'Estado atualizado', user });
    } catch (err) {
        console.error('ADMIN /users/:id/status:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /admin/users/:id/role
router.put('/users/:id/role', authMiddleware, adminOnly, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
        await user.update({ role: req.body.role });
        res.json({ message: 'Role atualizado', user });
    } catch (err) {
        console.error('ADMIN /users/:id/role:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /admin/users/:id
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
        await user.destroy();
        res.json({ message: 'Utilizador apagado com sucesso' });
    } catch (err) {
        console.error('ADMIN DELETE /users/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /admin/reservations
router.get('/reservations', authMiddleware, adminOnly, async (req, res) => {
    try {
        const reservations = await Reservation.findAll({
            include: [
                {
                    model: ParkingSpot,
                    attributes: ['id_spot', 'number'],
                    include: [{ model: ParkingPark, attributes: ['id_park', 'name', 'city'] }]
                },
                {
                    model: Vehicle,
                    attributes: ['id_vehicle', 'license_plate', 'id_user'],
                    include: [{ model: User, attributes: ['name', 'email'] }]
                }
            ],
            order: [['id_reservation', 'DESC']]
        });
        res.json(reservations);
    } catch (err) {
        console.error('ADMIN /reservations:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /admin/reservations/:id/status
router.put('/reservations/:id/status', authMiddleware, adminOnly, async (req, res) => {
    try {
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ error: 'Reserva não encontrada' });
        await reservation.update({ status: req.body.status });
        res.json({ message: 'Estado atualizado' });
    } catch (err) {
        console.error('ADMIN /reservations/:id/status:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /admin/parks
router.get('/parks', authMiddleware, adminOnly, async (req, res) => {
    try {
        const parks = await ParkingPark.findAll({ raw: true });
        res.json(parks);
    } catch (err) {
        console.error('ADMIN /parks:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /admin/parks — cria parque + lugares automaticamente
router.post('/parks', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { name, address, city, total_capacity, opening_time, closing_time, lat, lng, img, price_per_hour, daily_ticket_price } = req.body;
        const park = await ParkingPark.create({ name, address, city, total_capacity, opening_time, closing_time, lat, lng, img, price_per_hour, daily_ticket_price });

        // Criar lugares automaticamente
        const spots = [];
        for (let i = 1; i <= total_capacity; i++) {
            spots.push({ number: i, status: 'free', id_park: park.id_park });
        }
        await ParkingSpot.bulkCreate(spots);

        res.status(201).json({ message: `Parque criado com ${total_capacity} lugares`, park });
    } catch (err) {
        console.error('ADMIN POST /parks:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /admin/parks/:id
router.put('/parks/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const park = await ParkingPark.findByPk(req.params.id);
        if (!park) return res.status(404).json({ error: 'Parque não encontrado' });
        await park.update(req.body);
        res.json({ message: 'Parque atualizado', park });
    } catch (err) {
        console.error('ADMIN PUT /parks/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /admin/parks/:id
router.delete('/parks/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const park = await ParkingPark.findByPk(req.params.id);
        if (!park) return res.status(404).json({ error: 'Parque não encontrado' });
        await ParkingSpot.destroy({ where: { id_park: req.params.id } });
        await park.destroy();
        res.json({ message: 'Parque apagado' });
    } catch (err) {
        console.error('ADMIN DELETE /parks/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;