const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

afterAll(async () => {
  await pool.end();
});

test('GET /health responde que el servicio está activo', async () => {
  const response = await request(app).get('/health');
  expect(response.statusCode).toBe(200);
  expect(response.body.servicio).toBe('disponibilidad');
});

test('GET /disponibilidad filtra por experiencia y fecha', async () => {
  const response = await request(app).get('/disponibilidad?experiencia_id=3&fecha=2026-12-03');
  expect(response.statusCode).toBe(200);
  expect(response.body.length).toBe(1);
  expect(response.body[0].fecha).toBe('2026-12-03');
});

test('POST /disponibilidad/reservar descuenta cupos y /liberar los devuelve', async () => {
  const datos = { experiencia_id: 3, fecha: '2026-12-03', personas: 1 };

  const antes = await request(app).get('/disponibilidad?experiencia_id=3&fecha=2026-12-03');
  const libresAntes = antes.body[0].cupos_libres;

  const reserva = await request(app).post('/disponibilidad/reservar').send(datos);
  expect(reserva.statusCode).toBe(200);
  expect(reserva.body.cupos_libres).toBe(libresAntes - 1);

  const liberacion = await request(app).post('/disponibilidad/liberar').send(datos);
  expect(liberacion.statusCode).toBe(200);
  expect(liberacion.body.cupos_libres).toBe(libresAntes);
});

test('POST /disponibilidad/reservar responde 409 si no alcanzan los cupos', async () => {
  const response = await request(app)
    .post('/disponibilidad/reservar')
    .send({ experiencia_id: 3, fecha: '2026-12-03', personas: 999 });
  expect(response.statusCode).toBe(409);
  expect(response.body.error).toBe('Sin cupos suficientes');
});

test('POST /disponibilidad/reservar responde 404 si no hay cupos registrados para la fecha', async () => {
  const response = await request(app)
    .post('/disponibilidad/reservar')
    .send({ experiencia_id: 1, fecha: '2030-01-01', personas: 1 });
  expect(response.statusCode).toBe(404);
});

test('POST /disponibilidad/reservar rechaza datos incompletos', async () => {
  const response = await request(app)
    .post('/disponibilidad/reservar')
    .send({ experiencia_id: 1 });
  expect(response.statusCode).toBe(400);
});
