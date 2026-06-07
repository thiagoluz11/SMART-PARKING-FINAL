require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');

//middlewares
app.use(cors());

app.use(express.json());


//rotas
app.use('/users', require('./routes/users'));
//app.use('/vehicles', require('./routes/vehicles'));


// app.use('/api/parks', parksRoutes);// const parksRoutes = require('./routes/parks');


const port = process.env.PORT || 3000;



const parksRoutes = require('./routes/parks');

app.use('/api/parks', parksRoutes);
app.use('/reservations', require('./routes/reservations'));
app.use('/admin', require('./routes/admin'));

const { sequelize } = require('./models');
const { cleanupExpiredReservations } = require('./controllers/cleanupController');

sequelize.sync()
  .then(() => {
    console.log('MySQL Conectado e Tabelas Sincronizadas!');
    
    // Executar limpeza inicial no arranque
    cleanupExpiredReservations();

    // Agendar limpeza a cada 30 segundos
    setInterval(cleanupExpiredReservations, 30000);

    // O servidor só começa a rodar se a BD ligar com sucesso
    app.listen(port, () => {
        console.log(`Servidor  rodando na porta ${port}`);
    });
  })
  .catch(err => {
    console.error('Erro crucial ao ligar à Base de Dados:', err);
  });