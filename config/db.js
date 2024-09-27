require('dotenv').config(); // Cargar el archivo .env

const sql = require('mssql');

// Configuración de la base de datos usando variables de entorno
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'false', // Convertir a booleano
        trustServerCertificate: process.env.DB_TRUST_CERTIFICATE === 'true' // Convertir a booleano
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed!', err);
        process.exit(1);
    });

module.exports = {
    sql, poolPromise
};