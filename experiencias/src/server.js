require('dotenv').config({ quiet: true });
const app = require('./app');

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Servicio de Experiencias ejecutándose en http://localhost:${PORT}`);
});
