import connection from '../db.js';
import express from 'express';
const router = express.Router();


router.post('/', async (req, res) => {
    const { owner } = req.body;

    if (!owner) {
        return res.status(400).json({ error: 'Missing owner parameter' });
    }

    try {
        const ownedRaffles = await new Promise((resolve, reject) => {
        connection.query(
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
            r.description,
            IFNULL(SUM(p.numTickets), 0) AS totalTickets
            FROM 
            raffles r
            LEFT JOIN 
            participants p ON r.id = p.raffleID
            WHERE 
            r.owner = ?
            GROUP BY 
            r.id
            `,
            [owner],
            (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
            }
        );
        });

        return res.status(200).json(ownedRaffles);
    } catch (error) {
        console.error('Error retrieving owned raffles:', error);
        return res.status(500).json({ error: 'Failed to retrieve owned raffles: ' + error.message });
    }
});

export default router;
