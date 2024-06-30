import createPool from "../db.js";
import { ethers } from 'ethers';

const initializePurchasedRaffleTicketsListener = (contract) => {
    const pool = createPool();
    contract.on('PurchasedRaffleTickets', async (raffleID, address, numEntries, totalTickets, participantTickets, totalTicketValue, event) => {
        const ticketPriceInEth = ethers.formatEther(totalTicketValue); 
        try {
            // Check if the participant already exists in the raffle
            const [participantResults] = await pool.query(
                'SELECT * FROM participants WHERE address = ? AND raffleID = ?',
                [address, raffleID]
            );

            if (participantResults.length > 0) {
                // If the participant exists, update the number of tickets
                await pool.query(
                    'UPDATE participants SET numTickets = ? WHERE id = ?',
                    [Number(participantTickets), participantResults[0].id]
                );
            } else {
                // If the participant does not exist, insert a new record
                await pool.query(
                    'INSERT INTO participants (address, numTickets, raffleID) VALUES (?, ?, ?)',
                    [address, Number(participantTickets), raffleID],
                );
            }

            const transactionHash = event.log.transactionHash;

            // Update the transaction status to confirmed in the transactions table
            await pool.query(`
                INSERT INTO transactions (hash, type, status, updatedAt, raffleID, address, amount)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        status = VALUES(status),
                        updatedAt = VALUES(updatedAt);
                `, [transactionHash, 'purchase_ticket', 'confirmed', Date.now(), raffleID, address, ticketPriceInEth]);
        } catch (error) {
            console.error('Error purchasing tickets:', error);
        }
    });
  
    console.log('PurchasedRaffleTickets listener initialized');
  };
  
  export default initializePurchasedRaffleTicketsListener;
  