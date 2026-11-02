require('dotenv').config({ quiet: true });
const app = require('./app');

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`Servicio de Notificaciones ejecutándose en http://localhost:${PORT}`);
});
