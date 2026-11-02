const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

const CANALES = ['sms', 'whatsapp'];

app.get('/health', (req, res) => {
  res.json({ estado: 'ok', servicio: 'notificaciones' });
});

// Lista las notificaciones; admite el filtro opcional ?destinatario=
app.get('/notificaciones', async (req, res) => {
  const { destinatario } = req.query;
  try {
    const result = destinatario
      ? await pool.query('SELECT * FROM notificaciones WHERE destinatario = $1 ORDER BY id', [destinatario])
      : await pool.query('SELECT * FROM notificaciones ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar notificaciones' });
  }
});

app.get('/notificaciones/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notificaciones WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar notificación' });
  }
});

// Registra y "envía" una notificación. El envío es simulado: se muestra en la consola.
app.post('/notificaciones', async (req, res) => {
  const { destinatario, mensaje } = req.body || {};
  const canal = (req.body && req.body.canal) || 'sms';
  if (!destinatario || !mensaje) {
    return res.status(400).json({ error: 'Destinatario y mensaje son obligatorios' });
  }
  if (!CANALES.includes(canal)) {
    return res.status(400).json({ error: `El canal debe ser uno de: ${CANALES.join(', ')}` });
  }
  try {
    const result = await pool.query(
      'INSERT INTO notificaciones (destinatario, canal, mensaje) VALUES ($1, $2, $3) RETURNING *',
      [destinatario, canal, mensaje]
    );
    console.log(`[${canal.toUpperCase()}] Para ${destinatario}: ${mensaje}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar notificación' });
  }
});

module.exports = app;
