require('dotenv').config();
const { sequelize } = require('../models');

async function updateDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully!');

    // 1. Alter table to add columns if they do not exist
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('parking_parks');

    if (!tableInfo.price_per_hour) {
      console.log('Adding price_per_hour column...');
      await queryInterface.addColumn('parking_parks', 'price_per_hour', {
        type: sequelize.Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.50
      });
    } else {
      console.log('price_per_hour column already exists.');
    }

    if (!tableInfo.daily_ticket_price) {
      console.log('Adding daily_ticket_price column...');
      await queryInterface.addColumn('parking_parks', 'daily_ticket_price', {
        type: sequelize.Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    } else {
      console.log('daily_ticket_price column already exists.');
    }

    // 2. Update existing parks with their correct zone prices
    // 1: Parque Antas (Zona II: 0.60€/h, 3.60€ daily)
    // 2: Parque Santa Catarina (Zona I: 1.20€/h, no daily)
    // 3: Parque Bairro Alto (Lisboa equivalent: 1.20€/h, no daily)
    // 4: Parque Jardim do Morro (Gaia equivalent: 0.60€/h, 3.60€ daily)
    // 5: Parque Ribeira (Zona I: 1.20€/h, no daily)
    
    console.log('Updating pricing information for parks...');
    
    await sequelize.query(`
      UPDATE parking_parks 
      SET price_per_hour = 0.60, daily_ticket_price = 3.60 
      WHERE id_park IN (1, 4)
    `);

    await sequelize.query(`
      UPDATE parking_parks 
      SET price_per_hour = 1.20, daily_ticket_price = NULL 
      WHERE id_park IN (2, 3, 5)
    `);

    console.log('Database pricing updated successfully!');
  } catch (err) {
    console.error('Error during database update:', err);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

updateDatabase();
