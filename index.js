// backend-server/index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import getRaffle from './routes/getRaffle.js';
import getOwnedRaffles from './routes/getOwnedRaffles.js';
import getJoinedRaffles from './routes/getJoinedRaffles.js';
import drawWinners from './routes/drawWinners.js';
import createRaffle from './routes/createRaffle.js';
import initializePurchasedRaffleTicketsListener from './listeners/purchasedRaffleTickets.js';
import {contract} from './utils.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

let listenersInitialized = false;

const initContractListeners = () => {
  if (listenersInitialized) return;
  listenersInitialized = true;

  initializePurchasedRaffleTicketsListener(contract);
};

// Initialize contract event listener
initContractListeners();
  
app.use('/api/getRaffle', getRaffle);
app.use('/api/getOwnedRaffles', getOwnedRaffles);
app.use('/api/getJoinedRaffles', getJoinedRaffles);
app.use('/api/drawWinners', drawWinners);
app.use('/api/createRaffle', createRaffle);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

