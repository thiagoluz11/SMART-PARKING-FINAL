const { faker } = require('@faker-js/faker');
const { sequelize, User, Vehicle } = require('../models/index'); // Importa a instância do Sequelize e os modelos User e Vehicle



async function semear() {
    try {
        await sequelize.authenticate();
        console.log("Conexão estabelecida!");

        await sequelize.sync({ force: true });
        console.log("Tabelas recriadas.");

        for (let i = 0; i < 200; i++) {
            const novoUtilizador = await User.create({
                name:          faker.person.fullName(),
                email:         faker.internet.email(),
                password_hash: '123456'
            });

            await Vehicle.create({
                license_plate: faker.vehicle.vrm(),
                brand:         faker.vehicle.manufacturer(),
                model:         faker.vehicle.model(),
                color:         faker.color.human(),
                vehicle_type:  'Ligeiro',
                id_user:       novoUtilizador.id_user // <-- usa a PK do utilizador criado para a FK do veículo
            });
        }

        console.log("Seeding concluído!");
    } catch (error) {
        console.error("Erro:", error);
    } finally {
        await sequelize.close();
    }
}

semear();