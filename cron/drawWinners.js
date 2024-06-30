import createPool from '../db.js';
import { contract, wallet, provider } from '../utils.js';
import { ethers } from 'ethers';

const drawWinnersForRaffle = async (raffles) => {
    const pool = createPool();

    for (const raffle of raffles) {
        const raffleID = raffle.id;
        try {
            const raffleData = await contract.getRaffle(raffleID);
            const numWinners = Number(raffleData[6]);
            const allowDuplicates = raffleData[3];
            const isActive = raffleData[7];

            const ended = Math.floor(Date.now() / 1000); // Current timestamp in seconds
            if (!isActive) {
                const winners = await contract.getRaffleWinners(raffleID);
                try {
                    // Insert winners into the database
                    if (winners.length > 0) {
                        const query = `INSERT INTO winners (address, raffleID) 
                            VALUES (?, ?)`;
                        const values = winners.map(winner => [winner, raffleID]);

                        await pool.query(query, [values]);
                    }

                    // Update the raffle end time and status in the database
                    const updateQuery = 'UPDATE raffles SET timeEnded = ?, isActive = ? WHERE id = ?';
                    await pool.query(updateQuery, [ended, false, raffleID]);
                } catch (dbError) {
                    console.error('Error updating database:', dbError);
                }
            } else {
                const ticketData = await contract.getParticipantsAndTickets(raffleID);

                // Select winners using the alias method
                const winners = selectWinners(ticketData[0], ticketData[1], numWinners, allowDuplicates);

                // Get message in bytes
                const abiCoder = new ethers.AbiCoder();
                const encodedAbi = abiCoder.encode(["bytes16", "address[]"], [raffleID, winners]);
                const messageHash = ethers.keccak256(encodedAbi);
                const messageBytes = ethers.getBytes(messageHash);

                const signature = await wallet.signMessage(messageBytes);
                const transactionResponse = await contract.recordWinners(raffleID, winners, signature);

                // Wait for the transaction to be confirmed
                const receipt = await provider.waitForTransaction(transactionResponse.hash);

                if (receipt.status === 1) {
                    console.log('Transaction confirmed:', receipt.transactionHash);

                    try {
                        // Insert winners into the database
                        const query = 'INSERT INTO winners (address, raffleID) VALUES (?, ?)';
                        console.log(winners);
                        const values = winners.map(winner => [winner, raffleID]);

                        await pool.query(query, [values]);

                        // Update the raffle end time and status in the database
                        const updateQuery = 'UPDATE raffles SET timeEnded = ?, isActive = ? WHERE id = ?';
                        await pool.query(updateQuery, [ended, false, raffleID]);
                    } catch (dbError) {
                        console.error('Error updating database:', dbError);
                    }
                } else {
                    console.log('Transaction failed:', receipt.transactionHash);
                }
            }
        } catch (error) {
            console.error(`Failed to process raffle ${raffleID}:`, error);
        }
    }

};

const drawWinners = async () => {
    const pool = createPool();
    try {
        const currentTimeInSecond = Date.now() / 1000;

        const expiredRaffles = await pool.query(`
            SELECT
                id
            FROM raffles
            WHERE isActive = 1 AND ? > timeStarted
        `, [currentTimeInSecond]);
    
        if(expiredRaffles.length > 0) {
            drawWinnersForRaffle(expiredRaffles[0]);
        }
    } catch (error) {
      console.error('Error retrieving expired raffles:', error);
    }
};

function selectWinners(addresses, tickets, numWinners, allowDuplicates) {
    const winners = [];
    const indices = Array.from(tickets.keys());  // Create indices array from tickets
    let ticketCounts = tickets.map(ticket => BigInt(ticket));  // Copy tickets to a mutable array
    let ticketSums = [];
    let currentSum = BigInt(0);

    // Create initial cumulative ticket sum array
    for (let i = 0; i < ticketCounts.length; i++) {
        currentSum += ticketCounts[i];
        ticketSums.push(currentSum);
    }

    const drawWinner = () => {
        const rand = BigInt(Math.floor(Math.random() * Number(currentSum)));
        let low = 0, high = ticketSums.length - 1;
        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (ticketSums[mid] > rand) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return low;
    };

    while (winners.length < numWinners && indices.length > 0 && currentSum > 0n) {
        const winnerIndex = drawWinner();
        winners.push(addresses[indices[winnerIndex]]);  // Add the winner's address using indices mapping

        // Manage ticket counts to allow for duplicates within ticket limits
        if (ticketCounts[indices[winnerIndex]] > 0) {
            ticketCounts[indices[winnerIndex]] -= BigInt(1);
            currentSum -= BigInt(1);  // Decrement the total number of available tickets

            // Recalculate the ticketSums from the point of the last change
            ticketSums = [];
            let newSum = BigInt(0);
            for (let i = 0; i < ticketCounts.length; i++) {
                newSum += ticketCounts[i];
                ticketSums.push(newSum);
            }
        }

        // Optionally, if not allowing duplicates, remove the index entirely
        if (!allowDuplicates && ticketCounts[indices[winnerIndex]] === BigInt(0)) {
            indices.splice(winnerIndex, 1);
            ticketSums.splice(winnerIndex, 1);
        }
    }

    return winners;
}

export default drawWinners;
