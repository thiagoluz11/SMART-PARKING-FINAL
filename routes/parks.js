const express = require('express');
const router = express.Router();

const { ParkingPark } = require('../models');

router.get('/', async (req, res) => {

  try {

    const parks = await ParkingPark.findAll({
      raw: true
    });

    const formatted = parks.map(park => ({

      id: park.id_park,

      name: park.name,

      city: park.city,

      address: park.address,

      capacity: park.total_capacity,

      available: park.total_capacity,

      open: park.opening_time,

      close: park.closing_time,

      lat: Number(park.lat),

      lng: Number(park.lng),
      img: park.img || null,
      price_per_hour: Number(park.price_per_hour),
      daily_ticket_price: park.daily_ticket_price ? Number(park.daily_ticket_price) : null
      

    }));

    res.json(formatted);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Erro ao buscar parques'
    });

  }

});

router.get('/:id/spots', async(req, res) => {
  try{
    const { cleanupExpiredReservations } = require('../controllers/cleanupController');
    await cleanupExpiredReservations();

    const {ParkingSpot} = require('../models');
    const spots = await ParkingSpot.findAll({
      where:{id_park: req.params.id},
      raw: true
    });
    res.json(spots);

  }catch(err){
    res.status(500).json({error: err.message})
  }
});

module.exports = router;