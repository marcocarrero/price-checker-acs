const express = require('express');
const app = express();
const path = require('path');
const priceRoutes = require('./routes/price');
const { clearScreenDown } = require('readline');

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'web-app')));

// Server is Running
app.get('/health', (req, res) => {
    res.json({status: 'Backend is Running'});
});

app.use(express.json());
app.use('/api', priceRoutes);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';  // Escuchar en todas las interfaces

app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});