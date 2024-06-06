import connection from '../db.js';
import express from 'express';
const router = express.Router();


router.post('/', async (req, res) => {
    const { user } = req.body;

  if (!user) {
    return res.status(400).json({ error: 'Missing participant parameter' });
  }

  try {
    const joinedRaffles = await new Promise((resolve, reject) => {
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
            `,
        [user],
        (err, results) => {
          if (err) {
            return reject(err);
          }
          resolve(results);
        }
      );
    });
        return res.status(200).json(joinedRaffles);
    } catch (error) {
        console.error('Error retrieving joined raffles:', error);
        return res.status(500).json({ error: 'Failed to retrieve joined raffles: ' + error.message });
    }
});

export default router;
