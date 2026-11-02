const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

// Estas pruebas necesitan que Experiencias, Disponibilidad, Anfitriones y Notificaciones
// estén funcionando (se ejecutan dentro de Docker Compose).

const reservaValida = {
  experiencia_id: 2,
  turista_nombre: 'Turista de Prueba',
  turista_email: 'prueba@correo.com',
  fecha: '2026-12-02',
  personas: 1
};

// Consulta los cupos libres en el servicio de Disponibilidad
async function cuposLibres(experienciaId, fecha) {
  const response = await fetch(
    `${process.env.DISPONIBILIDAD_URL}/disponibilidad?experiencia_id=${experienciaId}&fecha=${fecha}`
  );
  const filas = await response.json();
  return filas[0].cupos_libres;
}

afterAll(async () => {
  await pool.end();
});

test('GET /health responde que el servicio está activo', async () => {
  const response = await request(app).get('/health');
  expect(response.statusCode).toBe(200);
  expect(response.body.servicio).toBe('reservas');
});

test('GET /reservas devuelve la lista de reservas', async () => {
  const response = await request(app).get('/reservas');
  expect(response.statusCode).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
  expect(response.body.length).toBeGreaterThan(0);
});

test('POST /reservas crea una reserva válida y cancelar libera los cupos', async () => {
  const libresAntes = await cuposLibres(2, '2026-12-02');

  const creada = await request(app).post('/reservas').send(reservaValida);
  expect(creada.statusCode).toBe(201);
  expect(creada.body.estado).toBe('pendiente');
  expect(Number(creada.body.total)).toBe(80);
  expect(await cuposLibres(2, '2026-12-02')).toBe(libresAntes - 1);

  const cancelada = await request(app).patch(`/reservas/${creada.body.id}/cancelar`);
  expect(cancelada.statusCode).toBe(200);
  expect(cancelada.body.estado).toBe('cancelada');
  expect(await cuposLibres(2, '2026-12-02')).toBe(libresAntes);

  await pool.query('DELETE FROM reservas WHERE id = $1', [creada.body.id]);
});

test('POST /reservas rechaza una experiencia inexistente', async () => {
  const response = await request(app)
    .post('/reservas')
    .send({ ...reservaValida, experiencia_id: 9999 });
  expect(response.statusCode).toBe(400);
  expect(response.body.error).toBe('La experiencia indicada no existe');
});

test('POST /reservas responde 409 cuando no hay cupos suficientes', async () => {
  const response = await request(app)
    .post('/reservas')
    .send({ ...reservaValida, personas: 999 });
  expect(response.statusCode).toBe(409);
});

test('POST /reservas rechaza datos incompletos', async () => {
  const response = await request(app)
    .post('/reservas')
    .send({ experiencia_id: 2, fecha: '2026-12-02', personas: 1 });
  expect(response.statusCode).toBe(400);
});

test('PATCH /reservas/9999/cancelar responde 404 si la reserva no existe', async () => {
  const response = await request(app).patch('/reservas/9999/cancelar');
  expect(response.statusCode).toBe(404);
});
