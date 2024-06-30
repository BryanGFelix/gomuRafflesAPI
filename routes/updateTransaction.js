import createPool from '../db.js';
import express from 'express';
const router = express.Router();

const validStatuses = ['confirmed', 'pending', 'failed'];

router.post('/', async (req, res) => {
    const { status, hash } = req.body;

    if(!hash) {
        console.error('No hash provided')
    }
    if (!status || !validStatuses.includes(status)) {
        console.error('Invalid Status')
    }

    const pool = createPool();
    
    try {
        await pool.query(
            'UPDATE transactions SET status = ?, updatedAt = ? WHERE hash  = ?',
            [
                status,
                new Date(),
                hash
            ]
        );

        return res.status(201).json({ message: 'Transaction updated successfully' });
    } catch (error) {
        console.error('Error updating transaction:', error);
        return res.status(500).json({ error: 'Failed to update transaction: ' + error.message });
    }
});

export default router;
