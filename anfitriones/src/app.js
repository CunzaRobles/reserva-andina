const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ estado: 'ok', servicio: 'anfitriones' });
});

app.get('/anfitriones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM anfitriones ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar anfitriones' });
  }
});

app.get('/anfitriones/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM anfitriones WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Anfitrión no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar anfitrión' });
  }
});

app.post('/anfitriones', async (req, res) => {
  const { nombre, comunidad, telefono, idiomas } = req.body || {};
  if (!nombre || !comunidad || !telefono) {
    return res.status(400).json({ error: 'Nombre, comunidad y teléfono son obligatorios' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO anfitriones (nombre, comunidad, telefono, idiomas) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, comunidad, telefono, idiomas || 'quechua, español']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar anfitrión' });
  }
});

app.put('/anfitriones/:id', async (req, res) => {
  const { nombre, comunidad, telefono, idiomas } = req.body || {};
  if (!nombre || !comunidad || !telefono) {
    return res.status(400).json({ error: 'Nombre, comunidad y teléfono son obligatorios' });
  }
  try {
    const result = await pool.query(
      'UPDATE anfitriones SET nombre = $1, comunidad = $2, telefono = $3, idiomas = $4 WHERE id = $5 RETURNING *',
      [nombre, comunidad, telefono, idiomas || 'quechua, español', req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Anfitrión no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar anfitrión' });
  }
});

app.delete('/anfitriones/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM anfitriones WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Anfitrión no encontrado' });
    }
    res.json({ mensaje: 'Anfitrión eliminado', anfitrion: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar anfitrión' });
  }
});

module.exports = app;
