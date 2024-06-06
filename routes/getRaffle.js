import connection from '../db.js';
import express from 'express';
const router = express.Router();


router.post('/', async (req, res) => {
    const { id, user } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing raffleID parameter' });
    }

    try {
      const query = `
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
          IFNULL(SUM(p.numTickets), 0) AS totalTickets
          ${user ? ', IFNULL(SUM(CASE WHEN p.address = ? THEN p.numTickets ELSE 0 END), 0) AS userTickets' : ''}
        FROM 
          raffles r
        LEFT JOIN 
          participants p ON r.id = p.raffleId
        WHERE 
          r.id = ?
        GROUP BY 
          r.id
      `;
  
      const queryParams = user ? [user, id] : [id];
  
      const raffleData = await new Promise((resolve, reject) => {
        connection.query(query, queryParams, (err, results) => {
          if (err) {
            return reject(err);
          }
          if (results.length === 0) {
            return reject(new Error('Raffle not found'));
          }
          resolve(results[0]);
        });
      });
  
      return res.status(200).json(raffleData);
    } catch (error) {
      console.error('Error retrieving raffle:', error);
      return res.status(500).json({ error: 'Failed to retrieve raffle: ' + error.message });
    }
});

export default router;
