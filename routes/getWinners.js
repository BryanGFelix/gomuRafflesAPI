import createPool from '../db.js';
import express from 'express';
const router = express.Router();


router.post('/', async (req, res) => {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing raffleID parameter' });
    }

    const pool = createPool();

    try {
      const query = `
        SELECT 
          address
        FROM 
          winners
        WHERE 
          raffleID = ?
      `;
  
      const winners = await pool.query(query, [id]);
      return res.status(200).json(winners[0]);
    } catch (error) {
      console.error('Error retrieving raffle:', error);
      return res.status(500).json({ error: 'Failed to retrieve raffle winners: ' + error.message });
    }
});

export default router;
