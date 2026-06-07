const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Vehicle, FavoritePark, ParkingPark, Reservation } = require('../models');

const SECRET = process.env.JWT_SECRET;

// ── Middleware de autenticação JWT ────────────────────────────────────────
exports.authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"
    if (!token) return res.status(401).json({ error: 'Token em falta' });

    try {
        const decoded = jwt.verify(token, SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
};

// Registo 
exports.register = async (req, res) => {
    try {
        const { name, email, password, contact, plate } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Campos obrigatórios em falta' });
        }

        const exists = await User.findOne({ where: { email } });
        if (exists) {
            return res.status(409).json({ error: 'Email já registado' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const user = await User.create({ name, email, password_hash, contact });

        if (plate) {
            await Vehicle.create({
                license_plate: plate,
                brand: 'Unknown',
                model: 'Unknown',
                color: 'Unknown',
                vehicle_type: 'Unknown',
                id_user: user.id_user
            });
        }

        return res.status(201).json({
            message: 'Utilizador criado',
            user: { id: user.id_user, name: user.name, email: user.email }
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Login 
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Credenciais inválidas' });

        if (user.account_status === 'BLOCK') {
            return res.status(403).json({ error: 'Conta bloqueada. Contacte o administrador.' });
        }

        const token = jwt.sign(
            { id: user.id_user, role: user.role },
            SECRET,
            { expiresIn: '2h' }
        );

        // Devolve TODOS os campos necessários para o frontend
        return res.status(200).json({
            message: 'Login com sucesso',
            token,
            user: {
                id:      user.id_user,
                name:    user.name,
                email:   user.email,
                contact: user.contact,
                role:    user.role
            }
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ── Perfil: GET /users/me ─────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId, {
            attributes: ['id_user', 'name', 'email', 'contact', 'role', 'account_status']
        });
        if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });

        return res.json({
            id:      user.id_user,
            name:    user.name,
            email:   user.email,
            contact: user.contact,
            role:    user.role
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ── Perfil: PUT /users/me ─────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, contact } = req.body;

        const user = await User.findByPk(req.userId);
        if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });

        // Verificar se o novo email já está em uso por outro utilizador
        if (email && email !== user.email) {
            const exists = await User.findOne({ where: { email } });
            if (exists) return res.status(409).json({ error: 'Email já em uso' });
        }

        await user.update({
            name:    name    || user.name,
            email:   email   || user.email,
            contact: contact || user.contact
        });

        return res.json({
            message: 'Perfil atualizado',
            user: {
                id:      user.id_user,
                name:    user.name,
                email:   user.email,
                contact: user.contact,
                role:    user.role
            }
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ── Veículos: GET /users/me/vehicles ─────────────────────────────────────
exports.getMyVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll({ where: { id_user: req.userId } });
        return res.json(vehicles);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Adicionar veículo: POST /users/me/vehicles
exports.addVehicle = async (req, res) => {
    try {
        const {license_plate, brand, model, color, vehicle_type} = req.body;

        if(!license_plate || !brand || !model || !color || !vehicle_type){
            return res.status(400).json({error: 'Campo/s obrigatório(s) em falta'});
        }
        const vehicle = await Vehicle.create({
            license_plate,
            brand,
            model,
            color : color || 'Não defenida',
            vehicle_type : vehicle_type || 'Gasolina',
            id_user: req.userId
        });
        return res.status(201).json({message: 'Veículo adicionado', vehicle});  

    }catch(err){
        return res.status(500).json({error: err.message});
    }
}

// Apagar veículo: DELETE /users/me/vehicles/:id
exports.deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Utilizador não autenticado' });
        }

        const vehicle = await Vehicle.findOne({
            where: {
                id_vehicle: id,
                id_user: userId
            }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado ou sem permissão' });
        }

        // Verificar se existem reservas ativas ou pendentes para este veículo
        const activeReservations = await Reservation.findOne({
            where: {
                id_vehicle: id,
                status: ['confirmed', 'pending']
            }
        });

        if (activeReservations) {
            return res.status(400).json({ error: 'Não é possível apagar um veículo com reservas ativas ou pendentes.' });
        }

        await vehicle.destroy();
        return res.json({ message: 'Veículo apagado com sucesso' });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ── Favoritos: GET /users/me/favorites ─────────────────────────────────────
exports.getMyFavorites = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Utilizador não autenticado' });
        }

        const favorites = await FavoritePark.findAll({
            where: { id_user: userId },
            include: [{ model: ParkingPark }]
        });

        const formatted = favorites.map(f => {
            const park = f.ParkingPark;
            if (!park) return null;
            return {
                id: park.id_park,
                name: park.name,
                city: park.city,
                address: park.address,
                capacity: park.total_capacity,
                available: park.total_capacity, // keep consistency with /api/parks
                open: park.opening_time,
                close: park.closing_time,
                lat: Number(park.lat),
                lng: Number(park.lng),
                img: park.img || null,
                price_per_hour: Number(park.price_per_hour),
                daily_ticket_price: park.daily_ticket_price ? Number(park.daily_ticket_price) : null
            };
        }).filter(Boolean);

        return res.json(formatted);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Adicionar favorito: POST /users/me/favorites
exports.addFavorite = async (req, res) => {
    try {
        const userId = req.userId;
        const { id_park } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Utilizador não autenticado' });
        }
        if (!id_park) {
            return res.status(400).json({ error: 'ID do parque não fornecido' });
        }

        // Verificar se o parque existe
        const park = await ParkingPark.findByPk(id_park);
        if (!park) {
            return res.status(404).json({ error: 'Parque de estacionamento não encontrado' });
        }

        // Criar ou encontrar favorito
        const [favorite, created] = await FavoritePark.findOrCreate({
            where: { id_user: userId, id_park: Number(id_park) }
        });

        return res.status(201).json({ message: 'Parque adicionado aos favoritos', favorite });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Remover favorito: DELETE /users/me/favorites/:parkId
exports.removeFavorite = async (req, res) => {
    try {
        const userId = req.userId;
        const { parkId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Utilizador não autenticado' });
        }
        if (!parkId) {
            return res.status(400).json({ error: 'ID do parque não fornecido' });
        }

        const deletedCount = await FavoritePark.destroy({
            where: { id_user: userId, id_park: Number(parkId) }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ error: 'Parque não estava nos favoritos' });
        }

        return res.json({ message: 'Parque removido dos favoritos' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};