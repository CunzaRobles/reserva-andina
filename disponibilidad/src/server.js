require('dotenv').config({ quiet: true });
const app = require('./app');

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Servicio de Disponibilidad ejecutándose en http://localhost:${PORT}`);
});
