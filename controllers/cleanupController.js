const { Reservation, ParkingSpot } = require('../models');

exports.cleanupExpiredReservations = async () => {
    try {
        const now = new Date();

        const activeReservations = await Reservation.findAll({
            where: {
                status: ['confirmed', 'pending', 'active']
            }
        });

        const pendingExpired = [];
        const confirmedExpired = [];

        for (const r of activeReservations) {
            const dateStr = typeof r.date === 'string' ? r.date : r.date.toISOString().split('T')[0];
            const [sYear, sMonth, sDay] = dateStr.split('-').map(Number);
            const [sHour, sMin] = r.start_time.split(':').map(Number);
            const [eHour, eMin] = r.end_time.split(':').map(Number);

            const startDatetime = new Date(sYear, sMonth - 1, sDay, sHour, sMin);
            const endDatetime   = new Date(sYear, sMonth - 1, sDay, eHour, eMin);

            if (r.status === 'confirmed' || r.status === 'active') {
                if (now >= endDatetime) {
                    confirmedExpired.push(r);
                }
            } else if (r.status === 'pending') {
                // Só cancelar pendentes se a hora de INÍCIO já passou (não 30min antes)
                if (now >= startDatetime) {
                    pendingExpired.push(r);
                }
            }
        }

        const totalExpiredCount = pendingExpired.length + confirmedExpired.length;

        if (totalExpiredCount > 0) {
            console.log(`[Cleanup] Encontradas ${totalExpiredCount} reservas expiradas (${pendingExpired.length} pendentes, ${confirmedExpired.length} confirmadas).`);

            if (pendingExpired.length > 0) {
                const pendingIds = pendingExpired.map(r => r.id_reservation);
                await Reservation.update(
                    { status: 'cancelled' },
                    { where: { id_reservation: pendingIds } }
                );
            }

            if (confirmedExpired.length > 0) {
                const confirmedIds = confirmedExpired.map(r => r.id_reservation);
                await Reservation.update(
                    { status: 'completed' },
                    { where: { id_reservation: confirmedIds } }
                );
            }

            const allExpiredSpots = [...pendingExpired, ...confirmedExpired].map(r => r.id_spot);
            const uniqueSpotIds = [...new Set(allExpiredSpots)];

            await ParkingSpot.update(
                { status: 'free' },
                { where: { id_spot: uniqueSpotIds } }
            );

            console.log(`[Cleanup] Lugar(es) [${uniqueSpotIds.join(', ')}] libertado(s) com sucesso.`);
        }
    } catch (err) {
        console.error('[Cleanup] Erro ao limpar reservas expiradas:', err);
    }
};