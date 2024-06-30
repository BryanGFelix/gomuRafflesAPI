import createPool from '../db.js';
import express from 'express';
const router = express.Router();

router.post('/', async (req, res) => {
    const { hash, type, address, raffleID, amount } = req.body;

    const amountInTransaction = amount || 0;

    const pool = createPool();

    try {
        await pool.query(
            'INSERT INTO transactions (hash, type, status, address, raffleID, amount, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                hash,
                type,
                'pending',
                address,
                raffleID,
                amountInTransaction,
                new Date()
            ]
        );
        return res.status(201).json({ message: 'Transaction stored successfully' });
    } catch (error) {
        console.error('Error storing transaction:', error);
        return res.status(500).json({ error: 'Failed to store transaction: ' + error.message });
    }
});

export default router;
