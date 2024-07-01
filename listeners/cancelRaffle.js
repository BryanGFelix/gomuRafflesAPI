import createPool from '../db.js';

const initializeCancelRaffleListener = (contract) => {
    const pool = createPool();
    contract.on('RaffleCancelled', async (raffleID, owner, ended, event) => { 
          try {
            console.log('TESTING HERE');
            await pool.query(
                'UPDATE raffles SET wasCancelled = ?, isActive = ?, timeEnded = ? WHERE id = ?',
                [true, false, ended, raffleID]
            );

            const transactionHash = event.log.transactionHash;

            // Update the transaction status to confirmed in the transactions table
            await pool.query(`
                INSERT INTO transactions (hash, type, status, updatedAt, raffleID, address)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        status = VALUES(status),
                        updatedAt = VALUES(updatedAt);
                `, [transactionHash, 'cancel_raffle', 'confirmed', Date.now(), raffleID, owner]);

          } catch (error) {
            console.error('Error cancelling raffle raffle:', error);
          }

    });
  
    console.log('RaffleCancelled listener initialized');
  };
  
  export default initializeCancelRaffleListener;
  