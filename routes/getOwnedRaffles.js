import createPool from '../db.js';
import express from 'express';

const router = express.Router();

const PAGE_SIZE = 12;

router.post('/', async (req, res) => {
    const { owner, page = 1} = req.body;

    if (!owner) {
        return res.status(400).json({ error: 'Missing owner parameter' });
    }

    if (page < 1) {
        return res.status(400).json({ error: 'Invalid page parameter' });
    }

    const pool = createPool();
    const offset = (page - 1) * PAGE_SIZE;

    try {
        const [ownedRaffles] = await pool.query(
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
            IFNULL(SUM(p.numTickets), 0) AS totalTickets
            FROM 
            raffles r
            LEFT JOIN 
            participants p ON r.id = p.raffleID
            WHERE 
            r.owner = ?
            GROUP BY 
            r.id
            LIMIT ?
            OFFSET ?
            `,
            [owner, PAGE_SIZE, offset],
        );

        console.log('OWNED RAFFLES', ownedRaffles);

        // Count total number of raffles for the owner
        const [[{ total }]] = await pool.query(
            `
            SELECT 
            COUNT(*) AS total
            FROM 
            raffles
            WHERE 
            owner = ?
            `,
            [owner]
        );

        console.log('TOTAL', total);

        return res.status(200).json({
            page,
            total,
            totalPages: Math.ceil(total / PAGE_SIZE),
            data: ownedRaffles
        });
    } catch (error) {
        console.error('Error retrieving owned raffles:', error);
        return res.status(500).json({ error: 'Failed to retrieve owned raffles: ' + error.message });
    }
});

export default router;
