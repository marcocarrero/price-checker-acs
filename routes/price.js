const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db');

// Función para agregar ceros a la izquierda (si es necesario)
function padItemCode(itemCode, length) {
    return itemCode.padStart(length, '0');
}

// Función para restar las 4 horas y ajustar la zona horaria
function adjustToDatabaseTimezone(date) {
    const offsetHours = 4; // La diferencia en horas (UTC-4)
    return new Date(date.getTime() - offsetHours * 60 * 60 * 1000);
}

// Función para verificar si la fecha y hora actual están dentro del rango de la oferta
function isWithinSalePeriod(currentDateTime, saleStartDateTime, saleEndDateTime) {
    const startDateTime = new Date(saleStartDateTime); // Convertir a objeto Date
    const endDateTime = new Date(saleEndDateTime);     // Convertir a objeto Date
    
    return currentDateTime >= startDateTime && currentDateTime <= endDateTime;
}

// Función para formatear la fecha al formato YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

// Función para formatear el precio con dos decimales
function formatPrice(price) {
    return parseFloat(price).toFixed(2); // Asegurarse de que siempre tenga dos decimales
}

// Definir la ruta GET para consultar precios
router.get('/price/:itemCode', async (req, res) => {
    try {
        // Formatear el ItemCode para que tenga 14 caracteres (si es necesario)
        const itemCode = padItemCode(req.params.itemCode, 14);

        // Obtener una conexión del pool de conexiones
        const pool = await poolPromise;

        // Realizar la consulta SQL a la tabla con el campo ItemCode
        const result = await pool.request()
            .input('itemCode', sql.VarChar, itemCode)
            .query(`
                SELECT basePrice, description, packageSize, salePrice, saleDeal, 
                       saleStartDate AS saleStartDateTime, saleEndTime AS saleEndDateTime
                FROM dbo.ItemRecord 
                WHERE ItemCode = @itemCode
            `);
        
        // Verificar si se encontró el producto
        if (result.recordset.length > 0) {
            const product = result.recordset[0];

            // Obtener la fecha actual ajustada para la zona horaria del servidor SQL (UTC-4)
            const currentDateTime = adjustToDatabaseTimezone(new Date());

            // Convertir las fechas de la base de datos a objetos Date para comparar
            const saleStartDateTime = new Date(product.saleStartDateTime);
            const saleEndDateTime = new Date(product.saleEndDateTime);

            // Verificar si el producto está en promoción
            if (isWithinSalePeriod(currentDateTime, saleStartDateTime, saleEndDateTime)) {
                // Si está en promoción, devolver los valores de la oferta con formato de precio
                res.json({
                    price: formatPrice(product.salePrice),
                    description: product.description,
                    deal: product.saleDeal,
                    saleLabel: `WEEKLY SALE ends on ${formatDate(saleEndDateTime)}`
                });
            } else {
                // Si no está en promoción, devolver los valores regulares con formato de precio
                res.json({
                    price: formatPrice(product.basePrice),
                    description: product.description,
                    packageSize: product.packageSize
                });
            }
        } else {
            // Si no se encuentra el producto, devolver un error 404
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (err) {
        // Manejo de errores
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;