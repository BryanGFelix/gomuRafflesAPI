import connection from "../db.js";

const initializePurchasedRaffleTicketsListener = (contract) => {
    contract.on('PurchasedRaffleTickets', async (raffleID, address, numEntries, totalTickets, participantTickets) => {
        try {
            // Check if the participant already exists in the raffle
            const participant = await new Promise((resolve, reject) => {
            connection.query(
                'SELECT * FROM participants WHERE address = ? AND raffleID = ?',
                [address, raffleID],
                (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results[0]);
                }
            );
            });

            if (participant) {
                // If the participant exists, update the number of tickets
                await new Promise((resolve, reject) => {
                    connection.query(
                    'UPDATE participants SET numTickets = ? WHERE id = ?',
                    [participantTickets, participant.id],
                    (err, results) => {
                        if (err) {
                        return reject(err);
                        }
                        resolve(results);
                    }
                    );
                });
            } else {
                // If the participant does not exist, insert a new record
                await new Promise((resolve, reject) => {
                    connection.query(
                    'INSERT INTO participants (address, numTickets, raffleID) VALUES (?, ?, ?)',
                    [address, participantTickets, raffleID],
                    (err, results) => {
                        if (err) {
                        return reject(err);
                        }
                        resolve(results);
                    }
                    );
                });
            }
        } catch (error) {
            console.error('Error purchasing tickets:', error);
        }
    });
  
    console.log('PurchasedRaffleTickets listener initialized');
  };
  
  export default initializePurchasedRaffleTicketsListener;
  