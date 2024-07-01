import createPool from '../db.js';
import { ethers } from 'ethers';

const initializeCreateRaffleListener = (contract) => {
    const pool = createPool();

    contract.once('RaffleCreated', () => {
        console.log('CreateRaffle listener connected');
    });

    contract.on('RaffleCreated', async (raffleID, owner, ticketPrice, allowDuplicates, maxTickets, maxEntries, numWinners, duration, timeStarted, event) => {
        console.log('CREATING RAFFLE') ;
        const ticketPriceInEth = ethers.formatEther(ticketPrice);  
          try {
            // Check if the raffle already exists in the database to ensure idempotency
            await pool.query(
                `INSERT INTO raffles (
                    id,
                    ticketPrice,
                    maxTotalTickets,
                    maxEntries,
                    numWinners,
                    duration,
                    owner,
                    allowDuplicates,
                    isActive,
                    createdAt,
                    timeStarted
                ) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    raffleID,
                    ticketPriceInEth,
                    maxTickets,
                    maxEntries,
                    numWinners,
                    duration,
                    owner,
                    allowDuplicates,
                    true,
                    new Date(),
                    timeStarted,
                ]);
            console.log('CREATED');
            const transactionHash = event.log.transactionHash;

            // Update the transaction status to confirmed in the transactions table
            await pool.query(`
                INSERT INTO transactions (hash, type, status, updatedAt, raffleID, address)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        status = VALUES(status),
                        updatedAt = VALUES(updatedAt);
                `, [transactionHash, 'create_raffle', 'confirmed', Date.now(), raffleID, owner]);

          } catch (error) {
            console.error('Error creating raffle:', error);
          }

    });
  
    console.log('CreateRaffle listener initialized');
  };
  
  export default initializeCreateRaffleListener;
  