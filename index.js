// backend-server/index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import getRaffle from './routes/getRaffle.js';
import getOwnedRaffles from './routes/getOwnedRaffles.js';
import getJoinedRaffles from './routes/getJoinedRaffles.js';
import getWinners from './routes/getWinners.js';
import sendTransaction from './routes/sendTransaction.js';
import updateTransaction from './routes/updateTransaction.js';
import initializePurchasedRaffleTicketsListener from './listeners/purchasedRaffleTickets.js';
import initializeCreateRaffleListener from './listeners/createRaffle.js';
import {contract} from './utils.js';
import startDrawWinnersCronJobs from './cron/drawWinners.js';
import createPool from './db.js';

dotenv.config();

const app = express();
createPool();

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

let listenersInitialized = false;

const initContractListeners = () => {
  if (listenersInitialized) return;
  listenersInitialized = true;

  initializePurchasedRaffleTicketsListener(contract);
  initializeCreateRaffleListener(contract);
};

// Initialize contract event listener
initContractListeners();
startDrawWinnersCronJobs();
  
app.use('/api/getRaffle', getRaffle);
app.use('/api/getOwnedRaffles', getOwnedRaffles);
app.use('/api/getJoinedRaffles', getJoinedRaffles);
app.use('/api/getWinners', getWinners);
app.use('/api/sendTransaction', sendTransaction);
app.use('/api/updateTransaction', updateTransaction);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

