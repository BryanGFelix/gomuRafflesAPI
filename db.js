import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool;

const createPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.AWS_RDS_ENDPOINT,
      user: process.env.AWS_USERNAME,
      password: process.env.AWS_PASSWORD,
      database: process.env.AWS_DB,
      port: process.env.AWS_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('Connection pool created');
  }
  return pool;
}

export default createPool;
