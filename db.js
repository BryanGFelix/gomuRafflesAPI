import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.AWS_RDS_ENDPOINT,
  user: process.env.AWS_USERNAME,
  password: process.env.AWS_PASSWORD,
  database: process.env.AWS_DB,
  port: process.env.AWS_PORT
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database as id', connection.threadId);
});

export default connection;
