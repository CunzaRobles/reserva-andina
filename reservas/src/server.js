require('dotenv').config({ quiet: true });
const app = require('./app');

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`Servicio de Reservas ejecutándose en http://localhost:${PORT}`);
});
