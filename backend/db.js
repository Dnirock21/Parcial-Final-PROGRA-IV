/*

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'satisfaccion_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true, // DECIMAL/AVG llegan como number y no como string
  timezone: 'Z',        // fechas interpretadas en UTC
});

// Fuerza la zona horaria de cada conexión a UTC para que created_at sea consistente
pool.pool.on('connection', (conn) => {
  conn.query("SET time_zone = '+00:00'");
});

module.exports = pool; */

//MEAN
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/satisfaccion_db';
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB correctamente');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;