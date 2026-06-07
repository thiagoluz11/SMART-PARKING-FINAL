const { where } = require('sequelize');
const { Reservation, ParkingSpot, Vehicle, Payment, ParkingPark, sequelize } = require('../models');
const { cleanupExpiredReservations } = require('./cleanupController');

// Criar Reserva com Pagamento ou Pendente
exports.createReservation = async (req, res) => {
    try{
        await cleanupExpiredReservations();
        console.log('=== RECEBIDA REQUISIÇÃO DE RESERVA ===');
        console.log('Request body:', req.body);

        const { id_spot, id_vehicle, date, start_time, end_time, payment_method, is_daily_ticket, pay_later } = req.body;

        if(!id_spot || !id_vehicle || !date || !start_time || !end_time){
            return res.status(400).json({error: 'Campos obrigatórios não preenchidos'});
        }

        // Validar se data e hora da reserva já passaram
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const currentDate = `${year}-${month}-${day}`;

        if (date < currentDate) {
            return res.status(400).json({ error: 'A data da reserva não pode ser no passado.' });
        }

        if (date === currentDate) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            const isDaily = is_daily_ticket === true || is_daily_ticket === 'true';
            if (isDaily) {
                const [eh, em] = end_time.split(':').map(Number);
                if (currentHour > eh || (currentHour === eh && currentMinute > em)) {
                    return res.status(400).json({ error: 'O período do bilhete diário para hoje já terminou.' });
                }
            } else {
                const [sh, sm] = start_time.split(':').map(Number);
                if (currentHour > sh || (currentHour === sh && currentMinute > sm)) {
                    return res.status(400).json({ error: 'A hora de início da reserva já passou.' });
                }
            }
        }

        const isPayLater = pay_later === true || pay_later === 'true';

        // Verificar se o lugar existe e está disponível
        const spot = await ParkingSpot.findByPk(id_spot);
        if(!spot) return res.status(404).json({error: 'Lugar de estacionamento não encontrado'});
        if(spot.status !== 'free') return res.status(409).json({error: 'Lugar de estacionamento já ocupado'});

        // Verificar se o parque associado existe e obter tarifas
        const park = await ParkingPark.findByPk(spot.id_park);
        if(!park) return res.status(404).json({error: 'Parque de estacionamento não encontrado'});

        // Verificar se o veículo já tem uma reserva ativa no mesmo horário
        const existing = await Reservation.findOne({
            where: {
                id_vehicle,
                date,
                status: ['confirmed', 'pending'],
            }
        });
        if(existing) return res.status(409).json({error: 'Este veículo já possui uma reserva ativa ou pendente para esta data'});

        // Calcular valor do pagamento no servidor
        let amount = 0;
        if(is_daily_ticket && park.daily_ticket_price !== null) {
            amount = Number(park.daily_ticket_price);
        } else {
            const [sh, sm] = start_time.split(':').map(Number);
            const [eh, em] = end_time.split(':').map(Number);
            const hours = (eh + em/60) - (sh + sm/60);
            if(hours <= 0) {
                return res.status(400).json({error: 'Hora de fim deve ser após a hora de início'});
            }
            amount = Number((hours * Number(park.price_per_hour)).toFixed(2));
        }

        // Usar transação para garantir atomicidade
        const transaction = await sequelize.transaction();
        try {
            const reservation = await Reservation.create({
                id_spot: Number(id_spot),
                id_vehicle: Number(id_vehicle),
                date: date,
                start_time: start_time,
                end_time: end_time,
                status: isPayLater ? 'pending' : 'confirmed'
            }, { transaction });

            const payment = await Payment.create({
                id_reservation: reservation.id_reservation,
                amount,
                payment_method: isPayLater ? null : (payment_method || 'MBWay'),
                payment_status: isPayLater ? 'pending' : 'completed',
                payment_date: isPayLater ? null : new Date()
            }, { transaction });

            // Atualizar o estado do lugar para ocupado
            await spot.update({status: 'occupied'}, { transaction });

            await transaction.commit();

            console.log('Reserva criada com sucesso! Status:', reservation.status);

            return res.status(201).json({
                message: isPayLater ? 'Reserva criada pendente de pagamento' : 'Reserva criada e paga com sucesso',
                reservation,
                payment
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    
    }catch(err){
        console.error('Erro ao criar reserva:', err);
        return res.status(500).json({error: err.message})
    }
};

// Listar as reservas do utilizador com dados do pagamento
exports.getMyReservations = async(req, res) => {
   
    try{
        await cleanupExpiredReservations();
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Utilizador não autenticado' });
        }

        // Vai buscar os veículos associados ao id_user 
        const vehicles = await Vehicle.findAll({ where: { id_user: userId } });
        
        // Mapeia os IDs dos veículos de forma segura
        const vehicleIds = vehicles.map(v => v.id_vehicle || v.id);
        
        // Se o utilizador não tiver veículos, retorna uma lista vazia de reservas imediatamente
        if (vehicleIds.length === 0) {
            return res.json([]);
        }

        const reservations = await Reservation.findAll({
            where: { id_vehicle: vehicleIds },
            include: [
                { model: ParkingSpot },
                { model: Payment }
            ]
        });
        return res.json(reservations);
   
    }catch(err){
        console.log("\n❌ ====== ERRO DETECTADO NO BACKEND ======");
        console.log("Mensagem:", err.message);
        console.log("Stack Trace:", err);
        console.log("===========================================\n");

        return res.status(500).json({ error: err.message });
    }

};

// Cancelar Reserva
exports.cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Utilizador não autenticado' });
        }

        // Encontrar a reserva
        const reservation = await Reservation.findByPk(id, {
            include: [
                {
                    model: Vehicle,
                    where: { id_user: userId }
                },
                { model: ParkingSpot }
            ]
        });

        if (!reservation) {
            return res.status(404).json({ error: 'Reserva não encontrada ou sem permissão' });
        }

        if (reservation.status === 'cancelled') {
            return res.status(400).json({ error: 'Reserva já se encontra cancelada' });
        }

        // Verificar se o horário da reserva já começou
        const now = new Date();
        const [rYear, rMonth, rDay] = reservation.date.split('-').map(Number);
        const [rHour, rMin] = reservation.start_time.split(':').map(Number);
        const startDatetime = new Date(rYear, rMonth - 1, rDay, rHour, rMin);

        if (now >= startDatetime) {
            return res.status(400).json({ error: 'Não é possível cancelar uma reserva que já começou.' });
        }

        // Atualizar o estado da reserva para 'cancelled'
        await reservation.update({ status: 'cancelled' });

        // Atualizar o estado do lugar associado para 'free'
        if (reservation.ParkingSpot) {
            await reservation.ParkingSpot.update({ status: 'free' });
        }

        return res.json({ message: 'Reserva cancelada com sucesso', reservation });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Pagar Reserva Pendente
exports.payReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_method } = req.body;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Utilizador não autenticado' });
        }

        // Localizar a reserva e verificar a posse do veículo correspondente
        const reservation = await Reservation.findByPk(id, {
            include: [
                {
                    model: Vehicle,
                    where: { id_user: userId }
                },
                { model: Payment }
            ]
        });

        if (!reservation) {
            return res.status(404).json({ error: 'Reserva não encontrada ou sem permissão' });
        }

        if (reservation.status !== 'pending') {
            return res.status(400).json({ error: 'Esta reserva não se encontra pendente de pagamento' });
        }

        // Verificar se o prazo limite de pagamento já passou (30 minutos antes do início)
        const now = new Date();
        const [rYear, rMonth, rDay] = reservation.date.split('-').map(Number);
        const [rHour, rMin] = reservation.start_time.split(':').map(Number);
        const startDatetime = new Date(rYear, rMonth - 1, rDay, rHour, rMin);
        const limitDatetime = new Date(startDatetime.getTime() - 30 * 60 * 1000);

        if (now >= limitDatetime) {
            return res.status(400).json({ error: 'O prazo de pagamento para esta reserva expirou (limite de 30 minutos antes do início).' });
        }

        const payment = reservation.Payment;
        if (!payment || payment.payment_status !== 'pending') {
            return res.status(400).json({ error: 'Pagamento não se encontra no estado pendente' });
        }

        // Usar transação para garantir atomicidade
        const transaction = await sequelize.transaction();
        try {
            await reservation.update({ status: 'confirmed' }, { transaction });
            await payment.update({
                payment_status: 'completed',
                payment_method: payment_method || 'MBWay',
                payment_date: new Date()
            }, { transaction });

            await transaction.commit();

            return res.json({ message: 'Pagamento efetuado e reserva validada com sucesso', reservation });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};