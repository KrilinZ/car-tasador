const fs = require('fs');
const path = require('path');

// Leer el archivo JSON original
const inputPath = path.join(__dirname, 'cars.json');
const outputPath = path.join(__dirname, 'processedCars.json');

// Lista de marcas compuestas
const marcasCompuestas = [
  'ALFA ROMEO',
  'ASTON MARTIN',
  'LAND ROVER',
  'ROLLS ROYCE',
  'MERCEDES BENZ', // Usaremos esta denominación estándar
];

// Lista de versiones estándar (ejemplo)
const versionesEstandar = {
  '200': '200',
  '180': '180',
  'PURETECH': 'PureTech',
  'BLUEDCI': 'BlueDCI',
  'TDI': 'TDI',
  'ECOBOOST': 'EcoBoost',
  'STSP': 'Start&Stop',
};

// Función para unificar marcas
const unificarMarca = (name) => {
  let normalized = name.toUpperCase()
    .replace(/MERCEDES[-_ ]BENZ/g, 'MERCEDES BENZ');
  return normalized;
};

// Función para unificar versiones
const unificarVersion = (version) => {
  let palabras = version.toUpperCase().split(' ');
  return palabras
    .map(palabra => versionesEstandar[palabra] || palabra) // Reemplazar por versión estándar si existe
    .join(' ');
};

fs.readFile(inputPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error al leer el archivo:', err);
    return;
  }

  try {
    // Parsear el JSON
    const cars = JSON.parse(data);

    // Procesar los datos
    const processedCars = cars.map(car => {
      let marca = '';
      let modelo = '';
      let version = '';

      // Normalizar el nombre para unificar marcas
      const normalizedName = unificarMarca(car.name);

      // Comprobar si el nombre del coche contiene una marca compuesta
      for (const marcaCompuesta of marcasCompuestas) {
        if (normalizedName.startsWith(marcaCompuesta)) {
          marca = marcaCompuesta;
          const rest = normalizedName.slice(marcaCompuesta.length).trim().split(' ');
          modelo = rest[0] || '';
          version = rest.slice(1).join(' ') || '';
          break;
        }
      }

      // Si no encontramos una marca compuesta, procesamos el nombre normalmente
      if (!marca) {
        const [firstPart, ...rest] = normalizedName.split(' ');
        marca = firstPart || '';
        modelo = rest[0] || '';
        version = rest.slice(1).join(' ') || '';
      }

      // Unificar la versión
      version = unificarVersion(version);

      return {
        ...car, // Mantener los datos originales
        marca,
        modelo,
        version,
      };
    });

    // Guardar el nuevo JSON procesado
    fs.writeFile(outputPath, JSON.stringify(processedCars, null, 2), err => {
      if (err) {
        console.error('Error al guardar el archivo:', err);
      } else {
        console.log('Archivo procesado guardado como:', outputPath);
      }
    });
  } catch (err) {
    console.error('Error al procesar el archivo JSON:', err);
  }
});
