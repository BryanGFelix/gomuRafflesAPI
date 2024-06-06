import connection from '../db.js';
import express from 'express';
const router = express.Router();


router.post('/', async (req, res) => {
    const { body } = req;

    const raffleData = await contract.getRaffle(body.id);
    // Format Raffle Data
    const numWinners = Number(raffleData[6]);
    const allowDuplicates = raffleData[3];

    const ticketData = await contract.getParticipantsAndTickets(body.id);

    try {
        // Select winners using the alias method
        const winners = selectWinners(ticketData[0], ticketData[1], numWinners, allowDuplicates);

        // Get message in bytes
        const abiCoder = new ethers.AbiCoder();
        const encodedAbi = abiCoder.encode(["uint256", "address[]"], [body.id, winners]);
        const messageHash = ethers.keccak256(encodedAbi);
        const messageBytes = ethers.getBytes(messageHash);

        wallet.signMessage(messageBytes).then(async(signature) => {
            const resultData = await contract.recordWinners(body.id, winners, signature).catch((err) => {
                return res.status(500).json({success: false, error: err});
            }); 
            res.status(200).json({ winners, transactionHash: 'test' });
        });
        
        
    } catch (error) {
        console.error('Failed to draw winners:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

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


export default router;
