import { ethers } from 'ethers';
import connection from '../db.js';
import express from 'express';
const router = express.Router();

router.post('/', async (req, res) => {
    const {
        raffleID,
        title,
        owner,
        ticketPrice,
        allowDuplicates,
        maxTickets,
        maxEntries,
        numWinners,
        duration,
        timeStarted,
        isActive
      } = req.body;
    
      try {
        // Format ticket price using ethers.js
        const formattedTicketPrice = ethers.formatUnits(ticketPrice, 'ether');
    
        // Insert raffle data into the database
        await new Promise((resolve, reject) => {
          connection.query(
            'INSERT INTO raffles (id, title, owner, ticketPrice, allowDuplicates, maxTotalTickets, maxEntries, numWinners, isActive, duration, timeStarted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              raffleID,
              title,
              owner,
              formattedTicketPrice,
              allowDuplicates,
              maxTickets,
              maxEntries,
              numWinners,
              isActive,
              duration,
              timeStarted
            ],
            (err, results) => {
              if (err) {
                console.error('Error inserting raffle data:', err.stack);
                return reject(err);
              }
              resolve(results);
            }
          );
        });
    
        return res.status(201).json({ message: 'Raffle created successfully' });
      } catch (error) {
        console.error('Error creating raffle:', error);
        return res.status(500).json({ error: 'Failed to create raffle: ' + error.message });
      }
});

export default router;
