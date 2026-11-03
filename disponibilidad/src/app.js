const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

// Columnas que se devuelven (la fecha como texto AAAA-MM-DD y los cupos libres calculados)
const COLUMNAS = `id, experiencia_id, to_char(fecha, 'YYYY-MM-DD') AS fecha,
  cupos_totales, cupos_reservados, (cupos_totales - cupos_reservados) AS cupos_libres`;

const esEnteroPositivo = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;
const esFecha = (valor) => /^\d{4}-\d{2}-\d{2}$/.test(valor || '');

// Valida los datos de una operación de reserva o liberación de cupos.
function validarOperacion({ experiencia_id, fecha, personas }) {
  if (!esEnteroPositivo(experiencia_id) || !esFecha(fecha) || !esEnteroPositivo(personas)) {
    return 'experiencia_id, fecha (AAAA-MM-DD) y personas (entero positivo) son obligatorios';
  }
  return null;
}

app.get('/health', (req, res) => {
  res.json({ estado: 'ok', servicio: 'disponibilidad' });
});

// Lista la disponibilidad; admite filtros opcionales ?experiencia_id= y ?fecha=
app.get('/disponibilidad', async (req, res) => {
  const { experiencia_id, fecha } = req.query;
  const condiciones = [];
  const valores = [];
  if (experiencia_id) {
    valores.push(experiencia_id);
    condiciones.push(`experiencia_id = $${valores.length}`);
  }
  if (fecha) {
    valores.push(fecha);
    condiciones.push(`fecha = $${valores.length}::date`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  try {
    const result = await pool.query(
      `SELECT ${COLUMNAS} FROM disponibilidad ${where} ORDER BY experiencia_id, fecha`,
      valores
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar disponibilidad' });
  }
});

// Abre cupos para una experiencia en una fecha
app.post('/disponibilidad', async (req, res) => {
  const { experiencia_id, fecha, cupos_totales } = req.body || {};
  if (!esEnteroPositivo(experiencia_id) || !esFecha(fecha) || !esEnteroPositivo(cupos_totales)) {
    return res.status(400).json({
      error: 'experiencia_id, fecha (AAAA-MM-DD) y cupos_totales (entero positivo) son obligatorios'
    });
  }
  try {
    const result = await pool.query(
      `INSERT INTO disponibilidad (experiencia_id, fecha, cupos_totales)
       VALUES ($1, $2, $3) RETURNING ${COLUMNAS}`,
      [experiencia_id, fecha, cupos_totales]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe disponibilidad para esa experiencia y fecha' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al registrar disponibilidad' });
  }
});

// Descuenta cupos solo si alcanzan (en una sola operación, para evitar sobrerreservas)
app.post('/disponibilidad/reservar', async (req, res) => {
  const datos = req.body || {};
  const error = validarOperacion(datos);
  if (error) {
    return res.status(400).json({ error });
  }
  try {
    const result = await pool.query(
      `UPDATE disponibilidad
       SET cupos_reservados = cupos_reservados + $3
       WHERE experiencia_id = $1 AND fecha = $2::date
         AND cupos_totales - cupos_reservados >= $3
       RETURNING ${COLUMNAS}`,
      [datos.experiencia_id, datos.fecha, datos.personas]
    );
    if (result.rowCount === 1) {
      return res.json(result.rows[0]);
    }
    const existe = await pool.query(
      'SELECT 1 FROM disponibilidad WHERE experiencia_id = $1 AND fecha = $2::date',
      [datos.experiencia_id, datos.fecha]
    );
    if (existe.rowCount === 0) {
      return res.status(404).json({ error: 'No hay disponibilidad registrada para esa fecha' });
    }
    res.status(409).json({ error: 'Sin cupos suficientes' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al reservar cupos' });
  }
});

// Devuelve cupos cuando se cancela una reserva
app.post('/disponibilidad/liberar', async (req, res) => {
  const datos = req.body || {};
  const error = validarOperacion(datos);
  if (error) {
    return res.status(400).json({ error });
  }
  try {
    const result = await pool.query(
      `UPDATE disponibilidad
       SET cupos_reservados = GREATEST(cupos_reservados - $3, 0)
       WHERE experiencia_id = $1 AND fecha = $2::date
       RETURNING ${COLUMNAS}`,
      [datos.experiencia_id, datos.fecha, datos.personas]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No hay disponibilidad registrada para esa fecha' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al liberar cupos' });
  }
});

module.exports = app;
