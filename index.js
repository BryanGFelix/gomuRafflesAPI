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
import { contract } from './utils.js';
import startDrawWinnersCronJobs from './cron/drawWinners.js';
import createPool from './db.js';

dotenv.config();

const app = express();

app.use(express.json());

const allowedOrigins = [
  'https://www.gomuraffles.com',
  'https://gomuraffles.vercel.app',
  /\.gomuraffles\.com$/
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log('Origin:', origin);
    if (!origin) {
      console.log('Allowing request with no origin');
      return callback(null, true);
    }

    if (allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      }
      return allowedOrigin.test(origin);
    })) {
      console.log('Allowing origin:', origin);
      callback(null, true);
    } else {
      console.log('Blocking origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 204 // For legacy browser support
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Log each request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware to log the response headers
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log('Response Headers:', res.getHeaders());
  });
  next();
});

// Catch-all error handler
app.use((err, req, res, next) => {
  console.error('An error occurred:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

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
