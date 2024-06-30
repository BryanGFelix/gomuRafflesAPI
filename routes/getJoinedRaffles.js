import createPool from '../db.js';
import express from 'express';

const router = express.Router();

const PAGE_SIZE = 12;

router.post('/', async (req, res) => {
    const { user, page = 1 } = req.body;

    if (!user) {
        return res.status(400).json({ error: 'Missing participant parameter' });
    }

    if (page < 1) {
        return res.status(400).json({ error: 'Invalid page parameter' });
    }

    const pool = createPool();
    const offset = (page - 1) * PAGE_SIZE;

    try {
        const [joinedRaffles] = await pool.query(
            `
            SELECT 
            r.id,
            r.title,
            r.owner,
            r.ticketPrice,
            r.allowDuplicates,
            r.maxTotalTickets,
            r.maxEntries,
            r.numWinners,
            r.isActive,
            r.duration,
            r.timeStarted,
            r.wasCancelled,
            IFNULL(SUM(p.numTickets), 0) AS totalTickets,
            IFNULL(SUM(CASE WHEN p.address = ? THEN p.numTickets ELSE 0 END), 0) AS userTickets
            FROM 
            raffles r
            LEFT JOIN 
            participants p ON r.id = p.raffleID
            GROUP BY 
            r.id
            HAVING
            userTickets > 0
            LIMIT ?
            OFFSET ?
            `,
            [user, PAGE_SIZE, offset],
        );

        // Count total number of joined raffles for the user
        const [[{ total }]] = await pool.query(
            `
            SELECT 
            COUNT(DISTINCT r.id) AS total
            FROM 
            raffles r
            LEFT JOIN 
            participants p ON r.id = p.raffleID
            WHERE 
            p.address = ?
            `,
            [user]
        );

        return res.status(200).json({
            page,
            total,
            totalPages: Math.ceil(total / PAGE_SIZE),
            data: joinedRaffles
        });
    } catch (error) {
        console.error('Error retrieving joined raffles:', error);
        return res.status(500).json({ error: 'Failed to retrieve joined raffles: ' + error.message });
    }
});

export default router;
