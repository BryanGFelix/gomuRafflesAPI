import createPool from '../db.js';
import express from 'express';
const router = express.Router();


router.post('/', async (req, res) => {
    const { id, user } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing raffleID parameter' });
    }

    const pool = createPool();

    try {
        let query = `
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
          IFNULL(SUM(CASE WHEN p.address = ? THEN p.numTickets ELSE 0 END), 0) AS userTickets,
          IFNULL(MAX(CASE WHEN p.address = ? THEN p.refunded ELSE NULL END), 0) AS refunded
      `;
      
      let params = [user, user];

      if (user) {
        query += `,
          (
            SELECT COUNT(*)
            FROM winners w
            WHERE w.raffleID = r.id AND w.address = ?
          ) AS numWins
        `;
        params.push(user);
      }

      query += `
        FROM
          raffles r
        LEFT JOIN
          participants p ON r.id = p.raffleID
        WHERE
          r.id = ?
        GROUP BY
          r.id;
      `;

      params.push(id);
  
      const raffleData = await pool.query(query, params);

      return res.status(200).json(raffleData[0][0]);
    } catch (error) {
      console.error('Error retrieving raffle:', error);
      return res.status(500).json({ error: 'Failed to retrieve raffle: ' + error.message });
    }
});

export default router;
