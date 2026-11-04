const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

const TIPOS = ['hospedaje', 'taller', 'gastronomia', 'agricultura'];

// Valida los datos de una experiencia. Devuelve un mensaje de error o null.
function validarExperiencia({ anfitrion_id, titulo, tipo, precio, capacidad }) {
  if (!Number.isInteger(Number(anfitrion_id)) || Number(anfitrion_id) <= 0) {
    return 'anfitrion_id debe ser un entero positivo';
  }
  if (!titulo) {
    return 'El título es obligatorio';
  }
  if (!TIPOS.includes(tipo)) {
    return `El tipo debe ser uno de: ${TIPOS.join(', ')}`;
  }
  if (precio === undefined || !Number.isFinite(Number(precio)) || Number(precio) < 0) {
    return 'El precio debe ser un número mayor o igual a 0';
  }
  if (!Number.isInteger(Number(capacidad)) || Number(capacidad) <= 0) {
    return 'La capacidad debe ser un entero positivo';
  }
  return null;
}

// Consulta al microservicio de Anfitriones si el anfitrión existe.
async function anfitrionExiste(anfitrionId) {
  const response = await fetch(`${process.env.ANFITRIONES_URL}/anfitriones/${anfitrionId}`);
  if (response.status === 404) {
    return false;
  }
  if (!response.ok) {
    throw new Error('Error al consultar el servicio de Anfitriones');
  }
  return true;
}

app.get('/health', (req, res) => {
  res.json({ estado: 'ok', servicio: 'experiencias' });
});

app.get('/experiencias', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM experiencias ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar experiencias' });
  }
});

app.get('/experiencias/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM experiencias WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Experiencia no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar experiencia' });
  }
});

app.post('/experiencias', async (req, res) => {
  const datos = req.body || {};
  const error = validarExperiencia(datos);
  if (error) {
    return res.status(400).json({ error });
  }
  try {
    if (!(await anfitrionExiste(datos.anfitrion_id))) {
      return res.status(400).json({ error: 'El anfitrión indicado no existe' });
    }
    const result = await pool.query(
      `INSERT INTO experiencias (anfitrion_id, titulo, tipo, precio, capacidad)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [datos.anfitrion_id, datos.titulo, datos.tipo, datos.precio, datos.capacidad]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar experiencia' });
  }
});

app.put('/experiencias/:id', async (req, res) => {
  const datos = req.body || {};
  const error = validarExperiencia(datos);
  if (error) {
    return res.status(400).json({ error });
  }
  try {
    if (!(await anfitrionExiste(datos.anfitrion_id))) {
      return res.status(400).json({ error: 'El anfitrión indicado no existe' });
    }
    const result = await pool.query(
      `UPDATE experiencias
       SET anfitrion_id = $1, titulo = $2, tipo = $3, precio = $4, capacidad = $5
       WHERE id = $6 RETURNING *`,
      [datos.anfitrion_id, datos.titulo, datos.tipo, datos.precio, datos.capacidad, req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Experiencia no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar experiencia' });
  }
});

app.delete('/experiencias/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM experiencias WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Experiencia no encontrada' });
    }
    res.json({ mensaje: 'Experiencia eliminada', experiencia: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar experiencia' });
  }
});

module.exports = app;
