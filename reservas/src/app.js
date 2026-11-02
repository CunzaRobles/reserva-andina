const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

// Columnas que se devuelven (la fecha como texto AAAA-MM-DD)
const COLUMNAS = `id, experiencia_id, turista_nombre, turista_email,
  to_char(fecha, 'YYYY-MM-DD') AS fecha, personas, total, estado, creada_en`;

const esEnteroPositivo = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;
const esFecha = (valor) => /^\d{4}-\d{2}-\d{2}$/.test(valor || '');

// ---------- Comunicación con los otros microservicios ----------

// Experiencias: devuelve la experiencia o null si no existe.
async function obtenerExperiencia(experienciaId) {
  const response = await fetch(`${process.env.EXPERIENCIAS_URL}/experiencias/${experienciaId}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Error al consultar el servicio de Experiencias');
  }
  return response.json();
}

// Disponibilidad: operacion es 'reservar' o 'liberar'. Devuelve la respuesta HTTP.
function cambiarCupos(operacion, experienciaId, fecha, personas) {
  return fetch(`${process.env.DISPONIBILIDAD_URL}/disponibilidad/${operacion}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ experiencia_id: experienciaId, fecha, personas })
  });
}

// Anfitriones + Notificaciones: avisa al anfitrión. Si falla, la reserva no se pierde.
async function notificarAnfitrion(experiencia, mensaje) {
  try {
    const anfitrion = await fetch(`${process.env.ANFITRIONES_URL}/anfitriones/${experiencia.anfitrion_id}`);
    if (!anfitrion.ok) {
      throw new Error('No se pudo obtener el teléfono del anfitrión');
    }
    const { telefono } = await anfitrion.json();
    await fetch(`${process.env.NOTIFICACIONES_URL}/notificaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinatario: telefono, canal: 'sms', mensaje })
    });
  } catch (error) {
    console.error('Aviso no enviado:', error.message);
  }
}

// ---------- Endpoints ----------

app.get('/health', (req, res) => {
  res.json({ estado: 'ok', servicio: 'reservas' });
});

app.get('/reservas', async (req, res) => {
  try {
    const result = await pool.query(`SELECT ${COLUMNAS} FROM reservas ORDER BY id`);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar reservas' });
  }
});

app.get('/reservas/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT ${COLUMNAS} FROM reservas WHERE id = $1`, [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar reserva' });
  }
});

app.post('/reservas', async (req, res) => {
  const { experiencia_id, turista_nombre, turista_email, fecha, personas } = req.body || {};
  if (!esEnteroPositivo(experiencia_id) || !esEnteroPositivo(personas) || !esFecha(fecha)
      || !turista_nombre || !turista_email) {
    return res.status(400).json({
      error: 'experiencia_id, turista_nombre, turista_email, fecha (AAAA-MM-DD) y personas son obligatorios'
    });
  }

  try {
    // 1. Validar la experiencia con el servicio de Experiencias
    const experiencia = await obtenerExperiencia(experiencia_id);
    if (!experiencia) {
      return res.status(400).json({ error: 'La experiencia indicada no existe' });
    }

    // 2. Calcular el total
    const total = Number(experiencia.precio) * Number(personas);

    // 3. Descontar cupos en el servicio de Disponibilidad
    const cupos = await cambiarCupos('reservar', experiencia_id, fecha, personas);
    if (cupos.status === 404 || cupos.status === 409) {
      return res.status(409).json({ error: 'Sin cupos disponibles para esa fecha' });
    }
    if (!cupos.ok) {
      throw new Error('Error al consultar el servicio de Disponibilidad');
    }

    // 4. Guardar la reserva (si falla, se devuelven los cupos)
    let reserva;
    try {
      const result = await pool.query(
        `INSERT INTO reservas (experiencia_id, turista_nombre, turista_email, fecha, personas, total)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNAS}`,
        [experiencia_id, turista_nombre, turista_email, fecha, personas, total]
      );
      reserva = result.rows[0];
    } catch (error) {
      await cambiarCupos('liberar', experiencia_id, fecha, personas);
      throw error;
    }

    // 5. Avisar al anfitrión mediante el servicio de Notificaciones
    await notificarAnfitrion(
      experiencia,
      `Nueva reserva #${reserva.id}: ${experiencia.titulo} el ${fecha} para ${personas} persona(s).`
    );

    // 6. Responder
    res.status(201).json(reserva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la reserva' });
  }
});

app.patch('/reservas/:id/confirmar', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE reservas SET estado = 'confirmada'
       WHERE id = $1 AND estado = 'pendiente' RETURNING ${COLUMNAS}`,
      [req.params.id]
    );
    if (result.rowCount === 1) {
      return res.json(result.rows[0]);
    }
    const existe = await pool.query('SELECT estado FROM reservas WHERE id = $1', [req.params.id]);
    if (existe.rowCount === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    res.status(409).json({ error: `No se puede confirmar una reserva ${existe.rows[0].estado}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al confirmar la reserva' });
  }
});

app.patch('/reservas/:id/cancelar', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE reservas SET estado = 'cancelada'
       WHERE id = $1 AND estado <> 'cancelada' RETURNING ${COLUMNAS}`,
      [req.params.id]
    );
    if (result.rowCount === 0) {
      const existe = await pool.query('SELECT 1 FROM reservas WHERE id = $1', [req.params.id]);
      if (existe.rowCount === 0) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }
      return res.status(409).json({ error: 'La reserva ya estaba cancelada' });
    }
    const reserva = result.rows[0];

    // Devolver los cupos en el servicio de Disponibilidad
    const cupos = await cambiarCupos('liberar', reserva.experiencia_id, reserva.fecha, reserva.personas);
    if (!cupos.ok) {
      console.error('No se pudieron liberar los cupos de la reserva', reserva.id);
    }

    // Avisar al anfitrión
    const experiencia = await obtenerExperiencia(reserva.experiencia_id);
    if (experiencia) {
      await notificarAnfitrion(
        experiencia,
        `Reserva #${reserva.id} cancelada: ${experiencia.titulo} el ${reserva.fecha}.`
      );
    }

    res.json(reserva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cancelar la reserva' });
  }
});

module.exports = app;
