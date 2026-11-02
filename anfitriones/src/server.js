require('dotenv').config({ quiet: true });
const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servicio de Anfitriones ejecutándose en http://localhost:${PORT}`);
});
