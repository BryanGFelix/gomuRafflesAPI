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
import initializeRefundTicketsListener from './listeners/refundTickets.js';
import initializeCancelRaffleListener from './listeners/cancelRaffle.js';
import {contract} from './utils.js';
import startDrawWinnersCronJobs from './cron/drawWinners.js';
import createPool from './db.js';

dotenv.config();

const app = express();

const allowedOrigins = ['gomuraffles.com', 'www.gomuraffles.com', 'gomuraffles.vercel.app'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

createPool();

let listenersInitialized = false;

const initContractListeners = () => {
  if (listenersInitialized) return;
  listenersInitialized = true;

  initializePurchasedRaffleTicketsListener(contract);
  initializeCreateRaffleListener(contract);
  initializeRefundTicketsListener(contract);
  initializeCancelRaffleListener(contract);
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

