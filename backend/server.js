const express = require('express');
const cors = require('cors');
const fs = require('fs');  // Para leer archivos JSON

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Permite recibir JSON en las solicitudes

// Ruta para obtener los coches procesados
app.get('/api/coches', (req, res) => {
  const cars = require('./processedCars.json'); // Archivo con los datos procesados
  res.json(cars);
});

// Ruta para obtener las marcas disponibles
app.get('/api/marcas', (req, res) => {
  const cars = require('./processedCars.json');
  const marcas = [...new Set(cars.map(car => car.marca))]; // Obtener marcas únicas
  res.json(marcas);
});

// Ruta para obtener los modelos disponibles para una marca
app.get('/api/modelos/:marca', (req, res) => {
  const { marca } = req.params;
  const cars = require('./processedCars.json');
  const modelos = [...new Set(cars.filter(car => car.marca === marca).map(car => car.modelo))]; // Obtener modelos únicos por marca
  res.json(modelos);
});

// Ruta para obtener las versiones disponibles para un modelo
app.get('/api/versiones/:marca/:modelo', (req, res) => {
  const { marca, modelo } = req.params;
  const cars = require('./processedCars.json');
  const versiones = [...new Set(cars.filter(car => car.marca === marca && car.modelo === modelo).map(car => car.version))]; // Obtener versiones únicas por marca y modelo
  res.json(versiones);
});

// Endpoint para tasar un coche
app.post('/api/tasacion', (req, res) => {
  const { marca, modelo, año, kilometros, combustible } = req.body;

  // Validar datos básicos
  if (!marca || !modelo || !año || !kilometros || !combustible) {
    return res.status(400).json({ error: 'Faltan datos para la tasación.' });
  }

  // Cargar coches desde el archivo JSON
  const cars = require('./processedCars.json');

  // Filtrar coches que coincidan con la marca, modelo y combustible
  const filteredCars = cars.filter(car => 
    car.marca.toLowerCase() === marca.toLowerCase() && 
    car.modelo.toLowerCase() === modelo.toLowerCase() && 
    car.combustible.toLowerCase() === combustible.toLowerCase()
  );

  if (filteredCars.length === 0) {
    return res.status(404).json({ error: 'No se encontraron coches similares para tasar.' });
  }

  // Encontrar el coche con el precio más cercano
  let basePrice = 0;
  let closestCar = null;

  filteredCars.forEach(car => {
    const carYear = parseInt(car.año);
    const carKilometros = parseInt(car.kilometros.replace(/[^\d]/g, ''));
    const carPrice = parseFloat(car.precio.replace(/[^\d,]/g, '').replace(',', '.'));

    // Ajustar la similitud según el año y los kilómetros
    const yearDiff = Math.abs(carYear - año);
    const kmDiff = Math.abs(carKilometros - kilometros);

    // Si encontramos el primer coche o un coche más cercano en términos de año y kilómetros, actualizamos el precio
    if (!closestCar || (yearDiff < Math.abs(parseInt(closestCar.año) - año) && kmDiff < Math.abs(parseInt(closestCar.kilometros) - kilometros))) {
      closestCar = car;
      basePrice = carPrice;
    }
  });

  // Si encontramos un coche similar
  if (closestCar) {
    // Ajustar el precio según los kilómetros y el año
    let price = basePrice;

    // Descontar según los kilómetros (por cada 10,000 km de diferencia)
    price -= Math.floor(Math.abs(kilometros - parseInt(closestCar.kilometros.replace(/[^\d]/g, ''))) / 10000) * 0.01 * basePrice;

    // Ajustar según el combustible
    if (combustible.toLowerCase() === 'diesel') {
      price -= 0.05 * basePrice; // Menos valor por Diesel
    } else if (combustible.toLowerCase() === 'gasolina') {
      price += 0.03 * basePrice; // Más valor por Gasolina
    } else if (combustible.toLowerCase() === 'eléctrico') {
      price += 0.05 * basePrice; // Más valor por Eléctrico
    } else if (combustible.toLowerCase() === 'híbrido') {
      price += 0.02 * basePrice; // Más valor por Híbrido
    }

    // No permitir precios negativos
    if (price < 0) price = 0;

    return res.json({
      tasacion: Math.round(price), // Precio redondeado
      detalles: {
        marca,
        modelo,
        año,
        kilometros,
        combustible,
      },
      coche_similar: closestCar, // Mostrar el coche más similar encontrado
    });
  } else {
    return res.status(404).json({ error: 'No se pudo encontrar un coche similar para tasar.' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
