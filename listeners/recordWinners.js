import connection from "../db.js";

const initializePurchasedRaffleTicketsListener = (contract) => {
    contract.on('WinnersSelected', async (raffleID, winners, ended) => {
        try {
            const query = 'INSERT INTO winners (address, raffleID) VALUES ?';
            const values = winners.map(winner => [winner, raffleID]);

            connection.query(query, [values], (err, results) => {
                if (err) {
                    return console.error('Error executing query:', err);
                }
            });

            const updateQuery = 'UPDATE raffles SET timeEnded = ? WHERE id = ?';

            connection.query(updateQuery, [ended, raffleID], (err, results) => {
            if (err) {
                return console.error('Error updating raffle end time:', err);
            }
            });
        } catch (error) {
            console.error('Error purchasing tickets:', error);
        }
    });
  
    console.log('WinnersSelected listener initialized');
  };
  
  export default initializePurchasedRaffleTicketsListener;
  