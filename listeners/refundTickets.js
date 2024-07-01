import createPool from '../db.js';
import { ethers } from 'ethers';

const initializeRefundTicketsListener = (contract) => {
    const pool = createPool();
    contract.on('RefundIssued', async (raffleID, participant, refundAmount, event) => { 
          try {
            await pool.query(
                'UPDATE participants SET refunded = ? WHERE raffleID = ? AND address = ?',
                [true, raffleID, participant]
            );

            const transactionHash = event.log.transactionHash;
            const refundInEth = ethers.formatEther(refundAmount); 

            // Update the transaction status to confirmed in the transactions table
            await pool.query(`
                INSERT INTO transactions (hash, type, status, updatedAt, raffleID, address, amount)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        status = VALUES(status),
                        updatedAt = VALUES(updatedAt),
                        amount = VALUES(amount);
                `, [transactionHash, 'collect_refund', 'confirmed', Date.now(), raffleID, participant, refundInEth]);

          } catch (error) {
            console.error('Error updating participant refund status:', error);
          }

    });
  
    console.log('RefundTickets listener initialized');
  };
  
  export default initializeRefundTicketsListener;
  