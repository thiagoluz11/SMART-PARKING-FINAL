const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reservationController');
const {authMiddleware} = require('../controllers/usercontroller');

router.post('/', authMiddleware, ctrl.createReservation);
router.get('/me', authMiddleware, ctrl.getMyReservations);
router.put('/:id/cancel', authMiddleware, ctrl.cancelReservation);
router.put('/:id/pay', authMiddleware, ctrl.payReservation);

module.exports = router;
