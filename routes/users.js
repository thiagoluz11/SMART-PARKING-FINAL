const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usercontroller');

//endpoints
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', ctrl.authMiddleware, ctrl.getProfile);
router.get('/me/vehicles', ctrl.authMiddleware, ctrl.getMyVehicles);
router.put('/me', ctrl.authMiddleware, ctrl.updateProfile);
router.post('/me/vehicles', ctrl.authMiddleware, ctrl.addVehicle);
router.delete('/me/vehicles/:id', ctrl.authMiddleware, ctrl.deleteVehicle);
router.get('/me/favorites', ctrl.authMiddleware, ctrl.getMyFavorites);
router.post('/me/favorites', ctrl.authMiddleware, ctrl.addFavorite);
router.delete('/me/favorites/:parkId', ctrl.authMiddleware, ctrl.removeFavorite);

module.exports = router;