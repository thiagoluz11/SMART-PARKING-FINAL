const testCancelReservation = (reservation, fakeNow) => {
    const now = fakeNow || new Date();
    const [rYear, rMonth, rDay] = reservation.date.split('-').map(Number);
    const [rHour, rMin] = reservation.start_time.split(':').map(Number);
    const startDatetime = new Date(rYear, rMonth - 1, rDay, rHour, rMin);

    if (now >= startDatetime) {
        return { valid: false, error: 'Não é possível cancelar uma reserva que já começou.' };
    }
    return { valid: true };
};

const testPayReservation = (reservation, fakeNow) => {
    if (reservation.status !== 'pending') {
        return { valid: false, error: 'Esta reserva não se encontra pendente de pagamento' };
    }

    const now = fakeNow || new Date();
    const [rYear, rMonth, rDay] = reservation.date.split('-').map(Number);
    const [rHour, rMin] = reservation.start_time.split(':').map(Number);
    const startDatetime = new Date(rYear, rMonth - 1, rDay, rHour, rMin);
    const limitDatetime = new Date(startDatetime.getTime() - 30 * 60 * 1000);

    if (now >= limitDatetime) {
        return { valid: false, error: 'O prazo de pagamento para esta reserva expirou (limite de 30 minutos antes do início).' };
    }
    return { valid: true };
};

const testCleanupExpired = (activeReservations, fakeNow) => {
    const now = fakeNow || new Date();
    const pendingExpired = [];
    const confirmedExpired = [];

    for (const r of activeReservations) {
        const [sYear, sMonth, sDay] = r.date.split('-').map(Number);
        const [sHour, sMin] = r.start_time.split(':').map(Number);
        const [eHour, eMin] = r.end_time.split(':').map(Number);

        const startDatetime = new Date(sYear, sMonth - 1, sDay, sHour, sMin);
        const endDatetime = new Date(sYear, sMonth - 1, sDay, eHour, eMin);

        if (r.status === 'confirmed') {
            if (now >= endDatetime) {
                confirmedExpired.push(r);
            }
        } else if (r.status === 'pending') {
            const limitDatetime = new Date(startDatetime.getTime() - 30 * 60 * 1000);
            if (now >= endDatetime || now >= limitDatetime) {
                pendingExpired.push(r);
            }
        }
    }

    return { pendingExpired, confirmedExpired };
};

// ── Run Tests ─────────────────────────────────────────────────────────────

const fakeNow = new Date('2026-06-06T12:00:00'); // Current time: 12:00

console.log('Testing Cancellation Limit (now = 12:00):');
const cancelCases = [
    {
        name: "Reserva ainda não começou (início: 13:00)",
        reservation: { date: '2026-06-06', start_time: '13:00' },
        expected: true
    },
    {
        name: "Reserva começou exatamente agora (início: 12:00)",
        reservation: { date: '2026-06-06', start_time: '12:00' },
        expected: false
    },
    {
        name: "Reserva já começou (início: 11:30)",
        reservation: { date: '2026-06-06', start_time: '11:30' },
        expected: false
    }
];

cancelCases.forEach((tc, idx) => {
    const res = testCancelReservation(tc.reservation, fakeNow);
    if (res.valid === tc.expected) {
        console.log(`  [PASS] #${idx+1}: ${tc.name}`);
    } else {
        console.error(`  [FAIL] #${idx+1}: ${tc.name} | Got valid=${res.valid}, expected=${tc.expected}`);
        process.exit(1);
    }
});

console.log('\nTesting Payment Limit (now = 12:00):');
const payCases = [
    {
        name: "Pendente, início às 13:00 (limite 12:30 > 12:00)",
        reservation: { status: 'pending', date: '2026-06-06', start_time: '13:00' },
        expected: true
    },
    {
        name: "Pendente, início às 12:30 (limite 12:00 = 12:00)",
        reservation: { status: 'pending', date: '2026-06-06', start_time: '12:30' },
        expected: false
    },
    {
        name: "Pendente, início às 12:20 (limite 11:50 < 12:00)",
        reservation: { status: 'pending', date: '2026-06-06', start_time: '12:20' },
        expected: false
    }
];

payCases.forEach((tc, idx) => {
    const res = testPayReservation(tc.reservation, fakeNow);
    if (res.valid === tc.expected) {
        console.log(`  [PASS] #${idx+1}: ${tc.name}`);
    } else {
        console.error(`  [FAIL] #${idx+1}: ${tc.name} | Got valid=${res.valid}, expected=${tc.expected}`);
        process.exit(1);
    }
});

console.log('\nTesting Cleanup logic (now = 12:00):');
const activeList = [
    { id: 1, status: 'confirmed', date: '2026-06-06', start_time: '10:00', end_time: '11:30' }, // Confirmed, expired end_time
    { id: 2, status: 'confirmed', date: '2026-06-06', start_time: '11:00', end_time: '13:00' }, // Confirmed, active
    { id: 3, status: 'pending', date: '2026-06-06', start_time: '13:00', end_time: '14:00' },   // Pending, safe (ends at 14:00, starts at 13:00 - limit is 12:30)
    { id: 4, status: 'pending', date: '2026-06-06', start_time: '12:20', end_time: '13:20' },   // Pending, expired payment limit (limit 11:50)
];

const cleanupRes = testCleanupExpired(activeList, fakeNow);
const pendingExpiredIds = cleanupRes.pendingExpired.map(r => r.id);
const confirmedExpiredIds = cleanupRes.confirmedExpired.map(r => r.id);

if (pendingExpiredIds.includes(4) && !pendingExpiredIds.includes(3) && confirmedExpiredIds.includes(1) && !confirmedExpiredIds.includes(2)) {
    console.log("  [PASS] Cleanup test passed successfully!");
} else {
    console.error("  [FAIL] Cleanup test failed!", cleanupRes);
    process.exit(1);
}

console.log('\nAll validation logic tests passed successfully!');
process.exit(0);
