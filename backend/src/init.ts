import fs from 'fs'
import path from 'path';
import { pool } from './db';
const initSql = fs.readFileSync(path.join(__dirname, '../db/init.sql')).toString();

pool.connect((err, client) => {
  if (!client) {
    return console.error('Error acquiring client', err?.stack);
  }
  
  client.query(initSql, (err) => {
    if (err) {
      return console.error('Error initializing database', err.stack);
    }
    // release();
    console.log('Database initialized successfully');
  });
  console.log('Database connected successfully');
});